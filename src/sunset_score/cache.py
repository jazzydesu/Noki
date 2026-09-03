import json
from pathlib import Path
import sqlite3
import time


DB_PATH = Path("sunset_score.db")
CACHE_TTL_SECONDS = 60 * 60


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    columns = {row[1] for row in connection.execute("PRAGMA table_info(sunset_scores)")}
    primary_key = [row[1] for row in connection.execute("PRAGMA table_info(sunset_scores)") if row[5]]
    if columns and ("event" not in columns or primary_key != ["lat", "lon", "event"]):
        connection.execute("ALTER TABLE sunset_scores RENAME TO sunset_scores_legacy")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS sunset_scores (
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            event TEXT NOT NULL DEFAULT 'sunset',
            sunset_time TEXT NOT NULL,
            sunset_date TEXT,
            sunset_iso TEXT,
            utc_offset_seconds INTEGER,
            score INTEGER NOT NULL,
            notes TEXT NOT NULL,
            forecast_json TEXT,
            fetched_at REAL NOT NULL,
            PRIMARY KEY (lat, lon, event)
        )
        """
    )
    if columns and ("event" not in columns or primary_key != ["lat", "lon", "event"]):
        legacy_columns = {row[1] for row in connection.execute("PRAGMA table_info(sunset_scores_legacy)")}
        sunset_date = "sunset_date" if "sunset_date" in legacy_columns else "NULL"
        sunset_iso = "sunset_iso" if "sunset_iso" in legacy_columns else "NULL"
        utc_offset = "utc_offset_seconds" if "utc_offset_seconds" in legacy_columns else "0"
        forecast_json = "forecast_json" if "forecast_json" in legacy_columns else "NULL"
        connection.execute(
            f"""
            INSERT INTO sunset_scores
                (lat, lon, event, sunset_time, sunset_date, sunset_iso, utc_offset_seconds, score, notes, forecast_json, fetched_at)
            SELECT lat, lon, 'sunset', sunset_time, {sunset_date}, {sunset_iso}, {utc_offset}, score, notes, {forecast_json}, fetched_at
            FROM sunset_scores_legacy
            """
        )
        connection.execute("DROP TABLE sunset_scores_legacy")
    connection.commit()
    return connection


def get_cached_score(lat: float, lon: float, event: str = "sunset") -> dict | None:
    rounded_lat = round(lat, 2)
    rounded_lon = round(lon, 2)
    event_type = event.lower().strip()
    cutoff = time.time() - CACHE_TTL_SECONDS

    with _connect() as connection:
        row = connection.execute(
            """
            SELECT sunset_time, sunset_date, sunset_iso, utc_offset_seconds, score, notes, forecast_json, event
            FROM sunset_scores
            WHERE lat = ? AND lon = ? AND (event = ? OR event IS NULL) AND fetched_at >= ?
            """,
            (rounded_lat, rounded_lon, event_type, cutoff),
        ).fetchone()

    if row is None:
        return None

    result = {
        "event_time": row[0],
        "score": row[4],
        "notes": json.loads(row[5]),
        "event": row[7] or event_type,
    }
    if row[2] is not None:
        result.update(
            {
                "event_date": row[1],
                "sunset_iso": row[2],
                "utc_offset_seconds": row[3],
            }
        )
    if len(row) > 6 and row[6]:
        try:
            result["forecast"] = json.loads(row[6])
        except (json.JSONDecodeError, TypeError):
            result["forecast"] = []
    else:
        result["forecast"] = []

    return result


def save_score(
    lat: float,
    lon: float,
    event_time: str,
    score: int,
    notes: list[str],
    event_date: str | None = None,
    sunset_iso: str | None = None,
    utc_offset_seconds: int = 0,
    forecast: list[dict] | None = None,
    event: str = "sunset",
) -> None:
    rounded_lat = round(lat, 2)
    rounded_lon = round(lon, 2)
    event_type = event.lower().strip()

    with _connect() as connection:
        connection.execute(
            """
            INSERT OR REPLACE INTO sunset_scores
                (lat, lon, event, sunset_time, sunset_date, sunset_iso, utc_offset_seconds, score, notes, forecast_json, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rounded_lat,
                rounded_lon,
                event_type,
                event_time,
                event_date or "",
                sunset_iso,
                utc_offset_seconds,
                score,
                json.dumps(notes),
                json.dumps(forecast or []),
                time.time(),
            ),
        )
        connection.commit()