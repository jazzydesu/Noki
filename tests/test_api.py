import pytest

from fastapi import HTTPException

from sunset_score import api
from sunset_score.scorer import find_sunset_index as real_find_sunset_index


def test_health():
    assert api.health() == {"status": "ok"}


def test_score_rejects_invalid_latitude():
    with pytest.raises(HTTPException) as exc_info:
        api.get_score(91, 0)

    assert exc_info.value.status_code == 400
    assert "Latitude must be between" in exc_info.value.detail


def test_score_returns_existing_scorer_result(monkeypatch):
    weather = {
        "daily": {
            "sunset": [
                "2026-08-19T19:00",
                "2026-08-20T19:00",
                "2026-08-21T19:00",
                "2026-08-22T19:00",
                "2026-08-23T19:00",
                "2026-08-24T19:00",
            ]
        },
        "hourly": {
            "time": [
                "2026-08-19T19:00",
                "2026-08-20T19:00",
                "2026-08-21T19:00",
                "2026-08-22T19:00",
                "2026-08-23T19:00",
                "2026-08-24T19:00",
            ],
            "cloud_cover": [50, 40, 30, 20, 10, 5],
            "cloud_cover_low": [10, 10, 10, 10, 10, 5],
            "cloud_cover_mid": [60, 50, 40, 30, 20, 10],
            "cloud_cover_high": [60, 50, 40, 30, 20, 10],
            "relative_humidity_2m": [45, 45, 45, 45, 45, 45],
            "visibility": [20000, 20000, 20000, 20000, 20000, 20000],
            "precipitation_probability": [0, 0, 0, 0, 0, 0],
        },
    }
    monkeypatch.setattr(api, "get_cached_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "save_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "fetch_weather", lambda lat, lon, forecast_days=7: weather)
    monkeypatch.setattr(api, "_current_utc", lambda: api.datetime.fromisoformat("2026-08-19T12:00:00+00:00"))

    result = api.get_score(37.7749, -122.4194)

    assert result["lat"] == 37.7749
    assert result["lon"] == -122.4194
    assert result["event_time"] == "7:00 PM"
    assert result["event_date"] == "Wednesday, August 19"
    assert result["is_today"] is True
    assert result["score"] == 100
    assert result["cached"] is False
    assert len(result["forecast"]) == 5
    assert result["forecast"][0]["day_name"] == "Thu"


def test_score_returns_cached_result_without_fetching(monkeypatch):
    cached_result = {
        "event_time": "7:00 PM",
        "event_date": "Wednesday, August 19",
        "sunset_iso": "2026-08-19T19:00",
        "utc_offset_seconds": 0,
        "score": 84,
        "notes": ["cached note"],
        "forecast": [{"day_name": "Thu", "score": 88}],
    }
    monkeypatch.setattr(api, "get_cached_score", lambda *args, **kwargs: cached_result)
    monkeypatch.setattr(
        api,
        "fetch_weather",
        lambda lat, lon, forecast_days=7: pytest.fail("fetch_weather should not run for a cache hit"),
    )
    monkeypatch.setattr(api, "_current_utc", lambda: api.datetime.fromisoformat("2026-08-19T20:00:00+00:00"))

    result = api.get_score(37.7749, -122.4194)

    assert result == {
        "lat": 37.7749,
        "lon": -122.4194,
        "event": "sunset",
        "event_time": cached_result["event_time"],
        "event_date": cached_result["event_date"],
        "score": cached_result["score"],
        "notes": cached_result["notes"],
        "forecast": cached_result["forecast"],
        "is_today": True,
        "cached": True,
    }


def test_score_converts_upstream_failure_to_502(monkeypatch):
    def raise_upstream_error(lat, lon, forecast_days=7):
        raise RuntimeError("Open-Meteo unavailable")

    monkeypatch.setattr(api, "fetch_weather", raise_upstream_error)

    with pytest.raises(HTTPException) as exc_info:
        api.get_score(0, 0)

    assert exc_info.value.status_code == 502
    assert "Open-Meteo unavailable" in exc_info.value.detail


