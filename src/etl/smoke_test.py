import os
import zipfile
import xarray as xr
import ocf_blosc2
from huggingface_hub import hf_hub_download

def main():
    repo_id = "openclimatefix/dwd-icon-eu"
    filename = "data/2023/6/15/20230615_18.zarr.zip"
    
    print("Locating file in HuggingFace cache...")
    # Get the 16GB file from the cache (takes 0.1 seconds)
    local_zip = hf_hub_download(repo_id=repo_id, filename=filename, repo_type="dataset")
    
    # Create a folder to hold the extracted data
    extract_dir = "data/raw/extracted_zarr"
    os.makedirs(extract_dir, exist_ok=True)
    
    print("Extracting zip file to local folder... (this may take 1-2 minutes)")
    # Unzip the file safely
    with zipfile.ZipFile(local_zip, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
        
    print("Opening Zarr folder...")
    # Open the extracted folder directly. No zip bugs!
    ds = xr.open_zarr(extract_dir)
    
    print("\n--- Available Variables ---")
    for var in ds.data_vars:
        print(f"  - {var}")
        
    print(f"\n--- Dimensions ---")
    print(ds.sizes)
    
    ds.close()
    print("\nSmoke test passed! We can read the data.")

if __name__ == "__main__":
    main()