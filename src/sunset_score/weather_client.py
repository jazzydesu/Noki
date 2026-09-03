import requests

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def fetch_weather(lat: float, lon: float, forecast_days: int = 1) -> dict:
    """Fetch forecast weather data from Open-Meteo API.

    Args:
        lat (float): Latitude (-90.0 to 90.0)
        lon (float): Longitude (-180.0 to 180.0)
        forecast_days (int): Number of forecast days to request.

    Returns:
        dict: Parsed JSON response from Open-Meteo.

    Raises:
        RuntimeError: If request fails or API returns an error status code.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": (
            "cloud_cover,"
            "cloud_cover_low,"
            "cloud_cover_mid,"
            "cloud_cover_high,"
            "relative_humidity_2m,"
            "visibility,"
            "precipitation_probability,"
            "temperature_2m"
        ),
        "daily": "sunset,sunrise",
        "timezone": "auto",
        "forecast_days": forecast_days,
    }

    try:
        response = requests.get(OPEN_METEO_URL, params=params, timeout=10)
    except requests.RequestException as exc:
        raise RuntimeError(f"Network error while connecting to Open-Meteo API: {exc}") from exc

    if response.status_code != 200:
        raise RuntimeError(
            f"Open-Meteo API error (HTTP {response.status_code}): {response.text}"
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError("Failed to parse response from Open-Meteo API as JSON.") from exc

    if "error" in data and data["error"]:
        reason = data.get("reason", "Unknown API error")
        raise RuntimeError(f"Open-Meteo API error: {reason}")

    return data
