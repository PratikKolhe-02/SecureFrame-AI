from fastapi import FastAPI, UploadFile, File
from detector import detect_objects
import shutil
import os

app = FastAPI()

@app.post("/analyze")
async def analyze_frame(file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        results = detect_objects(temp_path)
        return {"detections": results}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/")
def status():
    return {"status": "SecureFrame-AI Service is Live"}