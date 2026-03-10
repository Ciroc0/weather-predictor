#!/usr/bin/env python3
"""
Generate history snapshot with ML backtest predictions.
This script loads the training matrix and runs ML models on historical data
to create a snapshot with both DMI and ML values for the last 7 days.
"""

import json
import pickle
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import numpy as np

# Paths
HF_DIR = Path(__file__).parent.parent / "hf"
DATASETS_DIR = HF_DIR / "datasets"
PREDICTIONS_DIR = DATASETS_DIR / "dmi-aarhus-predictions"
WEATHER_DIR = DATASETS_DIR / "dmi-aarhus-weather-data"

# Model files mapping
MODEL_FILES = {
    "temperature": "temperature_models.pkl",
    "wind_speed": "wind_speed_models.pkl", 
    "wind_gust": "wind_gust_models.pkl",
    "rain_event": "rain_event_models.pkl",
    "rain_amount": "rain_amount_models.pkl",
}

COPENHAGEN_TZ = "Europe/Copenhagen"
HISTORY_WINDOW_DAYS = 7
FUTURE_WINDOW_HOURS = 48


def load_training_matrix():
    """Load the training matrix with historical data."""
    path = WEATHER_DIR / "training_matrix.parquet"
    if not path.exists():
        raise FileNotFoundError(f"Training matrix not found: {path}")
    
    df = pd.read_parquet(path)
    
    # Rename columns to standard names
    rename_map = {}
    if "timestamp" in df.columns and "target_timestamp" not in df.columns:
        rename_map["timestamp"] = "target_timestamp"
    if "dmi_temp_pred" in df.columns and "dmi_temperature_2m_pred" not in df.columns:
        rename_map["dmi_temp_pred"] = "dmi_temperature_2m_pred"
    if "dmi_wind_pred" in df.columns and "dmi_windspeed_10m_pred" not in df.columns:
        rename_map["dmi_wind_pred"] = "dmi_windspeed_10m_pred"
    if "actual_wind" in df.columns and "actual_wind_speed" not in df.columns:
        rename_map["actual_wind"] = "actual_wind_speed"
        
    if rename_map:
        df = df.rename(columns=rename_map)
    
    # Ensure timestamps are datetime with timezone
    for col in ["target_timestamp", "reference_time"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col])
            if df[col].dt.tz is None:
                df[col] = df[col].dt.tz_localize(COPENHAGEN_TZ, ambiguous="infer", nonexistent="shift_forward")
            else:
                df[col] = df[col].dt.tz_convert(COPENHAGEN_TZ)
    
    return df.sort_values(["target_timestamp", "reference_time"]).reset_index(drop=True)


def load_model_bundle(target_name):
    """Load ML model bundle for a target."""
    filename = MODEL_FILES.get(target_name)
    if not filename:
        return None
    
    path = WEATHER_DIR / filename
    if not path.exists():
        print(f"  Model file not found: {path}")
        return None
    
    with open(path, "rb") as f:
        return pickle.load(f)


def predict_with_bundle(bundle, df):
    """Run ML prediction using model bundle."""
    if bundle is None or df is None or len(df) == 0 or "lead_bucket" not in df.columns:
        return None
    
    predictions = np.full(len(df), np.nan)
    models = bundle.get("models", {})
    
    for bucket in df["lead_bucket"].dropna().unique():
        if bucket not in models:
            continue
        
        bucket_mask = df["lead_bucket"] == bucket
        model_info = models[bucket]
        model = model_info.get("model")
        feature_cols = model_info.get("feature_columns") or bundle.get("feature_columns", [])
        
        if model is None or not feature_cols:
            continue
        
        # Check for missing columns
        missing_cols = [col for col in feature_cols if col not in df.columns]
        if missing_cols:
            print(f"    Missing features for bucket {bucket}: {missing_cols}")
            continue
        
        bucket_df = df.loc[bucket_mask, feature_cols].fillna(0.0)
        
        try:
            if hasattr(model, "predict_proba"):
                bucket_pred = model.predict_proba(bucket_df)[:, 1]
            else:
                bucket_pred = model.predict(bucket_df)
            predictions[bucket_mask] = bucket_pred
        except Exception as e:
            print(f"    Prediction error for bucket {bucket}: {e}")
            continue
    
    return predictions


