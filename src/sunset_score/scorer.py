from datetime import datetime

TOTAL_CLOUD_MAX = 10
CANVAS_MAX = 25
LOW_CLOUD_MAX = 20
HUMIDITY_MAX = 10
VISIBILITY_MAX = 10
TEMPERATURE_MAX = 15
MAX_POSITIVE_SCORE = sum(
    (TOTAL_CLOUD_MAX, CANVAS_MAX, LOW_CLOUD_MAX, HUMIDITY_MAX, VISIBILITY_MAX, TEMPERATURE_MAX)
)


def find_event_index(hourly_times: list[str], event_time: str) -> int:
    """Find the hourly data index closest to the given event (sunset/sunrise) time.

    Args:
        hourly_times (list[str]): List of ISO formatted timestamp strings.
        event_time (str): ISO formatted timestamp string for sunset or sunrise.

    Returns:
        int: Index of the closest hourly timestamp.

    Raises:
        ValueError: If hourly_times is empty or timestamps cannot be parsed.
    """
    if not hourly_times:
        raise ValueError("hourly_times list cannot be empty.")

    target_dt = datetime.fromisoformat(event_time)

    best_idx = 0
    min_diff = None

    for idx, t_str in enumerate(hourly_times):
        dt = datetime.fromisoformat(t_str)
        diff = abs((dt - target_dt).total_seconds())
        if min_diff is None or diff < min_diff:
            min_diff = diff
            best_idx = idx

    return best_idx


# Alias for backward compatibility
find_sunset_index = find_event_index


