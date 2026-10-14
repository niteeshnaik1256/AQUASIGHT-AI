import pytest
from app.hydrology.first_flush import FirstFlushTracker


def test_first_flush_single_event_sufficient_volume():
    # 100 m² catchment, 1.0 mm depth => 100 L target
    tracker = FirstFlushTracker(catchment_area_sqm=100.0, first_flush_depth_mm=1.0, dry_period_days=3)

    res = tracker.step(rainfall_depth_mm=10.0, available_runoff_liters=900.0)
    assert res.is_new_event is True
    assert res.actual_diversion_liters == 100.0
    assert res.volume_post_first_flush_liters == 800.0


def test_first_flush_split_over_consecutive_rainy_days():
    # 100 m² catchment, 1.0 mm depth => 100 L target
    tracker = FirstFlushTracker(catchment_area_sqm=100.0, first_flush_depth_mm=1.0, dry_period_days=3)

    # Day 1: Only 40 L runoff available (insufficient for 100 L target)
    res_day1 = tracker.step(rainfall_depth_mm=1.0, available_runoff_liters=40.0)
    assert res_day1.is_new_event is True
    assert res_day1.actual_diversion_liters == 40.0
    assert res_day1.volume_post_first_flush_liters == 0.0

    # Day 2: Consecutive rain, 80 L runoff available
    # Remaining target is 100 - 40 = 60 L
    res_day2 = tracker.step(rainfall_depth_mm=2.0, available_runoff_liters=80.0)
    assert res_day2.is_new_event is False
    assert res_day2.actual_diversion_liters == 60.0
    assert res_day2.volume_post_first_flush_liters == 20.0

    # Day 3: Consecutive rain, 200 L runoff available
    # Target is already completely satisfied (0 L diversion)
    res_day3 = tracker.step(rainfall_depth_mm=5.0, available_runoff_liters=200.0)
    assert res_day3.is_new_event is False
    assert res_day3.actual_diversion_liters == 0.0
    assert res_day3.volume_post_first_flush_liters == 200.0


def test_dry_period_event_reset():
    tracker = FirstFlushTracker(catchment_area_sqm=100.0, first_flush_depth_mm=1.0, dry_period_days=3)

    # Event 1
    tracker.step(rainfall_depth_mm=10.0, available_runoff_liters=900.0)

    # 2 Dry days (not enough to reset dry_period_days = 3)
    tracker.step(rainfall_depth_mm=0.0, available_runoff_liters=0.0)
    tracker.step(rainfall_depth_mm=0.0, available_runoff_liters=0.0)

    # Rain on day 4 (still part of Event 1)
    res_mid = tracker.step(rainfall_depth_mm=5.0, available_runoff_liters=400.0)
    assert res_mid.is_new_event is False
    assert res_mid.actual_diversion_liters == 0.0

    # 3 Consecutive Dry days
    tracker.step(rainfall_depth_mm=0.0, available_runoff_liters=0.0)
    tracker.step(rainfall_depth_mm=0.0, available_runoff_liters=0.0)
    tracker.step(rainfall_depth_mm=0.0, available_runoff_liters=0.0)

    # New rain day triggers Event 2
    res_new = tracker.step(rainfall_depth_mm=8.0, available_runoff_liters=700.0)
    assert res_new.is_new_event is True
    assert res_new.actual_diversion_liters == 100.0
    assert res_new.volume_post_first_flush_liters == 600.0


def test_zero_first_flush_depth():
    tracker = FirstFlushTracker(catchment_area_sqm=100.0, first_flush_depth_mm=0.0)
    res = tracker.step(rainfall_depth_mm=10.0, available_runoff_liters=800.0)
    assert res.actual_diversion_liters == 0.0
    assert res.volume_post_first_flush_liters == 800.0


def test_missing_data_rejection():
    tracker = FirstFlushTracker(catchment_area_sqm=100.0)
    with pytest.raises(ValueError, match="missing data"):
        tracker.step(rainfall_depth_mm=None, available_runoff_liters=0.0)