def build_historical_backtest(training_df):
    """Build historical backtest with ML predictions."""
    if training_df is None or len(training_df) == 0:
        return None
    
    now = pd.Timestamp.now(tz=COPENHAGEN_TZ)
    window_end = min(now, training_df["target_timestamp"].max())
    window_start = window_end - timedelta(days=HISTORY_WINDOW_DAYS)
    
    # Filter to last 7 days
    history = training_df[
        (training_df["target_timestamp"] >= window_start)
        & (training_df["target_timestamp"] <= window_end)
    ].copy()
    
    if len(history) == 0:
        print("No historical data in window")
        return None
    
    # Filter to relevant lead times
    if "lead_time_hours" in history.columns:
        history = history[
            history["lead_time_hours"].fillna(0).between(0.0001, FUTURE_WINDOW_HOURS)
        ].copy()
    
    if len(history) == 0:
        print("No data after lead time filter")
        return None
    
    print(f"Processing {len(history)} historical rows...")
    
    # Initialize ML columns with DMI values (fallback)
    history["ml_temp"] = history["dmi_temperature_2m_pred"] if "dmi_temperature_2m_pred" in history.columns else np.nan
    history["ml_wind_speed"] = history["dmi_windspeed_10m_pred"] if "dmi_windspeed_10m_pred" in history.columns else np.nan
    history["ml_wind_gust"] = history["dmi_windgusts_10m_pred"] if "dmi_windgusts_10m_pred" in history.columns else np.nan
    
    if "dmi_precipitation_probability_pred" in history.columns:
        history["ml_rain_prob"] = history["dmi_precipitation_probability_pred"].fillna(0.0).clip(0.0, 100.0) / 100.0
    else:
        history["ml_rain_prob"] = 0.0
    
    if "dmi_precipitation_pred" in history.columns:
        history["ml_rain_amount"] = history["dmi_precipitation_pred"].fillna(0.0).clip(0.0, None)
    else:
        history["ml_rain_amount"] = 0.0
    
    # Load and run models
    bundle_specs = [
        ("temperature", "ml_temp", "dmi_temperature_2m_pred", "correction"),
        ("wind_speed", "ml_wind_speed", "dmi_windspeed_10m_pred", "correction"),
        ("wind_gust", "ml_wind_gust", "dmi_windgusts_10m_pred", "correction"),
        ("rain_event", "ml_rain_prob", None, "probability"),
        ("rain_amount", "ml_rain_amount", None, "absolute"),
    ]
    
    for target_name, output_column, baseline_column, prediction_kind in bundle_specs:
        print(f"  Loading model for {target_name}...")
        bundle = load_model_bundle(target_name)
        if bundle is None:
            print(f"    No model found, skipping")
            continue
        
        print(f"  Running predictions for {target_name}...")
        predictions = predict_with_bundle(bundle, history)
        if predictions is None:
            print(f"    No predictions generated")
            continue
        
        prediction_series = pd.Series(predictions, index=history.index, dtype="float64")
        prediction_mask = prediction_series.notna()
        
        if not prediction_mask.any():
            print(f"    All predictions are NaN")
            continue
        
        if prediction_kind == "correction":
            history.loc[prediction_mask, output_column] = (
                history.loc[prediction_mask, baseline_column] + prediction_series[prediction_mask]
            )
        elif prediction_kind == "probability":
            history.loc[prediction_mask, output_column] = prediction_series[prediction_mask].clip(0.0, 1.0)
        else:
            history.loc[prediction_mask, output_column] = prediction_series[prediction_mask].clip(0.0, None)
        
        print(f"    Generated {prediction_mask.sum()} predictions")
    
    # Sort and deduplicate
    sort_columns = ["target_timestamp"]
    if "lead_time_hours" in history.columns:
        sort_columns.append("lead_time_hours")
    if "reference_time" in history.columns:
        sort_columns.append("reference_time")
    
    history = history.sort_values(sort_columns, ascending=[True, False, False])
    history = history.drop_duplicates(subset=["target_timestamp"], keep="first").reset_index(drop=True)
    
    return history


