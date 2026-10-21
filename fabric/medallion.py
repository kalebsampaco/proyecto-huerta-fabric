from datetime import datetime, timedelta, timezone

from pyspark.sql import functions as F


SOURCE_TABLE = "datosCrudos.telemetry_bronze_raw"
SILVER_TABLE = "telemetry_silver"
QUARANTINE_TABLE = "telemetry_quarantine"
GOLD_TABLE = "telemetry_gold_daily"
DATE_TABLE = "dim_fecha"

raw = spark.read.table(SOURCE_TABLE)

normalized = (
    raw.withColumn("event_time", F.to_timestamp("event_time"))
    .withColumn("sequence_no", F.col("sequence_no").cast("long"))
    .withColumn("temperature_c", F.col("temperature_c").cast("double"))
    .withColumn("relative_humidity_pct", F.col("relative_humidity_pct").cast("double"))
    .withColumn("soil_moisture_pct", F.col("soil_moisture_pct").cast("double"))
    .withColumn("soil_ph", F.col("soil_ph").cast("double"))
    .withColumn("battery_pct", F.col("battery_pct").cast("double"))
    .withColumn("received_at", F.current_timestamp())
)

valid_condition = F.coalesce(
    F.col("event_id").isNotNull()
    & F.col("event_time").isNotNull()
    & F.col("sensor_id").isNotNull()
    & F.col("plot_id").isNotNull()
    & F.col("temperature_c").between(-10, 60)
    & F.col("relative_humidity_pct").between(0, 100)
    & F.col("soil_moisture_pct").between(0, 100)
    & F.col("soil_ph").between(0, 14)
    & F.col("battery_pct").between(0, 100),
    F.lit(False),
)

quarantine = normalized.filter(~valid_condition)
silver = normalized.filter(valid_condition).dropDuplicates(["event_id"])

quarantine.write.mode("overwrite").format("delta").saveAsTable(QUARANTINE_TABLE)
silver.write.mode("overwrite").format("delta").saveAsTable(SILVER_TABLE)

gold = (
    silver.withColumn("event_date", F.to_date("event_time"))
    .groupBy("event_date", "plot_id", "crop")
    .agg(
        F.count("event_id").alias("reading_count"),
        F.round(F.avg("temperature_c"), 2).alias("avg_temperature_c"),
        F.round(F.avg("relative_humidity_pct"), 2).alias("avg_relative_humidity_pct"),
        F.round(F.avg("soil_moisture_pct"), 2).alias("avg_soil_moisture_pct"),
        F.round(F.avg("soil_ph"), 2).alias("avg_soil_ph"),
        F.sum(F.when(F.col("soil_moisture_pct") < 30, 1).otherwise(0)).alias(
            "low_moisture_readings"
        ),
    )
)

gold.write.mode("overwrite").format("delta").saveAsTable(GOLD_TABLE)

gold_dates = gold.agg(
    F.min("event_date").alias("min_date"),
    F.max("event_date").alias("max_date"),
).first()

if gold_dates["min_date"] is None:
    raise ValueError("Gold no contiene fechas para crear la dimension calendario")

calendar_end = max(
    gold_dates["max_date"],
    datetime.now(timezone.utc).date() + timedelta(days=365),
)

calendar = spark.range(1).select(
    F.explode(
        F.sequence(
            F.lit(gold_dates["min_date"]).cast("date"),
            F.lit(calendar_end).cast("date"),
            F.expr("INTERVAL 1 DAY"),
        )
    ).alias("date")
)

calendar = (
    calendar.withColumn("year", F.year("date"))
    .withColumn("quarter", F.concat(F.lit("T"), F.quarter("date").cast("string")))
    .withColumn("month_number", F.month("date"))
    .withColumn(
        "month_name",
        F.create_map(
            F.lit(1), F.lit("enero"),
            F.lit(2), F.lit("febrero"),
            F.lit(3), F.lit("marzo"),
            F.lit(4), F.lit("abril"),
            F.lit(5), F.lit("mayo"),
            F.lit(6), F.lit("junio"),
            F.lit(7), F.lit("julio"),
            F.lit(8), F.lit("agosto"),
            F.lit(9), F.lit("septiembre"),
            F.lit(10), F.lit("octubre"),
            F.lit(11), F.lit("noviembre"),
            F.lit(12), F.lit("diciembre"),
        )[F.col("month_number")],
    )
    .withColumn("year_month", F.date_format("date", "yyyy-MM"))
)

calendar.write.mode("overwrite").format("delta").saveAsTable(DATE_TABLE)

print(f"Silver: {silver.count()} filas")
print(f"Cuarentena: {quarantine.count()} filas")
print(f"Gold: {gold.count()} filas")
print(f"Dimension calendario: {calendar.count()} fechas")