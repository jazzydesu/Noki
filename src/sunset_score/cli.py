from datetime import datetime
import sys

from sunset_score.scorer import find_sunset_index, score_sunset
from sunset_score.weather_client import fetch_weather


def format_sunset_time(sunset_iso: str) -> str:
    """Format an ISO sunset timestamp to 12-hour format (e.g., '7:52 PM')."""
    dt = datetime.fromisoformat(sunset_iso)
    # Formats e.g. "07:52 PM", then strip leading zero from hour
    formatted = dt.strftime("%I:%M %p")
    if formatted.startswith("0"):
        formatted = formatted[1:]
    return formatted


def main():
    """CLI entry point for predicting sunset quality."""
    if len(sys.argv) != 3:
        print("Error: Invalid number of arguments.", file=sys.stderr)
        print("Usage: python -m sunset_score.cli <latitude> <longitude>", file=sys.stderr)
        sys.exit(1)

    try:
        lat = float(sys.argv[1])
        lon = float(sys.argv[2])
    except ValueError:
        print("Error: Latitude and longitude must be valid numerical values.", file=sys.stderr)
        sys.exit(1)

    if not (-90 <= lat <= 90):
        print("Error: Latitude must be between -90 and 90 degrees.", file=sys.stderr)
        sys.exit(1)

    if not (-180 <= lon <= 180):
        print("Error: Longitude must be between -180 and 180 degrees.", file=sys.stderr)
        sys.exit(1)

    try:
        data = fetch_weather(lat, lon)
    except Exception as exc:
        print(f"Error fetching weather data: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        daily_sunset_list = data.get("daily", {}).get("sunset", [])
        if not daily_sunset_list:
            print("Error: Sunset time data not found in weather response.", file=sys.stderr)
            sys.exit(1)

        sunset_iso = daily_sunset_list[0]
        formatted_time = format_sunset_time(sunset_iso)

        hourly = data.get("hourly", {})
        hourly_times = hourly.get("time", [])
        if not hourly_times:
            print("Error: Hourly forecast data not found in weather response.", file=sys.stderr)
            sys.exit(1)

        sunset_idx = find_sunset_index(hourly_times, sunset_iso)
        score, notes = score_sunset(hourly, sunset_idx)

        print(f"Sunset Quality Prediction")
        print(f"-------------------------")
        print(f"Sunset Time: {formatted_time}")
        print(f"Score: {score}/100\n")
        print("Notes:")
        for note in notes:
            print(f" - {note}")

    except Exception as exc:
        print(f"Error evaluating sunset quality: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
