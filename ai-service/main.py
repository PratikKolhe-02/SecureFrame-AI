from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64, cv2, numpy as np, re, time, easyocr

import detector

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

try:
    reader = easyocr.Reader(['en'])
except Exception:
    reader = None

EXAM_START_TIME = None
GRACE_PERIOD_SECONDS = 8

NO_PERSON_STREAK = 0
NO_PERSON_STREAK_THRESHOLD = 3

PROHIBITED_OBJECTS = {
    "cell phone": "Mobile Device / Phone Detected",
    "remote": "Mobile Device / Phone Detected",
    "mobile phone": "Mobile Device / Phone Detected",
    "telephone": "Mobile Device / Phone Detected",
    "calculator": "Prohibited Object Detected",
    "book": "Prohibited Reference Material",
    "tv": "External Display Detected",
    "laptop": "Secondary Display Device",
    "monitor": "External Display Detected",
    "tablet": "Mobile Device / Phone Detected",
    "ipad": "Mobile Device / Phone Detected",
}

class FrameData(BaseModel):
    image: str

class BioAuthData(BaseModel):
    current_image: str
    baseline_image_url: str

class ExamStartData(BaseModel):
    session_id: str

def decode_image(b64_string: str):
    if "," in b64_string:
        b64_string = b64_string.split(",", 1)[1]
    img_bytes = base64.b64decode(b64_string)
    arr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

@app.post("/exam-start")
async def notify_exam_start(data: ExamStartData):
    global EXAM_START_TIME, NO_PERSON_STREAK
    EXAM_START_TIME = time.time()
    NO_PERSON_STREAK = 0
    return {"status": "ok", "session_id": data.session_id}

@app.post("/analyze")
async def analyze_frame(data: FrameData):
    global NO_PERSON_STREAK, EXAM_START_TIME

    try:
        frame = decode_image(data.image)
        
        detections_list = detector.detect_from_frame(frame)
        detected_labels = detector.labels_only(detections_list)

        violations = []
        person_count = detected_labels.count("person")
        in_grace_period = EXAM_START_TIME is not None and (time.time() - EXAM_START_TIME) < GRACE_PERIOD_SECONDS

        if person_count > 1:
            violations.append("Multiple Persons Detected")
        elif person_count == 0 and not in_grace_period:
            NO_PERSON_STREAK += 1
            if NO_PERSON_STREAK >= NO_PERSON_STREAK_THRESHOLD:
                violations.append("No Person Detected")
        else:
            NO_PERSON_STREAK = 0

        phone_labels = {"cell phone", "mobile phone", "telephone", "remote", "tablet", "ipad"}
        for label in detected_labels:
            normalized = label.strip().lower()
            if normalized in phone_labels:
                violations.append("Mobile Device / Phone Detected")
                break
            if normalized in PROHIBITED_OBJECTS and normalized not in phone_labels:
                violations.append(PROHIBITED_OBJECTS[normalized])
                break

        return {"status": "success", "detections": list(set(violations))}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/verify-document")
async def verify_document(data: BioAuthData):
    try:
        frame = decode_image(data.current_image)

        if reader is None:
            return {"status": "error", "verified": False, "message": "OCR Engine offline."}

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        ocr_results = reader.readtext(gray)
        extracted_text = " ".join([text[1].upper() for text in ocr_results])

        has_gov_keywords = any(k in extracted_text for k in [
            "GOVT", "INDIA", "ELECTION", "COMMISSION", "TAX", "DEPARTMENT",
            "UNIQUE", "IDENTIFICATION", "AADHAAR", "INFRASTRUCTURE", "AUTHORITY"
        ])
        has_academic_keywords = any(k in extracted_text for k in [
            "UNIVERSITY", "STUDENT", "IDENTITY", "INSTITUTE", "COLLEGE",
            "CAMPUS", "REGISTRATION", "VIT", "BHOPAL", "HALL TICKET", "ENROLLMENT"
        ])

        has_aadhaar_pattern = bool(re.search(r'[2-9][0-9]{3}\s[0-9]{4}\s[0-9]{4}', extracted_text))
        has_pan_pattern = bool(re.search(r'[A-Z]{5}[0-9]{4}[A-Z]{1}', extracted_text))

        if has_gov_keywords or has_aadhaar_pattern or has_pan_pattern:
            return {"status": "success", "verified": True, "doc_type": "Government ID Recognized"}

        if has_academic_keywords:
            return {"status": "success", "verified": True, "doc_type": "Academic ID Recognized"}

        if len(extracted_text.strip()) > 10:
            return {"status": "success", "verified": True, "doc_type": "Identity Document Recognized"}

        return {"status": "error", "verified": False, "message": "Document layout text could not be recognized."}
    except Exception as e:
        return {"status": "error", "verified": False, "message": str(e)}

@app.get("/")
def status():
    return {"status": "AI Service Live"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)