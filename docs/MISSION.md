# Noki v2 — Mission

## What this is
A machine learning pipeline that predicts sunset visual quality (0–100 score) from atmospheric forecast data. The output is interpretable, calibrated, and evaluated rigorously against published baselines.

## Success criterion
Beat **AUC 0.72** on a temporal hold-out test set.

Reference points (both are published and checkable):
- **0.72** — Stanford (Peltier et al. 2015), humidity-only logistic regression. This is the number to beat.
- **0.67** — SunsetWx, rule-based, used by 20+ TV stations.

If your model does not beat 0.72, the pipeline is not done.

## Non-negotiables
1. **Temporal split only.** Weather is autocorrelated. A random split leaks future into train and inflates AUC. This is the #1 mistake in weather ML. Every train/val/test split must be a contiguous block of dates.
2. **B1 is the gate.** Every model is compared against B1: logistic regression on `relhum_2m` alone. If a model can't beat B1, the features are wrong, not the model.
3. **Honest failure modes.** If the model performs worse in winter, or at high latitude, say so in the report. Do not hide it.

## Data source
- DWD ICON-EU archive on HuggingFace: `openclimatefix/dwd-icon-eu`
- Free, CC BY 4.0, no API key
- Coverage: 2023-03 → present, 4 init times/day, hourly steps to 78h
- Core variables: `clch`, `clcm`, `clcl` (high/mid/low cloud), `relhum_2m`, `u_10m`, `v_10m`. Additional pressure-level variables (humidity, temperature, geopotential) available.
- Access details will be given in a later directive. Do not explore data sources yet.

## Deliverables (in order)
1. ETL → feature matrix (parquet)
2. Baselines (B1 mandatory; others as specified later)
3. Primary model (GBM) with hyperparameter search
4. SHAP explainability + calibration curve
5. FastAPI serving layer (headless)
6. Streamlit dashboard (only after API works)
7. README as a technical report — the README is the portfolio piece, not the code

## Engineering constraints
- Python 3.11+
- Type hints on all function signatures
- Fixed random seeds everywhere
- `loguru` or `structlog` for logging
- No hardcoded paths — use `pathlib` and `src/config.py`
- No data leakage (see non-negotiables)

## Current status
Scaffolding. No ETL, no models, no data yet.