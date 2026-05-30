import logging
import os
import cv2
import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)

model = YOLO("yolov8n_openvino_model", task="detect")

DEFAULT_CONF = 0.40
DEFAULT_IOU  = 0.45


def _parse_results(results) -> list[dict]:
    detections = []
    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            class_id   = int(box.cls[0])
            label      = model.names[class_id].lower()
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append({
                "label":      label,
                "confidence": round(confidence, 4),
                "bbox":       [round(x1), round(y1), round(x2), round(y2)],
            })
    return detections


def detect_from_frame(
    frame: np.ndarray,
    conf: float = DEFAULT_CONF,
    iou:  float = DEFAULT_IOU,
) -> list[dict]:
    if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
        logger.warning("detect_from_frame: received empty or invalid frame")
        return []
    try:
        results = model.predict(source=frame, conf=conf, iou=iou, classes=[0, 67], verbose=False)
        return _parse_results(results)
    except Exception:
        logger.exception("detect_from_frame: prediction failed")
        return []


def detect_from_file(
    image_path: str,
    conf: float = DEFAULT_CONF,
    iou:  float = DEFAULT_IOU,
) -> list[dict]:
    if not image_path or not os.path.isfile(image_path):
        logger.warning("detect_from_file: path does not exist — %s", image_path)
        return []
    frame = cv2.imread(image_path)
    if frame is None:
        logger.warning("detect_from_file: cv2 could not decode — %s", image_path)
        return []
    return detect_from_frame(frame, conf=conf, iou=iou)


def labels_only(detections: list[dict]) -> list[str]:
    return [d["label"] for d in detections]