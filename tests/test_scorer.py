import json
from pathlib import Path
import pytest

from sunset_score.scorer import find_event_index, find_sunset_index, score_sunset


@pytest.fixture
def sample_weather():
    """Load mock weather forecast JSON fixture."""
    fixture_path = Path(__file__).parent / "fixtures" / "sample_weather_response.json"
    with open(fixture_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_find_sunset_index(sample_weather):
    hourly_times = sample_weather["hourly"]["time"]
    sunset_time = sample_weather["daily"]["sunset"][0]

    idx = find_sunset_index(hourly_times, sunset_time)
    assert idx == 0

    # Test closest timestamp matching
    idx_close = find_sunset_index(hourly_times, "2026-08-19T19:25")
    assert idx_close == 0

    idx_later = find_sunset_index(hourly_times, "2026-08-19T20:15")
    assert idx_later == 1


def test_find_event_index_supports_sunrise():
    times = ["2026-08-19T05:00", "2026-08-19T06:15", "2026-08-19T07:00"]

    assert find_event_index(times, "2026-08-19T06:10") == 1


def test_high_score_scenario(sample_weather):
    hourly_data = sample_weather["hourly"]
    # Index 0 is designed to be ideal conditions
    score, notes = score_sunset(hourly_data, 0)

    assert score == 100
    assert any("Productive sky coverage" in note for note in notes)
    assert any("canvas" in note.lower() for note in notes)
    assert any("horizon clear" in note.lower() for note in notes)


def test_clear_sky_high_score():
    hourly_data = {
        "cloud_cover": [5],
        "cloud_cover_low": [3],
        "cloud_cover_mid": [0],
        "cloud_cover_high": [0],
        "relative_humidity_2m": [40],
        "visibility": [20000],
        "precipitation_probability": [0],
    }

    score, notes = score_sunset(hourly_data, 0)

    assert 80 <= score <= 99
    assert any("Crystal-clear skies" in note for note in notes)


def test_low_score_scenario(sample_weather):
    hourly_data = sample_weather["hourly"]
    # Index 1 is heavy overcast, rain, low visibility
    score, notes = score_sunset(hourly_data, 1)

    assert score <= 5
    assert any("block" in note.lower() for note in notes)
    assert any("precipitation" in note.lower() for note in notes)


def test_zero_cloud_edge_case(sample_weather):
    hourly_data = sample_weather["hourly"]
    # Index 2 has clear skies and high visibility, so it uses the clear-sky path.
    score, notes = score_sunset(hourly_data, 2)

    assert score == 92
    assert any("Crystal-clear skies" in note for note in notes)


def test_humidity_tapers_linearly_after_optimal_range():
    hourly_data = {
        "cloud_cover": [0],
        "cloud_cover_low": [0],
        "cloud_cover_mid": [0],
        "cloud_cover_high": [0],
        "relative_humidity_2m": [70],
        "visibility": [0],
        "precipitation_probability": [0],
    }

    score, _ = score_sunset(hourly_data, 0)

    assert score == 43


def test_humidity_is_zero_at_90_percent():
    hourly_data = {
        "cloud_cover": [0],
        "cloud_cover_low": [0],
        "cloud_cover_mid": [0],
        "cloud_cover_high": [0],
        "relative_humidity_2m": [90],
        "visibility": [0],
        "precipitation_probability": [0],
    }

    score, _ = score_sunset(hourly_data, 0)

    assert score == 36


def test_precipitation_penalty_applies_after_normalization():
    hourly_data = {
        "cloud_cover": [50],
        "cloud_cover_low": [0],
        "cloud_cover_mid": [50],
        "cloud_cover_high": [50],
        "relative_humidity_2m": [40],
        "visibility": [20000],
        "precipitation_probability": [50],
    }

    score, _ = score_sunset(hourly_data, 0)

    assert score == 85
