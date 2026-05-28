from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64, cv2, numpy as np, re, easyocr
from ultralytics import YOLO

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

model = YOLO("yolov8n.pt")

try:
    reader = easyocr.Reader(['en'])
except Exception:
    reader = None

class FrameData(BaseModel):
    image: str

@app.post("/analyze")
async def analyze_frame(data: FrameData):
    try:
        raw_image_string = data.image
        if "," in raw_image_string:
            raw_image_string = raw_image_string.split(",", 1)[1]
            
        image_data = base64.b64decode(raw_image_string)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        h, w, _ = frame.shape
        zone_x_start = w * 0.15
        zone_x_end = w * 0.85

        results = model.predict(source=frame, conf=0.25, iou=0.45, verbose=False)

        detected_labels = []
        candidate_persons = []

        if len(results) > 0 and results[0].boxes is not None:
            for box in results[0].boxes:
                cls_id = int(box.cls[0])
                label = model.names[cls_id].lower()
                xyxy = box.xyxy[0].tolist()
                
                detected_labels.append(label)

                if label == "person":
                    box_x_center = (xyxy[0] + xyxy[2]) / 2
                    box_y_center = (xyxy[1] + xyxy[3]) / 2
                    box_w = xyxy[2] - xyxy[0]
                    box_h = xyxy[3] - xyxy[1]
                    
                    if (zone_x_start <= box_x_center <= zone_x_end and box_h > (h * 0.35)):
                        candidate_persons.append({
                            "w": box_w,
                            "h": box_h,
                            "xyxy": xyxy,
                            "x_center": box_x_center
                        })

        person_count = 0
        if candidate_persons:
            candidate_persons.sort(key=lambda x: x["w"] * x["h"], reverse=True)
            primary_candidate = candidate_persons[0]
            person_count = 1
            
            p_xyxy = primary_candidate["xyxy"]
            
            for secondary in candidate_persons[1:]:
                s_xyxy = secondary["xyxy"]
                
                iou_x1 = max(p_xyxy[0], s_xyxy[0])
                iou_y1 = max(p_xyxy[1], s_xyxy[1])
                iou_x2 = min(p_xyxy[2], s_xyxy[2])
                iou_y2 = min(p_xyxy[3], s_xyxy[3])
                
                inter_w = max(0, iou_x2 - iou_x1)
                inter_h = max(0, iou_y2 - iou_y1)
                intersection = inter_w * inter_h
                
                if intersection / ((s_xyxy[2] - s_xyxy[0]) * (s_xyxy[3] - s_xyxy[1]) + 1e-6) > 0.60:
                    continue
                    
                if secondary["w"] > (w * 0.20) and secondary["h"] > (h * 0.35):
                    person_count += 1

        violations = []

        if person_count > 1:
            violations.append("Multiple Persons")
        elif person_count == 0:
            violations.append("No Person Detected")

        prohibited_objects = {
            "cell phone": "Cell Phone",
            "remote": "Cell Phone",
            "mobile phone": "Cell Phone",
            "telephone": "Cell Phone",
            "calculator": "Prohibited Object Detected",
            "book": "Prohibited Reference Material",
            "tv": "External Display Detected",
            "laptop": "Secondary Display Device",
            "monitor": "External Display Detected"
        }

        for label in detected_labels:
            if label in prohibited_objects:
                violations.append(prohibited_objects[label])
                break

        return {"status": "success", "detections": list(set(violations))}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    try:
        audio_bytes = await file.read()
        audio_data = np.frombuffer(audio_bytes, dtype=np.int16)
        if len(audio_data) == 0:
            return {"status": "success", "suspicious": False}
        rms = np.sqrt(np.mean(audio_data**2))
        if rms > 350.0:
            return {"status": "success", "suspicious": True, "intensity": float(rms)}
        return {"status": "success", "suspicious": False}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/verify-document")
async def verify_document(data: FrameData):
    try:
        raw_image_string = data.image
        if "," in raw_image_string:
            raw_image_string = raw_image_string.split(",", 1)[1]
            
        image_data = base64.b64decode(raw_image_string)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if reader is None:
            return {"status": "error", "verified": False, "message": "OCR Engine offline. Contact administrator."}

        h, w = frame.shape[:2]
        resized = cv2.resize(frame, (w * 2, h * 2), interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        processed_frame = cv2.threshold(filtered, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

        ocr_results = reader.readtext(processed_frame)
        extracted_text = " ".join([text[1].upper() for text in ocr_results])

        if len(extracted_text.strip()) < 3:
            return {"status": "error", "verified": False, "message": "No text detected. Reposition your identification card close to the camera lens."}

        has_id_card = any(k in extracted_text for k in ["GOVT", "INDIA", "DOB", "MALE", "FEMALE", "UNIQUE", "ENROLLMENT", "INCOME", "TAX", "DEPARTMENT", "PERMANENT", "CARD", "PANCARD", "UNIVERSITY", "STUDENT", "IDENTITY", "CAMPUS", "COLLEGE", "INSTITUTE", "REG", "BCE", "BHOPAL", "VIT", "DRIVING", "LICENSE", "LICENCE", "TRANSPORT"])
        digit_count = len(re.findall(r'\d', extracted_text))

        if has_id_card or digit_count >= 6:
            return {"status": "success", "verified": True, "doc_type": "Identity Verification Document"}

        if len(extracted_text.strip()) >= 6:
            return {"status": "success", "verified": True, "doc_type": "Identity Document"}

        return {"status": "error", "verified": False, "message": "Document layout not recognized. Ensure text fields are clearly visible."}
    except Exception as e:
        return {"status": "error", "verified": False, "message": f"System error during scanning process: {str(e)}"}

@app.get("/")
def status():
    return {"status": "AI Service Live"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)