# Noki v2 — Sunset Quality Classifier

**Predecessor:** [Noki v1](https://github.com/jazzydesu/Noki) — rule-based scoring. This project replaces it with a trained ML model.

## 1. Abstract
Noki v2 is a data science pipeline that predicts sunset visual quality (0-100 score) from high-resolution atmospheric forecast data. The goal is to benchmark against the published Peltier et al. (2015) univariate baseline (AUC 0.72) and the SunsetWx rule-based model (AUC 0.67).

## 2. Problem Statement
Predicting sunset quality is non-linear and multi-scale. Sunsets are driven by high-altitude cloud scattering, atmospheric clarity, and the absence of low-level cloud blockages. Most existing solutions are rule-based and rely on basic cloud cover metrics. This project builds a reproducible ML pipeline to extract rich thermodynamic features from Numerical Weather Prediction (NWP) data.

## 3. Data & Architecture
- **Source:** DWD ICON-EU (HuggingFace/S3). Free, CC BY 4.0.
- **Resolution:** 7km, 4 runs/day, hourly steps to 78h.
- **Pipeline:** AWS S3 Streaming (via `s3fs` and `fsspec`) → Feature Extraction (2-hour sunset window) → Parquet feature matrix.
- **Target Locations:** 8 cities across Europe/North Africa (Marrakech, Casablanca, Lisbon, Barcelona, Munich, London, Tromsø, Santorini).

## 4. Feature Engineering
We compute the astronomical sunset time via `ephem`, then extract a 2-hour window centered on sunset from the raw Zarr arrays. Key features:
- `clch` (high cloud cover), `clcm` (mid), `clcl` (low)
- `relhum_2m` (relative humidity)
- `u_10m`, `v_10m` (wind vectors for upwind cloud sampling)
- Surface pressure and 2m temperature

## 5. Methodology
- **Temporal Split:** No data leakage. Train/test splits are contiguous blocks of dates to prevent the model from learning future autocorrelation.
- **Baseline B1:** Logistic regression using only `relhum_2m` (The Peltier et al. baseline).
- **Primary Model:** Gradient Boosting (XGBoost) with SHAP explainability and calibration curves.
- **Labels:** Phase 1 uses physics-informed proxy labels. Phase 2 will incorporate human-rated sunset photos.

## 6. Current Status
- [x] Repo scaffolded
- [x] Environment setup (Python 3.12)
- [x] ETL pipeline: Sunset calculator + S3 streaming (code complete)
- [ ] Full 3-year backfill for 8 cities
- [ ] Model training & evaluation

## 7. Setup
1. Ensure Python 3.12 is installed.
2. `python -m venv .venv`
3. Activate the venv and run: `pip install xarray pandas numpy scikit-learn xgboost shap ephem loguru fastapi uvicorn pydantic pyarrow huggingface-hub ocf_blosc2 s3fs boto3`
