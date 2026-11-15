import ephem
from datetime import datetime

def get_sunset(lat: float, lon: float, date_str: str) -> datetime:
    """
    Compute the UTC sunset time for a given lat/lon and date (YYYY-MM-DD).
    Returns None if the sun does not set (polar night).
    """
    obs = ephem.Observer()
    obs.lat = str(lat)
    obs.lon = str(lon)
    obs.date = date_str
    obs.pressure = 0
    
    sun = ephem.Sun()
    try:
        sunset = obs.next_setting(sun)
        return sunset.datetime()
    except Exception:
        return None