def convert_to_snapshot_format(history_df):
    """Convert DataFrame to dashboard snapshot format."""
    if history_df is None or len(history_df) == 0:
        return {"temperature": [], "wind": [], "rain": []}
    
    snapshot = {
        "temperature": [],
        "wind": [],
        "rain": [],
    }
    
    for _, row in history_df.iterrows():
        ts = row["target_timestamp"]
        if pd.isna(ts):
            continue
        
        # Temperature
        temp_entry = {
            "timestamp": ts.isoformat(),
            "actual": float(row["actual_temp"]) if "actual_temp" in row and pd.notna(row["actual_temp"]) else None,
            "dmiTemp": float(row["dmi_temperature_2m_pred"]) if "dmi_temperature_2m_pred" in row and pd.notna(row["dmi_temperature_2m_pred"]) else None,
            "mlTemp": float(row["ml_temp"]) if "ml_temp" in row and pd.notna(row["ml_temp"]) else None,
            "verified": True,
        }
        snapshot["temperature"].append(temp_entry)
        
        # Wind
        wind_entry = {
            "timestamp": ts.isoformat(),
            "actualWindSpeed": float(row["actual_wind_speed"]) if "actual_wind_speed" in row and pd.notna(row["actual_wind_speed"]) else None,
            "dmiWindSpeed": float(row["dmi_windspeed_10m_pred"]) if "dmi_windspeed_10m_pred" in row and pd.notna(row["dmi_windspeed_10m_pred"]) else None,
            "mlWindSpeed": float(row["ml_wind_speed"]) if "ml_wind_speed" in row and pd.notna(row["ml_wind_speed"]) else None,
            "actualWindGust": float(row["actual_wind_gust"]) if "actual_wind_gust" in row and pd.notna(row["actual_wind_gust"]) else None,
            "dmiWindGust": float(row["dmi_windgusts_10m_pred"]) if "dmi_windgusts_10m_pred" in row and pd.notna(row["dmi_windgusts_10m_pred"]) else None,
            "mlWindGust": float(row["ml_wind_gust"]) if "ml_wind_gust" in row and pd.notna(row["ml_wind_gust"]) else None,
            "verified": True,
        }
        snapshot["wind"].append(wind_entry)
        
        # Rain
        rain_entry = {
            "timestamp": ts.isoformat(),
            "actualRainEvent": float(row["actual_rain_event"]) if "actual_rain_event" in row and pd.notna(row["actual_rain_event"]) else None,
            "dmiRainProb": float(row["dmi_precipitation_probability_pred"]) if "dmi_precipitation_probability_pred" in row and pd.notna(row["dmi_precipitation_probability_pred"]) else 0,
            "mlRainProb": float(row["ml_rain_prob"]) if "ml_rain_prob" in row and pd.notna(row["ml_rain_prob"]) else 0,
            "actualRainAmount": float(row["actual_rain_amount"]) if "actual_rain_amount" in row and pd.notna(row["actual_rain_amount"]) else None,
            "dmiRainAmount": float(row["dmi_precipitation_pred"]) if "dmi_precipitation_pred" in row and pd.notna(row["dmi_precipitation_pred"]) else 0,
            "mlRainAmount": float(row["ml_rain_amount"]) if "ml_rain_amount" in row and pd.notna(row["ml_rain_amount"]) else 0,
            "verified": True,
        }
        snapshot["rain"].append(rain_entry)
    
    return snapshot


