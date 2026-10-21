import json
import logging
import os
import random
import signal
import threading
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from confluent_kafka import KafkaException, Producer


logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("huerta-simulator")
stop_event = threading.Event()
BACKFILL_BATCH_SIZE = 10000
delivery_error_count = 0
first_delivery_error = None


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Falta configurar {name} en el archivo .env")
    return value


def positive_int(name: str, default: int, allow_zero: bool = False) -> int:
    raw_value = os.getenv(name, str(default))
    try:
        value = int(raw_value)
    except ValueError as exc:
        raise ValueError(f"{name} debe ser un entero") from exc
    minimum = 0 if allow_zero else 1
    if value < minimum:
        raise ValueError(f"{name} debe ser mayor o igual a {minimum}")
    return value


def create_event(
    sensor_number: int,
    sequence: int,
    anomaly_every: int,
    event_timestamp: datetime | None = None,
    event_id: str | None = None,
) -> dict:
    sensor_id = f"SEN-{sensor_number:02d}"
    moisture = round(random.uniform(24.0, 68.0), 2)
    if anomaly_every and sequence % anomaly_every == 0:
        moisture = 125.0

    return {
        "event_id": event_id or str(uuid4()),
        "sequence_no": sequence,
        "event_time": (event_timestamp or datetime.now(timezone.utc)).isoformat(
            timespec="milliseconds"
        ),
        "sensor_id": sensor_id,
        "plot_id": f"PAR-{(sensor_number - 1) % 3 + 1:02d}",
        "crop": ["tomate", "maiz", "lechuga"][((sensor_number - 1) % 3)],
        "temperature_c": round(random.uniform(15.0, 36.0), 2),
        "relative_humidity_pct": round(random.uniform(28.0, 92.0), 2),
        "soil_moisture_pct": moisture,
        "soil_ph": round(random.uniform(5.2, 7.8), 2),
        "battery_pct": round(random.uniform(35.0, 100.0), 2),
    }


def iter_backfill_events(
    backfill_days: int,
    records_per_day: int,
    sensor_count: int,
    anomaly_every: int,
    today: date | None = None,
):
    utc_today = today or datetime.now(timezone.utc).date()
    sequence = 0

    for days_ago in range(backfill_days, 0, -1):
        event_day = utc_today - timedelta(days=days_ago)
        day_start = datetime(
            event_day.year,
            event_day.month,
            event_day.day,
            tzinfo=timezone.utc,
        )
        for record_index in range(records_per_day):
            sequence += 1
            event_timestamp = day_start + timedelta(
                seconds=record_index * 86400 // records_per_day
            )
            event_id = f"hist-{event_day:%Y%m%d}-{record_index + 1:04d}"
            sensor_number = record_index % sensor_count + 1
            yield create_event(
                sensor_number,
                sequence,
                anomaly_every,
                event_timestamp=event_timestamp,
                event_id=event_id,
            )


def on_delivery(error, message) -> None:
    global delivery_error_count, first_delivery_error
    if error is not None:
        delivery_error_count += 1
        if first_delivery_error is None:
            first_delivery_error = str(error)
            logger.error("Entrega fallida: %s", error)
        return
    logger.debug(
        "Evento enviado topic=%s partition=%s offset=%s",
        message.topic(),
        message.partition(),
        message.offset(),
    )


def publish_event(producer: Producer, topic: str, event: dict) -> None:
    payload = json.dumps(event, separators=(",", ":")).encode("utf-8")
    while True:
        try:
            producer.produce(
                topic,
                key=event["sensor_id"].encode("utf-8"),
                value=payload,
                on_delivery=on_delivery,
            )
            producer.poll(0)
            return
        except BufferError:
            logger.warning("Cola Kafka llena; esperando entregas antes de continuar")
            producer.poll(1)


def check_delivery_errors() -> None:
    if delivery_error_count:
        raise RuntimeError(
            f"Fallaron {delivery_error_count} entregas Kafka. "
            f"Primer error: {first_delivery_error}"
        )


