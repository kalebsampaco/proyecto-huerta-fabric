import unittest
from collections import Counter
from datetime import date, datetime, timezone

from app.__main__ import create_event, iter_backfill_events


class BackfillTests(unittest.TestCase):
    def test_backfill_covers_previous_days_and_has_deterministic_ids(self):
        events = list(
            iter_backfill_events(
                backfill_days=3,
                records_per_day=4,
                sensor_count=2,
                anomaly_every=0,
                today=date(2026, 10, 20),
            )
        )

        self.assertEqual(len(events), 12)
        self.assertEqual(events[0]["event_time"], "2026-10-17T00:00:00.000+00:00")
        self.assertEqual(events[-1]["event_time"], "2026-10-19T18:00:00.000+00:00")
        self.assertEqual(len({event["event_id"] for event in events}), 12)
        self.assertTrue(all(event["event_id"].startswith("hist-") for event in events))

    def test_backfill_generates_180_days_with_1000_rows_per_day(self):
        event_counts = Counter(
            datetime.fromisoformat(event["event_time"]).date()
            for event in iter_backfill_events(
                backfill_days=180,
                records_per_day=1000,
                sensor_count=4,
                anomaly_every=0,
                today=date(2026, 10, 20),
            )
        )

        self.assertEqual(len(event_counts), 180)
        self.assertEqual(sum(event_counts.values()), 180000)
        self.assertTrue(all(count == 1000 for count in event_counts.values()))
        self.assertNotIn(date(2026, 10, 20), event_counts)

    def test_event_accepts_historical_timestamp(self):
        timestamp = datetime(2026, 4, 20, 12, tzinfo=timezone.utc)
        event = create_event(1, 1, 0, event_timestamp=timestamp, event_id="hist-test")

        self.assertEqual(event["event_id"], "hist-test")
        self.assertEqual(event["event_time"], "2026-04-20T12:00:00.000+00:00")


if __name__ == "__main__":
    unittest.main()