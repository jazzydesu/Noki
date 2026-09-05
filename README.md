# Noki - Sunset & Sunrise Quality Prediction App

Noki predicts sunset/sunrise quality using weather data. Get a 0-100 score with explanations.

## Preview Images

![Preview 1](frontend/public/preview-1.png)
![Preview 2](frontend/public/preview-2.png)
![Preview 3](frontend/public/preview-3.png)

## Features
- Real-time location
- 6-factor analysis
- Mobile optimized
- No account needed

## Quick Start
```bash
$env:PYTHONPATH="src"
uvicorn sunset_score.api:app --reload
```

## Structure
- `frontend/` - React app
- `src/` - Python backend 

## Setup

1. **Create and activate a virtual environment:**

   On macOS/Linux:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

   On Windows (PowerShell):
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set pythonpath (or install in editable mode):**

   On macOS/Linux:
   ```bash
   export PYTHONPATH=src
   ```

   On Windows (PowerShell):
   ```powershell
   $env:PYTHONPATH="src"
   ```

## Run the API Server

Start the FastAPI server from the project root:

```powershell
$env:PYTHONPATH="src"
uvicorn sunset_score.api:app --reload
```

Check that the server is running:

```bash
curl http://127.0.0.1:8000/health
```

Request a sunset score:

```bash
curl "http://127.0.0.1:8000/score?lat=37.7749&lon=-122.4194"
```

An invalid latitude returns a validation error:

```bash
curl "http://127.0.0.1:8000/score?lat=91&lon=-122.4194"
```

Score responses are cached locally for 60 minutes by rounded location. The
cache is stored in `sunset_score.db`, which is created automatically and is
safe to delete whenever you want to clear it.

## How to Run

Pass latitude and longitude as command-line arguments to the CLI module:

```bash
python -m sunset_score.cli 37.7749 -122.4194
```

Example Output:
```text
Sunset Quality Prediction
-------------------------
Sunset Time: 7:52 PM
Score: 85/100

Notes:
 - 50% total cloud cover is in the productive range
 - Good mid/high cloud canvas (60%) structure for color
 - Low cloud cover is light (10%), keeping the horizon clear
 - Optimal humidity (45%) for vibrant colors
 - Excellent visibility (20.0 km)
```

## How to Run Tests

Run `pytest` from the project root:

```bash
pytest
```