def run_initial_backfill(
    producer: Producer,
    topic: str,
    backfill_days: int,
    records_per_day: int,
    sensor_count: int,
    anomaly_every: int,
    state_file: Path,
) -> None:
    if backfill_days == 0:
        logger.info("Backfill historico desactivado")
        return
    if state_file.exists():
        logger.info("Backfill ya completado; se omite para evitar duplicados")
        return

    total_events = backfill_days * records_per_day
    sent_events = 0
    state_file.parent.mkdir(parents=True, exist_ok=True)
    logger.info(
        "Iniciando backfill: %d dias, %d eventos por dia, %d eventos en total",
        backfill_days,
        records_per_day,
        total_events,
    )

    for event in iter_backfill_events(
        backfill_days,
        records_per_day,
        sensor_count,
        anomaly_every,
    ):
        if stop_event.is_set():
            break
        publish_event(producer, topic, event)
        sent_events += 1

        if sent_events % BACKFILL_BATCH_SIZE == 0:
            pending = producer.flush(120)
            if pending:
                raise RuntimeError(f"Quedaron {pending} eventos pendientes de entrega")
            check_delivery_errors()
            logger.info("Backfill enviado: %d/%d eventos", sent_events, total_events)

    pending = producer.flush(120)
    if pending:
        raise RuntimeError(f"Quedaron {pending} eventos pendientes de entrega")
    check_delivery_errors()

    if sent_events != total_events:
        logger.warning(
            "Backfill interrumpido (%d/%d); al reiniciar se reintentara",
            sent_events,
            total_events,
        )
        return

    marker = {
        "backfill_days": backfill_days,
        "records_per_day": records_per_day,
        "total_events": total_events,
        "completed_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    temporary_file = state_file.with_suffix(".tmp")
    temporary_file.write_text(json.dumps(marker), encoding="utf-8")
    temporary_file.replace(state_file)
    logger.info("Backfill completado y marcado: %d eventos", total_events)


def request_shutdown(_signal_number, _frame) -> None:
    stop_event.set()


def main() -> None:
    bootstrap_servers = required_env("KAFKA_BOOTSTRAP_SERVERS")
    topic = required_env("KAFKA_TOPIC")
    connection_string = required_env("KAFKA_CONNECTION_STRING")
    interval_seconds = positive_int("SIM_INTERVAL_SECONDS", 5)
    sensor_count = positive_int("SENSOR_COUNT", 4)
    anomaly_every = positive_int("ANOMALY_EVERY_N_EVENTS", 20, allow_zero=True)
    backfill_days = positive_int("BACKFILL_DAYS", 180, allow_zero=True)
    records_per_day = positive_int("BACKFILL_RECORDS_PER_DAY", 1000)
    state_file = Path(os.getenv("BACKFILL_STATE_FILE", "/data/backfill-complete.json"))

    producer = Producer(
        {
            "bootstrap.servers": bootstrap_servers,
            "security.protocol": "SASL_SSL",
            "sasl.mechanism": "PLAIN",
            "sasl.username": "$ConnectionString",
            "sasl.password": connection_string,
            "client.id": "huerta-sensor-simulator",
            "acks": "all",
            "message.timeout.ms": 30000,
            "retry.backoff.ms": 500,
        }
    )

    logger.info(
        "Simulador iniciado: sensors=%d interval=%ds topic=%s",
        sensor_count,
        interval_seconds,
        topic,
    )
    run_initial_backfill(
        producer,
        topic,
        backfill_days,
        records_per_day,
        sensor_count,
        anomaly_every,
        state_file,
    )

    sequence = 0

    while not stop_event.is_set():
        cycle_events = 0
        for sensor_number in range(1, sensor_count + 1):
            if stop_event.is_set():
                break
            sequence += 1
            event = create_event(sensor_number, sequence, anomaly_every)
            publish_event(producer, topic, event)
            cycle_events += 1

        pending = producer.flush(10)
        if pending:
            logger.warning("Quedaron %d mensajes pendientes de entrega", pending)
        check_delivery_errors()
        if cycle_events:
            logger.info("Ciclo en vivo completado: %d eventos", cycle_events)
        stop_event.wait(interval_seconds)

    logger.info("Cerrando productor Kafka")
    pending = producer.flush(10)
    if pending:
        logger.warning("Cierre con %d mensajes pendientes", pending)


signal.signal(signal.SIGTERM, request_shutdown)
signal.signal(signal.SIGINT, request_shutdown)

if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, ValueError, KafkaException):
        logger.exception("No se pudo iniciar el simulador")
        raise