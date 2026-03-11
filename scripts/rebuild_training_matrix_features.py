#!/usr/bin/env python3
"""Rebuild training_matrix.parquet with causal observation-context features."""

from __future__ import annotations

import argparse
import importlib.util
import sys
from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
COLLECTOR_APP_PATH = ROOT_DIR / "hf" / "spaces" / "dmi-collector" / "app.py"
DEFAULT_INPUT_PATH = ROOT_DIR / "hf" / "datasets" / "dmi-aarhus-weather-data" / "training_matrix.parquet"
DEFAULT_OUTPUT_PATH = DEFAULT_INPUT_PATH


def load_collector_module():
    spec = importlib.util.spec_from_file_location("dmi_collector_app", COLLECTOR_APP_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load collector module from {COLLECTOR_APP_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT_PATH, help="Input parquet path")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH, help="Output parquet path")
    parser.add_argument(
        "--no-upload",
        action="store_true",
        help="Skip upload_to_dataset after writing the upgraded parquet",
    )
    return parser.parse_args()


def validate_upgraded_matrix(before_df, after_df, collector):
    if len(before_df) != len(after_df):
        raise ValueError(f"Row count changed: before={len(before_df)} after={len(after_df)}")

    before_unique = int(before_df.drop_duplicates(subset=collector.TRAINING_DEDUP_KEYS).shape[0])
    after_unique = int(after_df.drop_duplicates(subset=collector.TRAINING_DEDUP_KEYS).shape[0])
    if before_unique != after_unique:
        raise ValueError(
            "Unique key count changed: "
            f"before={before_unique} after={after_unique} keys={collector.TRAINING_DEDUP_KEYS}"
        )

    required_columns = [
        collector.OBSERVATION_CONTEXT_TIMESTAMP_COL,
        *collector.OBSERVATION_CONTEXT_COLUMNS,
        "target_timestamp",
        "reference_time",
        "temp_correction_target",
        "wind_speed_correction_target",
        "wind_gust_correction_target",
    ]
    missing_columns = [column_name for column_name in required_columns if column_name not in after_df.columns]
    if missing_columns:
        raise ValueError(f"Upgraded matrix missing required columns: {missing_columns}")

    context_mask = after_df[collector.OBSERVATION_CONTEXT_TIMESTAMP_COL].notna()
    if context_mask.any():
        invalid_context = after_df.loc[
            context_mask,
            collector.OBSERVATION_CONTEXT_TIMESTAMP_COL,
        ] > after_df.loc[context_mask, "reference_time"]
        if invalid_context.any():
            bad_rows = int(invalid_context.sum())
            raise ValueError(f"Found {bad_rows} rows where observation context is newer than reference_time")


def main():
    args = parse_args()
    collector = load_collector_module()

    if not args.input.exists():
        raise FileNotFoundError(f"Input parquet not found: {args.input}")

    print(f"Loading training matrix from {args.input}")
    before_df = pd.read_parquet(args.input)
    upgraded_df = collector.upgrade_training_matrix_with_observation_context(before_df)

    print("Validating upgraded training matrix")
    validate_upgraded_matrix(before_df, upgraded_df, collector)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    upgraded_df.to_parquet(args.output)
    print(f"Wrote upgraded training matrix to {args.output}")
    print(f"Rows: {len(upgraded_df)}")
    print(f"Observation context columns: {len(collector.OBSERVATION_CONTEXT_COLUMNS)}")

    if args.no_upload:
        print("Upload skipped (--no-upload)")
        return

    print(f"Uploading {args.output.name} to {collector.DATASET_NAME}")
    success = collector.upload_to_dataset(str(args.output), "training_matrix.parquet", collector.DATASET_NAME)
    if not success:
        raise RuntimeError("upload_to_dataset returned False")
    print("Upload completed")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
