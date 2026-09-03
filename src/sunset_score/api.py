from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from sunset_score.cache import get_cached_score, save_score
from sunset_score.cli import format_sunset_time
from sunset_score.scorer import find_event_index, score_sunset
from sunset_score.weather_client import fetch_weather


app = FastAPI(title="Sunset Score API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _local_now(data: dict) -> datetime:
    offset = data.get("utc_offset_seconds", 0)
    return _current_utc().replace(tzinfo=None) + timedelta(seconds=offset)


def _current_utc() -> datetime:
    return datetime.now(timezone.utc)


def _should_use_tomorrow(data: dict, event: str = "sunset") -> bool:
    events = data.get("daily", {}).get(event, [])
    if not events:
        raise ValueError(f"{event.capitalize()} time data not found in weather response.")
    return _local_now(data) > datetime.fromisoformat(events[0]) + timedelta(hours=2)


def _select_sunset(data: dict) -> tuple[str, bool]:
    return _select_sky_event(data, "sunset")


def _select_sky_event(data: dict, event: str = "sunset") -> tuple[str, bool]:
    events = data.get("daily", {}).get(event, [])
    if not events:
        raise ValueError(f"{event.capitalize()} time data not found in weather response.")

    now = _local_now(data)
    today_event = datetime.fromisoformat(events[0])
    if now <= today_event + timedelta(hours=2):
        return events[0], True
    if len(events) < 2:
        raise ValueError(f"Tomorrow's {event} data not found in weather response.")
    return events[1], False


def _build_five_day_forecast(data: dict, current_event_iso: str, event: str = "sunset") -> list[dict]:
    """Compute exact event scores and details for the upcoming 5 days."""
    events = data.get("daily", {}).get(event, [])
    hourly = data.get("hourly", {})
    hourly_times = hourly.get("time", [])

    if not events or not hourly_times:
        return []

    forecast_items = []
    # Find index of current target event
    try:
        start_idx = events.index(current_event_iso)
    except ValueError:
        start_idx = 0

    # Pick the next 5 days following the current primary forecast day
    upcoming_events = events[start_idx + 1: start_idx + 6]

    for event_iso in upcoming_events:
        try:
            event_dt = datetime.fromisoformat(event_iso)
            idx = find_event_index(hourly_times, event_iso)
            score, notes = score_sunset(hourly, idx)
            formatted_time = format_sunset_time(event_iso)
            day_name = event_dt.strftime("%a")
            short_date = f"{event_dt.strftime('%b')} {event_dt.day}"
            summary = notes[0] if notes else f"{event.capitalize()} forecast evaluated"

            forecast_items.append({
                "day_name": day_name,
                "short_date": short_date,
                "event_time": formatted_time,
                "score": score,
                "summary": summary,
                "sunset_iso": event_iso,
                "event": event,
            })
        except Exception:
            continue

    return forecast_items


@app.get("/score")
def get_score(lat: float, lon: float, event: str = "sunset", date: str | None = None) -> dict:
    if not -90 <= lat <= 90:
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90 degrees.")
    if not -180 <= lon <= 180:
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180 degrees.")

    event_type = event.lower().strip()
    if event_type not in ("sunset", "sunrise"):
        raise HTTPException(status_code=400, detail="Event must be either 'sunset' or 'sunrise'.")

    target_date = None
    if date:
        try:
            target_date = datetime.strptime(date.strip(), "%Y-%m-%d").date()
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Date must use the YYYY-MM-DD format.") from exc

    cached_result = None if target_date else get_cached_score(lat, lon, event=event_type)
    if cached_result is not None:
        cached_result = cached_result.copy()
        sunset_iso = cached_result.pop("sunset_iso", None)
        offset = cached_result.pop("utc_offset_seconds", 0) or 0
        if sunset_iso:
            now = _current_utc().replace(tzinfo=None) + timedelta(seconds=offset)
            cached_event = datetime.fromisoformat(sunset_iso)
            if now <= cached_event + timedelta(hours=2) or cached_event.date() > now.date():
                cached_result["is_today"] = cached_event.date() == now.date()
                if cached_result.get("forecast"):
                    return {"lat": lat, "lon": lon, "event": event_type, **cached_result, "cached": True}

    try:
        data = fetch_weather(lat, lon, forecast_days=7)
        if target_date is not None:
            daily_events = data.get("daily", {}).get(event_type, [])
            event_iso = next(
                (iso for iso in daily_events if datetime.fromisoformat(iso).date() == target_date),
                None,
            )
            if event_iso is None:
                raise ValueError(f"No {event_type} data available for {target_date.isoformat()}.")
            is_today = target_date == _local_now(data).date()
        else:
            event_iso, is_today = _select_sky_event(data, event=event_type)
        hourly = data.get("hourly", {})
        hourly_times = hourly.get("time", [])
        if not hourly_times:
            raise ValueError("Hourly forecast data not found in weather response.")

        event_idx = find_event_index(hourly_times, event_iso)
        score, notes = score_sunset(hourly, event_idx)
        formatted_time = format_sunset_time(event_iso)
        event_dt = datetime.fromisoformat(event_iso)
        event_date = f"{event_dt:%A, %B} {event_dt.day}"

        forecast = _build_five_day_forecast(data, event_iso, event=event_type)

        if target_date is None:
            save_score(
                lat,
                lon,
                formatted_time,
                score,
                notes,
                event_date=event_date,
                sunset_iso=event_iso,
                utc_offset_seconds=data.get("utc_offset_seconds", 0),
                forecast=forecast,
                event=event_type,
            )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Unable to retrieve or evaluate weather data: {exc}",
        ) from exc

    return {
        "lat": lat,
        "lon": lon,
        "event": event_type,
        "event_time": formatted_time,
        "event_date": event_date,
        "is_today": is_today,
        "score": score,
        "notes": notes,
        "forecast": forecast,
        "cached": False,
    }