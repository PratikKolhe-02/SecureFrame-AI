FROM python:3.12-slim
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglx0 \
    libegl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt').export(format='openvino')"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]