def test_score_uses_todays_sunset_before_cutoff(monkeypatch):
    weather = {
        "utc_offset_seconds": 0,
        "daily": {"sunset": ["2026-08-19T19:00"]},
        "hourly": {"time": ["2026-08-19T19:00"], "cloud_cover": [0], "cloud_cover_low": [0], "cloud_cover_mid": [0], "cloud_cover_high": [0], "relative_humidity_2m": [40], "visibility": [20000], "precipitation_probability": [0]},
    }
    monkeypatch.setattr(api, "get_cached_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "fetch_weather", lambda lat, lon, forecast_days=7: weather)
    monkeypatch.setattr(api, "save_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "_current_utc", lambda: api.datetime.fromisoformat("2026-08-19T20:00:00+00:00"))

    result = api.get_score(0, 0)

    assert result["event_date"] == "Wednesday, August 19"
    assert result["is_today"] is True


def test_score_uses_tomorrows_sunset_after_cutoff(monkeypatch):
    weather = {
        "utc_offset_seconds": 0,
        "daily": ["2026-08-19T19:00", "2026-08-20T19:01"],
        "daily": {"sunset": ["2026-08-19T19:00", "2026-08-20T19:01"]},
        "hourly": {"time": ["2026-08-20T19:00"], "cloud_cover": [0], "cloud_cover_low": [0], "cloud_cover_mid": [0], "cloud_cover_high": [0], "relative_humidity_2m": [40], "visibility": [20000], "precipitation_probability": [0]},
    }
    requested_days = []
    monkeypatch.setattr(api, "get_cached_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "fetch_weather", lambda lat, lon, forecast_days=7: requested_days.append(forecast_days) or weather)
    monkeypatch.setattr(api, "save_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "_current_utc", lambda: api.datetime.fromisoformat("2026-08-19T22:01:00+00:00"))

    result = api.get_score(0, 0)

    assert requested_days == [7]
    assert result["event_date"] == "Thursday, August 20"
    assert result["is_today"] is False


def test_tomorrow_path_scores_hour_closest_to_tomorrows_sunset(monkeypatch):
    tomorrow_times = [
        "2026-08-19T19:00",
        "2026-08-20T18:00",
        "2026-08-20T19:01",
        "2026-08-20T22:00",
    ]
    weather = {
        "utc_offset_seconds": 0,
        "daily": {"sunset": ["2026-08-19T19:00", "2026-08-20T19:00"]},
        "hourly": {
            "time": tomorrow_times,
            "cloud_cover": [99, 10, 50, 90],
            "cloud_cover_low": [99, 10, 10, 90],
            "cloud_cover_mid": [0, 0, 60, 0],
            "cloud_cover_high": [0, 0, 60, 0],
            "relative_humidity_2m": [99, 20, 45, 99],
            "visibility": [100, 20000, 20000, 100],
            "precipitation_probability": [100, 0, 0, 100],
        },
    }
    selected = {}
    requested_days = []

    def capture_index(hourly_times, sunset_time):
        selected["times"] = hourly_times
        selected["sunset_time"] = sunset_time
        selected["index"] = real_find_sunset_index(hourly_times, sunset_time)
        return selected["index"]

    monkeypatch.setattr(api, "get_cached_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "fetch_weather", lambda lat, lon, forecast_days=7: requested_days.append(forecast_days) or weather)
    monkeypatch.setattr(api, "find_event_index", capture_index)
    monkeypatch.setattr(api, "save_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "_current_utc", lambda: api.datetime.fromisoformat("2026-08-19T22:01:00+00:00"))

    api.get_score(0, 0)

    assert requested_days == [7]
    assert selected["sunset_time"] == "2026-08-20T19:00"
    assert selected["index"] == 2
    assert selected["times"][selected["index"]] == "2026-08-20T19:01"


def test_score_supports_sunrise_event(monkeypatch):
    weather = {
        "utc_offset_seconds": 0,
        "daily": {
            "sunrise": ["2026-08-19T06:15", "2026-08-20T06:14"],
            "sunset": ["2026-08-19T19:30", "2026-08-20T19:29"],
        },
        "hourly": {
            "time": ["2026-08-19T06:15", "2026-08-19T19:30", "2026-08-20T06:14", "2026-08-20T19:29"],
            "cloud_cover": [40, 90, 40, 90],
            "cloud_cover_low": [5, 90, 5, 90],
            "cloud_cover_mid": [50, 0, 50, 0],
            "cloud_cover_high": [50, 0, 50, 0],
            "relative_humidity_2m": [40, 90, 40, 90],
            "visibility": [20000, 5000, 20000, 5000],
            "precipitation_probability": [0, 80, 0, 80],
        },
    }
    monkeypatch.setattr(api, "get_cached_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "save_score", lambda *args, **kwargs: None)
    monkeypatch.setattr(api, "fetch_weather", lambda *args, **kwargs: weather)
    monkeypatch.setattr(api, "_current_utc", lambda: api.datetime.fromisoformat("2026-08-19T05:00:00+00:00"))

    result = api.get_score(37.7749, -122.4194, event="sunrise")

    assert result["event"] == "sunrise"
    assert result["event_time"] == "6:15 AM"
    assert result["event_date"] == "Wednesday, August 19"
    assert result["is_today"] is True
    assert len(result["forecast"]) == 1