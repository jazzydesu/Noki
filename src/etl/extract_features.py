import fsspec
import ocf_blosc2
import xarray as xr
from src.config import LOCATIONS, VARIABLES
from src.etl.compute_sunset import get_sunset

def extract_daily_features(city_name: str, date_str: str) -> dict:
    lat = LOCATIONS[city_name]["lat"]
    lon = LOCATIONS[city_name]["lon"]
    
    sunset_time = get_sunset(lat, lon, date_str)
    if sunset_time is None:
        return None
        
    print(f"[{city_name}] Sunset on {date_str} is at {sunset_time} UTC")
    
    year, month, day = date_str.split("-")
    s3_zip_path = f"s3://openclimatefix/dwd-icon-eu/data/{int(year)}/{int(month)}/{int(day)}/{year}{month}{day}12.zarr.zip"
    
    print(f"Streaming from {s3_zip_path}...")
    
    try:
        # Create a zip filesystem over anonymous S3
        fs = fsspec.filesystem("zip", fo=s3_zip_path, target_options={"anon": True})
        
        # Map the root of the zip to xarray
        mapper = fs.get_mapper("")
        
        # Open the Zarr store
        ds = xr.open_zarr(mapper, consolidated=True)
        
        city_ds = ds.sel(latitude=lat, longitude=lon, method="nearest")
        window = city_ds.sel(step=slice(6, 10))
        
        features = {"city": city_name, "date": date_str}
        
        for var in VARIABLES:
            if var in window:
                features[f"{var}_mean"] = float(window[var].mean().values)
                
        ds.close()
        return features
        
    except Exception as e:
        print(f"Error extracting {city_name} on {date_str}: {e}")
        return None

if __name__ == "__main__":
    result = extract_daily_features("marrakech", "2023-06-15")
    print("\n--- Extracted Features ---")
    if result:
        for k, v in result.items():
            print(f"{k}: {v}")
