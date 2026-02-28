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
        
        if p_count > 1: 
            violations.append("Multiple Persons")
        elif p_count == 0: 
            violations.append("No Person Detected")
        
        # Expanded check: If AI sees a remote, it's usually a phone
        phone_triggers = ["cell phone", "remote", "electronic", "mobile phone"]
        if any(obj in raw_results for obj in phone_triggers):
            violations.append("Cell Phone")
            
        if "book" in raw_results:
            violations.append("Book")
            
        if "laptop" in raw_results:
            violations.append("Laptop")

        return {"status": "success", "detections": violations}
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/")
def status():
    return {"status": "AI Service Live"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)