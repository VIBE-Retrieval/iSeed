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
OUTPUT_PATH = DATA_DIR / "peer_stats.json"
COLOR_SAMPLE_EVERY = max(1, int(os.getenv("COLOR_SAMPLE_EVERY", "5")))
MAX_FILES = max(0, int(os.getenv("MAX_FILES", "0")))
LOG_EVERY = max(100, int(os.getenv("LOG_EVERY", "1000")))


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


def _iter_label_files(label_dir: Path) -> List[Path]:
    files: List[Path] = []
    for sub in os.listdir(label_dir):
        sub_path = label_dir / sub
        if sub_path.is_dir() and sub.startswith("TL_"):
            for name in os.listdir(sub_path):
                if name.lower().endswith(".json"):
                    files.append(sub_path / name)
    return files


def _resolve_image_path(label_path: Path, meta: Dict[str, Any]) -> Path | None:
    raw = meta.get("img_path")
    if not raw:
        return None
    return (label_path.parent / raw).resolve()


def main() -> None:
    dataset_root = _find_dataset_root()
    label_dir = _find_training_label_dir(dataset_root)
    label_files = _iter_label_files(label_dir)

    groups: Dict[str, Dict[str, List[float]]] = {}
    group_meta: Dict[str, Dict[str, Any]] = {}
    group_counts: Dict[str, int] = {}

    for index, label_path in enumerate(label_files):
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

        image_path = _resolve_image_path(label_path, meta)
        use_color = index % COLOR_SAMPLE_EVERY == 0
        metrics = compute_image_metrics(
            data,
            str(image_path) if image_path else None,
            use_color=use_color,
        )

        group_key = f"{age}_{sex}"
        group = groups.setdefault(group_key, {})
        for key, value in metrics.items():
            if value is None:
                continue
            group.setdefault(key, []).append(float(value))

        group_meta[group_key] = {"age": age, "sex": sex}
        group_counts[group_key] = group_counts.get(group_key, 0) + 1

        if (index + 1) % LOG_EVERY == 0:
            print(f"진행: {index + 1}/{len(label_files)}")

    for group_key, metric_map in groups.items():
        for key, values in metric_map.items():
            values.sort()
        meta = group_meta.get(group_key, {})
        meta["count"] = group_counts.get(group_key, 0)
        group_meta[group_key] = meta
        groups[group_key] = metric_map

    output = {
        "generated_at": datetime.now().isoformat(),
        "sampling": {
            "color_sample_every": COLOR_SAMPLE_EVERY,
            "max_files": MAX_FILES,
        },
        "groups": groups,
        "group_meta": group_meta,
    }

    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"저장 완료: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