def score_sunset(hourly_data: dict, idx: int) -> tuple[int, list[str]]:
    """Score sunset potential for a specific hourly forecast entry.

    Args:
        hourly_data (dict): Dictionary containing Open-Meteo hourly arrays:
            - cloud_cover
            - cloud_cover_low
            - cloud_cover_mid
            - cloud_cover_high
            - relative_humidity_2m
            - visibility (in meters)
            - precipitation_probability
        idx (int): Hourly index to score.

    Returns:
        tuple[int, list[str]]:
            - Score clamped between 0 and 100.
            - List of plain-English explanation notes.
    """
    score = 0
    notes: list[str] = []

    total_cloud = hourly_data.get("cloud_cover", [0])[idx]
    mid_cloud = hourly_data.get("cloud_cover_mid", [0])[idx]
    high_cloud = hourly_data.get("cloud_cover_high", [0])[idx]
    low_cloud = hourly_data.get("cloud_cover_low", [0])[idx]
    humidity = hourly_data.get("relative_humidity_2m", [0])[idx]
    vis_meters = hourly_data.get("visibility", [0])[idx]
    vis_km = vis_meters / 1000.0 if vis_meters >= 100 else vis_meters
    precip_prob = hourly_data.get("precipitation_probability", [0])[idx]

    # 1. Mid + High Cloud Cover "The Canvas" (High cirrus or mid altocumulus catch vivid twilight light)
    max_upper_cloud = max(mid_cloud, high_cloud)
    combined_canvas = (mid_cloud + high_cloud) / 2.0

    if max_upper_cloud >= 30 or combined_canvas >= 25 or (mid_cloud + high_cloud) >= 40:
        score += 25
        if high_cloud >= 30 and mid_cloud < 20:
            notes.append(f"High cirrus clouds ({high_cloud}%) create ideal twilight color scattering")
        elif mid_cloud >= 30 and high_cloud < 20:
            notes.append(f"Mid-level altocumulus clouds ({mid_cloud}%) form a rich golden-hour canvas")
        else:
            notes.append(f"Excellent cloud canvas ({combined_canvas:.0f}% avg) structure for vibrant colors")
    elif total_cloud <= 20 and vis_km >= 12:
        score += 25
        notes.append(f"Crystal-clear skies with excellent visibility ({vis_km:.1f} km) suit a clean gradient sunset")
    elif max_upper_cloud >= 15 or combined_canvas >= 12:
        score += 18
        notes.append(f"Promising mid/high cloud patches ({max_upper_cloud}% max upper cloud)")
    elif 5 <= combined_canvas < 12:
        score += 10
        notes.append(f"Light mid/high cloud cover ({combined_canvas:.0f}%)")
    else:
        notes.append(f"Minimal upper cloud canvas ({combined_canvas:.0f}%)")

    # 2. Total Cloud Cover vs Overcast Risk
    if low_cloud <= 30 and total_cloud >= 25:
        score += 10
        notes.append(f"Productive sky coverage ({total_cloud}%) without heavy low overcast")
    elif total_cloud < 25 and low_cloud <= 25:
        score += 6
        notes.append(f"Sparse total cloud cover ({total_cloud}%) leaves mostly open sky")
    elif low_cloud <= 50:
        score += 4
        notes.append(f"Moderate cloud cover ({total_cloud}%) with partial horizon clearance")
    else:
        score += 1
        notes.append(f"Heavy total cloud cover ({total_cloud}%) with risk of overcast")

    # 3. Low Cloud Cover "Horizon Clearance" (<=25%: +20, 25-50%: +10, >50%: +0)
    if low_cloud <= 25:
        score += 20
        notes.append(f"Light low clouds ({low_cloud}%), keeping the horizon clear for direct sun rays")
    elif 25 < low_cloud <= 55:
        score += 10
        notes.append(f"Moderate low clouds ({low_cloud}%) may partially filter horizon light")
    else:
        notes.append(f"Heavy low clouds ({low_cloud}%) likely block the horizon sunbeam")

    # 4. Relative Humidity & Coastal Clarity
    if 25 <= humidity <= 55:
        score += 10
        notes.append(f"Optimal humidity ({humidity}%) for crisp, vivid twilight hues")
    elif vis_km >= 12 and humidity <= 82:
        # Coastal / marine moisture with high visibility produces brilliant scattering!
        score += 8
        notes.append(f"High coastal air clarity ({vis_km:.1f} km vis) balances moisture ({humidity}% RH)")
    elif humidity < 25:
        score += 7
        notes.append(f"Dry air ({humidity}%) offers crisp horizon visibility")
    else:
        humidity_score = max(0, round(10 * (95 - humidity) / 40))
        score += humidity_score
        notes.append(f"High atmospheric humidity ({humidity}%) may add haze")

    # 5. Visibility (>=15km: +10, 8-15km: +6, <8km: +0)
    if vis_km >= 15:
        score += 10
        notes.append(f"Excellent atmospheric visibility ({vis_km:.1f} km)")
    elif 8 <= vis_km < 15:
        score += 6
        notes.append(f"Moderate visibility ({vis_km:.1f} km)")
    else:
        notes.append(f"Reduced visibility ({vis_km:.1f} km)")

    # 6. Temperature-based color intensity (15°C-25°C: +15, 10-15°C or 25-30°C: +10, else: +0)
    temp_c = hourly_data.get("temperature_2m", [0])[idx]
    if 15 <= temp_c <= 25:
        score += 15
        notes.append(f"Optimal temperature ({temp_c:.1f}°C) for vibrant sunset colors")
    elif (10 <= temp_c < 15) or (25 < temp_c <= 30):
        score += 10
        notes.append(f"Good temperature ({temp_c:.1f}°C) for sunset color development")
    else:
        notes.append(f"Temperature ({temp_c:.1f}°C) may affect color intensity")

    normalized_score = round(score / MAX_POSITIVE_SCORE * 100)

    # 7. Precipitation Penalty (>=50%: -15, 30-49%: -8)
    if precip_prob >= 50:
        normalized_score -= 15
        notes.append(f"High precipitation chance ({precip_prob}%) reduces sunset visibility")
    elif 30 <= precip_prob < 50:
        normalized_score -= 8
        notes.append(f"Possible scattered rain ({precip_prob}%) may mute sunset colors")

    clamped_score = max(0, min(100, normalized_score))

    return clamped_score, notes
