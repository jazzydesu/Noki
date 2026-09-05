# Noki: Sunset & Sunrise Quality Prediction App

I like sunsets, love 'em.


The annoying thing is you never know what sunset you're getting until it's already happening.

So I made Noki.

Noki looks at weather conditions and tries to answer a very simple question:

Is the sky going to be worth going outside for?

It turns atmospheric conditions into a 0–100 quality score, then tells you what actually pushed the prediction up or down.

It is not trying to mathematically define beauty. That would be stupid.

It is trying to find the conditions that tend to make a beautiful sky possible.

## Preview Images

![Preview 1](frontend/public/preview-1.png)
![Preview 2](frontend/public/preview-2.png)
![Preview 3](frontend/public/preview-3.png)

kinda cool right? :3 yea the UI is inspired from an unreleased project by Kanye west (ye) called yandhi, it has a beautiful cover.

## The Two Parts

There is the terminal part — the Python backend (`sunset_score/`) that runs in a terminal, takes weather data, and produces the score. That is the engine.

Then there is the actual app — the React frontend (`frontend/`) with CSS, UI design, mobile layout, and the interface people actually touch. That is what gets deployed. The terminal produces the prediction. The app makes it visible.

Both exist. They are separate. They work together.

## What Noki Actually Does

Noki takes several pieces of weather data that normally don't mean much on their own and puts them together into one prediction.

It looks at six factors:

- Total cloud cover
- Mid/high-level cloud structure
- Low cloud cover near the horizon
- Humidity
- Visibility
- Atmospheric timing and conditions

The point is not simply to produce a number.

If Noki gives you 85/100, you should be able to look at the result and understand why.

Maybe there is enough high cloud to catch the light.

Maybe the lower atmosphere is clear enough to leave the horizon visible.

Maybe visibility is excellent.

Or maybe the conditions are terrible and Noki tells you not to bother.

That's pretty much it. maybe it can help you get ur silly butt to catch some rays.

## Features

- Real-time location
- Six-factor sunset/sunrise analysis
- 0–100 quality prediction
- Explanations behind the prediction
- Mobile-optimized interface
- No account required

## Why I Made It

I just really like sunsets.

Eventually I started wondering whether those conditions could be recognized before the sunset actually happened.

So I made something to find out.

Noki is basically that question turned into a project:

Can I look at the atmosphere, make a prediction, and know whether tonight might be one of those nights?

Sometimes it'll be wrong.

That's fine.

The prediction is only half the point.

The other half is going outside and finding out.

## Project Structure

- `frontend/` - React app
- `src/` - Python backend

## Quick Start

```bash
$env:PYTHONPATH="src"
uvicorn sunset_score.api:app --reload
```

## Setup

1. Create and activate a virtual environment:

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

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set pythonpath:

   On macOS/Linux:
   ```bash
   export PYTHONPATH=src
   ```

   On Windows (PowerShell):
   ```powershell
   $env:PYTHONPATH="src"
   ```

## Run the API Server

```powershell
$env:PYTHONPATH="src"
uvicorn sunset_score.api:app --reload
```

Check:
```bash
curl http://127.0.0.1:8000/health
```

Request a score:
```bash
curl "http://127.0.0.1:8000/score?lat=37.7749&lon=-122.4194"
```

Invalid latitude:
```bash
curl "http://127.0.0.1:8000/score?lat=91&lon=-122.4194"
```

Cache is stored in `sunset_score.db` (60 minutes, safe to delete).

## CLI Usage

```bash
python -m sunset_score.cli 37.7749 -122.4194
```

Example output:
```
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

## Tests

```bash
pytest
```
