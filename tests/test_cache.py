import sqlite3
import time

from sunset_score import cache


def test_save_and_retrieve_cached_score(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "DB_PATH", tmp_path / "sunset_score.db")

    cache.save_score(37.77491, -122.41944, "7:57 PM", 84, ["Good canvas"])

    result = cache.get_cached_score(37.7749, -122.4194)

    assert result == {
        "event_time": "7:57 PM",
        "score": 84,
        "notes": ["Good canvas"],
        "forecast": [],
        "event": "sunset",
    }


def test_sunrise_and_sunset_cache_entries_do_not_collide(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "DB_PATH", tmp_path / "sunset_score.db")

    cache.save_score(37.7749, -122.4194, "7:57 PM", 84, ["sunset"], event="sunset")
    cache.save_score(37.7749, -122.4194, "6:15 AM", 72, ["sunrise"], event="sunrise")

    sunset = cache.get_cached_score(37.7749, -122.4194, event="sunset")
    sunrise = cache.get_cached_score(37.7749, -122.4194, event="sunrise")

    assert sunset["event"] == "sunset"
    assert sunset["event_time"] == "7:57 PM"
    assert sunrise["event"] == "sunrise"
    assert sunrise["event_time"] == "6:15 AM"


def test_cache_misses_for_new_location(tmp_path, monkeypatch):
    monkeypatch.setattr(cache, "DB_PATH", tmp_path / "sunset_score.db")

    assert cache.get_cached_score(0, 0) is None


def test_cache_expires_after_sixty_minutes(tmp_path, monkeypatch):
    db_path = tmp_path / "sunset_score.db"
    monkeypatch.setattr(cache, "DB_PATH", db_path)
    cache.save_score(37.77, -122.42, "7:57 PM", 84, ["Good canvas"])

    with sqlite3.connect(db_path) as connection:
        connection.execute(
            "UPDATE sunset_scores SET fetched_at = ? WHERE lat = ? AND lon = ?",
            (time.time() - cache.CACHE_TTL_SECONDS - 1, 37.77, -122.42),
        )
        connection.commit()

    assert cache.get_cached_score(37.77, -122.42) is None