def calculate_metrics(history_df):
    """Calculate verification metrics."""
    metrics = {}
    
    if history_df is None or len(history_df) == 0:
        return metrics
    
    # Temperature metrics
    if {"actual_temp", "dmi_temperature_2m_pred", "ml_temp"}.issubset(history_df.columns):
        actual = history_df["actual_temp"].dropna()
        if len(actual) > 0:
            aligned = history_df.loc[actual.index]
            dmi_error = aligned["actual_temp"] - aligned["dmi_temperature_2m_pred"]
            ml_error = aligned["actual_temp"] - aligned["ml_temp"]
            
            dmi_rmse = float(np.sqrt(np.mean(dmi_error**2)))
            ml_rmse = float(np.sqrt(np.mean(ml_error**2)))
            
            metrics["temperature"] = {
                "rmseDmi": dmi_rmse,
                "rmseMl": ml_rmse,
                "maeDmi": float(np.mean(np.abs(dmi_error))),
                "maeMl": float(np.mean(np.abs(ml_error))),
                "winRate": None,  # Would need point-by-point comparison
            }
    
    # Wind metrics
    if {"actual_wind_speed", "dmi_windspeed_10m_pred", "ml_wind_speed"}.issubset(history_df.columns):
        actual = history_df["actual_wind_speed"].dropna()
        if len(actual) > 0:
            aligned = history_df.loc[actual.index]
            dmi_error = aligned["actual_wind_speed"] - aligned["dmi_windspeed_10m_pred"]
            ml_error = aligned["actual_wind_speed"] - aligned["ml_wind_speed"]
            
            metrics["wind_speed"] = {
                "rmseDmi": float(np.sqrt(np.mean(dmi_error**2))),
                "rmseMl": float(np.sqrt(np.mean(ml_error**2))),
                "maeDmi": float(np.mean(np.abs(dmi_error))),
                "maeMl": float(np.mean(np.abs(ml_error))),
            }
    
    return metrics


def main():
    print("=" * 60)
    print("Generating History Snapshot with ML Backtest")
    print("=" * 60)
    print()
    
    print("1. Loading training matrix...")
    try:
        training_df = load_training_matrix()
        print(f"   Loaded {len(training_df)} rows")
        print(f"   Date range: {training_df['target_timestamp'].min()} to {training_df['target_timestamp'].max()}")
    except Exception as e:
        print(f"   ERROR: {e}")
        sys.exit(1)
    
    print()
    print("2. Building historical backtest...")
    history_df = build_historical_backtest(training_df)
    
    if history_df is None or len(history_df) == 0:
        print("   ERROR: No history data generated")
        sys.exit(1)
    
    print(f"   Generated {len(history_df)} history rows")
    
    print()
    print("3. Converting to snapshot format...")
    snapshot = convert_to_snapshot_format(history_df)
    print(f"   Temperature entries: {len(snapshot['temperature'])}")
    print(f"   Wind entries: {len(snapshot['wind'])}")
    print(f"   Rain entries: {len(snapshot['rain'])}")
    
    print()
    print("4. Calculating metrics...")
    metrics = calculate_metrics(history_df)
    for target, m in metrics.items():
        print(f"   {target}: RMSE DMI={m.get('rmseDmi', 'N/A'):.2f}, ML={m.get('rmseMl', 'N/A'):.2f}")
    
    # Combine into final payload
    output = {
        "snapshot": {
            "history": snapshot,
            "verification": {
                "target": "temperature",
                "periodLabel": f"Seneste 7 dage ({len(snapshot['temperature'])} sammenligninger)",
                **(metrics.get("temperature") or {}),
                "totalPredictions": len(snapshot['temperature']),
            },
            "generatedAt": datetime.now().isoformat(),
        },
        "source": "ml-backtest",
    }
    
    print()
    print("5. Saving to file...")
    output_path = PREDICTIONS_DIR / "history_snapshot.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"   Saved to: {output_path}")
    
    print()
    print("=" * 60)
    print("DONE!")
    print("=" * 60)


if __name__ == "__main__":
    main()
