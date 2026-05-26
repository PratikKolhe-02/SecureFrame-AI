from fastapi import FastAPI
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
        encoded = data.image.split(",", 1)[1]
        image_data = base64.b64decode(encoded)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        h, w, _ = frame.shape
        zone_x_start = w * 0.25
        zone_x_end = w * 0.75

        results = model.predict(source=frame, conf=0.15, iou=0.45, verbose=False)

        detected_labels = []
        candidate_persons = []

        if len(results) > 0:
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
                    
                    if (zone_x_start <= box_x_center <= zone_x_end and box_h > (h * 0.45) and box_w > (w * 0.25)):
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
                
                if intersection / (s_xyxy[2] - s_xyxy[0]) * (s_xyxy[3] - s_xyxy[1]) > 0.60:
                    continue
                    
                if secondary["w"] > (w * 0.30) and secondary["h"] > (h * 0.50):
                    person_count += 1

        violations = []

        if person_count > 1:
            violations.append("Multiple Persons")
        elif person_count == 0:
            violations.append("No Person Detected")

        phone_triggers = {"cell phone", "remote", "mobile phone", "telephone", "calculator", "hand", "book"}
        if any(obj in phone_triggers for obj in detected_labels):
            violations.append("Cell Phone")

        if "laptop" in detected_labels:
            violations.append("Laptop")

        return {"status": "success", "detections": violations}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/verify-document")
async def verify_document(data: FrameData):
    try:
        encoded = data.image.split(",", 1)[1]
        image_data = base64.b64decode(encoded)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if reader is None:
            return {"status": "error", "verified": False, "message": "OCR Engine offline. Contact administrator."}

        h, w = frame.shape[:2]
        resized = cv2.resize(frame, (w * 3, h * 3), interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        processed_frame = cv2.threshold(filtered, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

        ocr_results = reader.readtext(processed_frame)
        extracted_text = " ".join([text[1].upper() for text in ocr_results])

        if len(extracted_text.strip()) < 5:
            return {"status": "error", "verified": False, "message": "No document text detected. Bring the card closer and clear glare."}

        has_aadhaar = any(k in extracted_text for k in ["GOVT", "INDIA", "DOB", "MALE", "FEMALE", "UNIQUE", "ENROLLMENT"])
        has_pan = any(k in extracted_text for k in ["INCOME", "TAX", "DEPARTMENT", "PERMANENT", "CARD", "PANCARD"])
        has_college = any(k in extracted_text for k in ["UNIVERSITY", "STUDENT", "IDENTITY", "CAMPUS", "COLLEGE", "INSTITUTE", "REG", "BCE", "BHOPAL", "VIT"])
        has_dl = any(k in extracted_text for k in ["DRIVING", "LICENSE", "LICENCE", "TRANSPORT", "UNION", "DL-", "MH-", "MP-", "IN-"])

        digit_count = len(re.findall(r'\d', extracted_text))

        if has_aadhaar or digit_count >= 12:
            return {"status": "success", "verified": True, "doc_type": "Aadhaar Card"}
        elif has_pan:
            return {"status": "success", "verified": True, "doc_type": "PAN Card"}
        elif has_dl:
            return {"status": "success", "verified": True, "doc_type": "Driving License"}
        elif has_college:
            return {"status": "success", "verified": True, "doc_type": "College ID"}

        if len(extracted_text.strip()) >= 8:
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