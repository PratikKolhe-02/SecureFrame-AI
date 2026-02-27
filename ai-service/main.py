from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64, cv2, numpy as np
from detector import detect_objects

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class FrameData(BaseModel):
    image: str

@app.post("/analyze")
async def analyze_frame(data: FrameData):
    try:
        header, encoded = data.image.split(",", 1)
        image_data = base64.b64decode(encoded)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        cv2.imwrite("current_frame.jpg", frame)
        raw_results = detect_objects("current_frame.jpg")
        
        violations = []
        p_count = raw_results.count("person")
        if p_count > 1: violations.append("Multiple Persons")
        elif p_count == 0: violations.append("No Person Detected")
        if "cell phone" in raw_results: violations.append("Cell Phone")

        return {"status": "success", "detections": violations}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
def status():
    return {"status": "AI Service Live"}