import cv2
import numpy as np
import os
from pathlib import Path
from ultralytics import YOLO

DEFAULT_MODEL_PATH = Path(__file__).resolve().parents[1] / "models" / "yolov8n.pt"
MODEL_PATH = Path(os.getenv("CV_MODEL_PATH", str(DEFAULT_MODEL_PATH)))

model = YOLO(str(MODEL_PATH) if MODEL_PATH.exists() else "yolov8n.pt")

# ROI area kiosk
ROI_X1 = 100
ROI_Y1 = 100

ROI_X2 = 500
ROI_Y2 = 450


def detect_people(image_bytes=None):

    if image_bytes:
        image_array = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if frame is None:
            return {
                "people_count": 0,
                "confidence": 0,
                "detections": []
            }
    else:
        cam = cv2.VideoCapture(0)
        success, frame = cam.read()
        cam.release()

        if not success:
            return {
                "people_count": 0,
                "confidence": 0,
                "detections": []
            }

    results = model(frame)

    people = 0
    conf = []

    # ambil bounding box
    for box in results[0].boxes:

        cls = int(box.cls)

        if cls == 0:

            x1, y1, x2, y2 = map(
                int,
                box.xyxy[0]
            )

            height = y2 - y1

            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            # estimasi <= 1 meter
            in_roi = (
            ROI_X1 < center_x < ROI_X2 and
            ROI_Y1 < center_y < ROI_Y2
            )

            print(
            f"Center: ({center_x}, {center_y}) | ROI: {in_roi}"
            )

            if in_roi and height > 300:

                people += 1

                conf.append(
                    float(box.conf)
                )

                print(
                    f"Orang dekat | tinggi box={height}"
                )
                

    print("TERDETEKSI:", people)

    return {
        "people_count": people,
        "confidence": max(conf) if conf else 0,
        "detections": []
    }
