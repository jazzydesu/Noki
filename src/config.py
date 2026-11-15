from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

LOCATIONS = {
	"marrakech": {"lat": 31.6, "lon": -8.0},
	"casablanca": {"lat": 33.6, "lon": -7.6},
	"lisbon": {"lat": 38.7, "lon": -9.1},
	"barcelona": {"lat": 41.4, "lon": 2.2},
	"munich": {"lat": 48.1, "lon": 11.6},
	"london": {"lat": 51.5, "lon": -0.1},
	"tromso": {"lat": 69.6, "lon": 18.9},
	"santorini": {"lat": 36.4, "lon": 25.4},
}

VARIABLES = [
	"clch",       # High cloud cover
	"clcm",       # Mid cloud cover
	"clcl",       # Low cloud cover
	"clct",       # Total cloud cover
	"relhum_2m",  # Relative humidity at 2 meters
	"u_10m",      # Wind U component
	"v_10m",      # Wind V component
	"t_2m",       # Temperature at 2 meters
	"sp",         # Surface pressure
]