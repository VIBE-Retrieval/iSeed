from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from analysis_metrics import compute_image_metrics, normalize_sex


DATA_DIR = BASE_DIR / "data"
OUTPUT_PATH = DATA_DIR / "label_stats_by_group.json"
LOG_EVERY = max(100, int(os.getenv("LOG_EVERY", "1000")))
MAX_FILES = max(0, int(os.getenv("MAX_FILES", "0")))


def _find_dataset_root() -> Path:
    for name in os.listdir(DATA_DIR):
        if name.startswith("266."):
            return DATA_DIR / name
    raise FileNotFoundError("데이터셋 루트를 찾을 수 없습니다.")


def _find_training_label_dir(dataset_root: Path) -> Path:
    children = os.listdir(dataset_root)
    if not children:
        raise FileNotFoundError("데이터셋 하위 경로가 없습니다.")
    stage_dir = dataset_root / children[0]
    training_dir = stage_dir / "Training"
    for name in os.listdir(training_dir):
        if name.startswith("02."):
            return training_dir / name
    raise FileNotFoundError("Training/02.라벨링데이터 폴더를 찾을 수 없습니다.")


def _iter_label_files(label_dir: Path, folder_name: str) -> List[Path]:
    target = label_dir / folder_name
    if not target.exists():
        return []
    return [target / name for name in os.listdir(target) if name.lower().endswith(".json")]


def _accumulate(
    groups: Dict[str, Dict[str, List[float]]],
    group_counts: Dict[str, int],
    age: int,
    sex: str,
    metrics: Dict[str, Any],
) -> None:
    group_key = f"{age}_{sex}"
    group = groups.setdefault(group_key, {})
    for key, value in metrics.items():
        if value is None:
            continue
        group.setdefault(key, []).append(float(value))
    group_counts[group_key] = group_counts.get(group_key, 0) + 1


def main() -> None:
    dataset_root = _find_dataset_root()
    label_dir = _find_training_label_dir(dataset_root)

    folders = ["TL_나무", "TL_남자사람", "TL_여자사람", "TL_집"]
    results: Dict[str, Any] = {}

    for folder in folders:
        files = _iter_label_files(label_dir, folder)
        groups: Dict[str, Dict[str, List[float]]] = {}
        group_counts: Dict[str, int] = {}

        for index, label_path in enumerate(files):
            if MAX_FILES and index >= MAX_FILES:
                break
            try:
                with label_path.open("r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                continue

            meta = data.get("meta", {})
            age = meta.get("age")
            sex = normalize_sex(meta.get("sex", ""))
            if not isinstance(age, int):
                continue
            if age < 7 or age > 13:
                continue
            if sex not in {"남", "여"}:
                continue

            metrics = compute_image_metrics(data, use_color=False)
            _accumulate(groups, group_counts, age, sex, metrics)

            if (index + 1) % LOG_EVERY == 0:
                print(f"{folder} 진행: {index + 1}/{len(files)}")

        for group_key, metric_map in groups.items():
            for key, values in metric_map.items():
                values.sort()
        results[folder] = {
            "group_counts": group_counts,
            "groups": groups,
        }

    output = {
        "generated_at": datetime.now().isoformat(),
        "sampling": {
            "max_files": MAX_FILES,
        },
        "folders": results,
    }

    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"저장 완료: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
