# Noki Sunset Quality Classifier

> **Parent:** Noki (Bite-size), which employed a simple rule-based scoring engine. Noki v2 trains its predictions with machine learning models.

## Abstract

Noki v2 employs high-resolution forecasts to score sunsets on a 0–100 scale.

The objective is determining whether a model trained on detailed atmospheric factors outperforms simpler alternatives, starting with the Peltier et al. (2015) baseline univariate model (AUC 0.72) and the SunsetWx rule-based model (AUC 0.67).

## Problem

Sunset quality doesn't correlate directly to cloud coverage. Cloud positions, atmospheric transparency, humidity levels, winds, and lower-level cloud occlusions all factor into sunset aesthetics. Simplifying everything down to one of a few metrics for cloud cover results in substantial loss of context.

By leveraging Numerical Weather Prediction (NWP) forecasts, Noki extracts atmospheric characteristics and converts them into features.

## Data & Architecture

| Property | Value |
|----------|-------|
| Data source | DWD ICON-EU (HuggingFace/S3) |
| License | CC BY 4.0 |
| Resolution | 7 km |
| Forecast cycles | 4 daily runs |
| Forecast horizon | Hourly steps until 78 hours |

**Architecture:** AWS S3 → Stream → Feature Extraction → Parquet

Stream processing employs `s3fs` and `fsspec` libraries. Feature extraction isolates astronomical sunset timing.

**Target locations:** Marrakech, Casablanca, Lisbon, Barcelona, Munich, London, Tromsø, Santorini

Locations representing diverse climates, latitudes, and atmospheres.

## Features

Features include: Astronomically-computed sunset timings using `ephem` library.

Two-hour period surrounding actual sunset extracted from raw zarr data.

**Feature Set:**

| Variable | Description |
|----------|-------------|
| `clch` | High cloud cover |
| `clcm` | Mid-level cloud cover |
| `clcl` | Low cloud cover |
| `relhum_2m` | Relative humidity |
| `u_10m`, `v_10m` | U, V wind vectors for upwind cloud sampling |
| Surface pressure | Atmospheric surface pressure |
| 2m temperature | Atmospheric temperature |

This feature set attempts to represent atmospheric qualities other than mere cloud coverage, particularly distinguishing high-altitude clouds, which influence the appearance of the sunset sky, from low-altitude clouds, which obstruct visibility.

## Methods

- **Split Strategy:** Contiguous block dates ensure no temporal leakage from adjacent samples.
- **Baseline (B1):** Logistic regression on single input variable `relhum_2m`, mirroring the Peltier et al. baseline.
- **Primary Model:** Gradient boosting using XGBoost, with SHAP values to determine features and probability calibration.

## Labels

- **Phase I:** Physically-driven synthetic label generation
- **Phase II:** Human-scored sunset image ratings

Phase I establishes framework and preliminary performance metric, whereas Phase II provides better qualitative feedback based on actual sunsets.

## Status

- [x] Project scaffold complete
- [x] Python 3.12 environment created
- [x] Sunset calculation module complete
- [x] S3 stream processing pipeline implemented
- [ ] Historical three year dataset compiled across 8 cities
- [ ] Model training &   
