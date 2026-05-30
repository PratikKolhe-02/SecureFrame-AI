<div align="center">

```
███████╗███████╗ ██████╗██╗   ██╗██████╗ ███████╗    ███████╗██████╗  █████╗ ███╗   ███╗███████╗       █████╗ ██╗
██╔════╝██╔════╝██╔════╝██║   ██║██╔══██╗██╔════╝    ██╔════╝██╔══██╗██╔══██╗████╗ ████║██╔════╝      ██╔══██╗██║
███████╗█████╗  ██║     ██║   ██║██████╔╝█████╗      █████╗  ██████╔╝███████║██╔████╔██║█████╗  █████╗███████║██║
╚════██║██╔══╝  ██║     ██║   ██║██╔══██╗██╔══╝      ██╔══╝  ██╔══██╗██╔══██║██║╚██╔╝██║██╔══╝  ╚════╝██╔══██║██║
███████║███████╗╚██████╗╚██████╔╝██║  ██║███████╗    ██║     ██║  ██║██║  ██║██║ ╚═╝ ██║███████╗      ██║  ██║██║
╚══════╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝    ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝      ╚═╝  ╚═╝╚═╝
```

### **AI-Powered Proctoring Intelligence Platform**
*Hardened Exam Integrity Enforcement — Local Inference · Zero Trust · Forensic Logging*

---

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-FF6B35?style=for-the-badge)
![OpenVINO](https://img.shields.io/badge/OpenVINO-Intel-0071C5?style=for-the-badge&logo=intel&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-Dark_Cyberpunk-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

</div>

---

## ⚡ Overview

**SecureFrame-AI** is an enterprise-grade, AI-augmented proctoring platform engineered for academic and professional assessment environments demanding zero-compromise integrity enforcement. Built on a hardened React frontend sandbox, a high-throughput FastAPI inference gateway, and Intel OpenVINO-optimized YOLOv8 vision models, it delivers **sub-millisecond local CPU inference** without any cloud AI dependency — ensuring student data sovereignty and sub-100ms detection latency even on commodity hardware.

The platform operates on a **three-pillar security model**:

| Pillar | Component | Mechanism |
|---|---|---|
| 🧠 **Vision Intelligence** | YOLOv8 + OpenVINO | Real-time frame analysis at 3.5s intervals — Person & Phone detection |
| 🔒 **Sandbox Hardening** | React ExamPage | Clipboard wipe, DevTools block, cursor boundary tracking, tab visibility hooks |
| 🗄️ **Forensic Persistence** | Supabase PostgreSQL | Automated strike logging, violation image capture, session telemetry |

---

## 📐 System Architecture

### Block Transmission Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SECUREFRAME-AI  ·  SYSTEM ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────────────────────┘

  ╔═══════════════════════════════════╗
  ║   BROWSER SANDBOX LAYER           ║  ← React 18  ·  Tailwind CSS  ·  Lucide
  ║  ┌─────────────────────────────┐  ║
  ║  │  ExamPage.jsx               │  ║  Clipboard intercept  ·  F12 block
  ║  │  ┌──────────────────────┐   │  ║  PrintScreen trap  ·  ContextMenu null
  ║  │  │  react-webcam        │   │  ║
  ║  │  │  Frame → Base64      │───┼──╫──────────────────────────────────────────┐
  ║  │  └──────────────────────┘   │  ║  POST /analyze  (every 3.5 seconds)      │
  ║  │  ┌──────────────────────┐   │  ║  POST /verify-document  (one-shot)       │
  ║  │  │  Cursor Boundary     │   │  ║  POST /exam-start  (session init)        │
  ║  │  │  Monitor (async)     │   │  ║                                          │
  ║  │  └──────────────────────┘   │  ║                                          │
  ║  └─────────────────────────────┘  ║                                          │
  ║  ┌─────────────────────────────┐  ║                                          │
  ║  │  Dashboard.jsx              │  ║                                          │
  ║  │  initializeSession()  ──────┼──╫────────────────────────────────────┐     │
  ║  └─────────────────────────────┘  ║                                    │     │
  ╚═══════════════════════════════════╝                                    │     │
                                                                           │     │
                                                                           ▼     ▼
  ╔═══════════════════════════════════╗              ╔══════════════════════════════╗
  ║   FASTAPI LOCAL AI GATEWAY        ║              ║   SUPABASE DATA ECOSYSTEM    ║
  ║   ai-service/main.py              ║              ║                              ║
  ║                                   ║              ║  ┌──────────────────────┐    ║
  ║  ┌───────────────────────────┐    ║              ║  │  PostgreSQL Tables   │    ║
  ║  │  /exam-start              │    ║              ║  │  · exam_sessions     │    ║
  ║  │  Session UID + Reset      │    ║              ║  │  · violation_logs    │    ║
  ║  └───────────────────────────┘    ║              ║  │  · strike_records    │    ║
  ║  ┌───────────────────────────┐    ║              ║  └──────────────────────┘    ║
  ║  │  /analyze                 │    ║              ║  ┌──────────────────────┐    ║
  ║  │  ┌─────────────────────┐  │    ║              ║  │  Storage Buckets     │    ║
  ║  │  │  detector.py        │  │    ║              ║  │  · violation_images/ │    ║
  ║  │  │  YOLOv8 OpenVINO    │  │    ║              ║  │  · student_avatars/  │    ║
  ║  │  │  Class 0  (Person)  │  │    ║              ║  └──────────────────────┘    ║
  ║  │  │  Class 67 (Phone)   │  │    ║              ╚══════════════════════════════╝
  ║  │  └─────────────────────┘  │    ║                           ▲
  ║  └───────────────────────────┘    ║                           │
  ║  ┌───────────────────────────┐    ║                           │
  ║  │  /verify-document         │    ║           Violation writes · Session logs
  ║  │  EasyOCR → Greyscale      │    ║           Image uploads · Telemetry pings
  ║  │  Academic Pattern Match   │    ║                           │
  ║  └───────────────────────────┘    ╫───────────────────────────┘
  ╚═══════════════════════════════════╝
          │
          │   Uvicorn  ·  localhost:8000
          │   CPU-only inference  ·  No cloud AI
          ▼
  ╔════════════════════════════════════╗
  ║   AI/ML ENGINE LAYER               ║
  ║                                    ║
  ║   yolov8n_openvino_model/          ║
  ║   ├── yolov8n.xml                  ║
  ║   ├── yolov8n.bin                  ║
  ║   └── metadata.yaml                ║
  ║                                    ║
  ║   conf=0.40  ·  iou=0.45           ║
  ║   Latency target: <50ms / frame    ║
  ╚════════════════════════════════════╝
```

---

## 🔄 Full Operational Flowchart

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     SECUREFRAME-AI  ·  OPERATIONAL WORKFLOW                       │
└───────────────────────────────────────────────────────────────────────────────────┘

  [ STUDENT OPENS PLATFORM ]
           │
           ▼
  ┌────────────────────────┐
  │  Dashboard.jsx loads   │
  │  initializeSession()   │──── Supabase: INSERT exam_sessions row (UUID, timestamp)
  │  Network integrity     │
  │  status panel renders  │
  └────────────┬───────────┘
               │
               ▼
  ┌──────────────────────────────────────────────────────┐
  │              PHASE 1: IDENTITY VERIFICATION          │
  │                                                      │
  │  Step A: Portrait Capture                            │
  │  ┌──────────────────────┐                            │
  │  │  react-webcam snap   │──→ POST /verify-document   │
  │  │  (live face frame)   │    ↓                       │
  │  └──────────────────────┘    EasyOCR greyscale pass  │
  │                               ↓                      │
  │  Step B: ID Card Capture      Pattern match check:   │
  │  ┌──────────────────────┐    · "UNIVERSITY"          │
  │  │  Upload ID card img  │──→ · "STUDENT"             │
  │  │  (JPEG / PNG)        │    · "VIT", "BHOPAL"       │
  │  └──────────────────────┘    · "REGISTRATION"        │
  │                               · Govt. layout signals │
  │                               ↓                      │
  │                     ┌────────────────────┐           │
  │                     │  MATCH FOUND?       │          │
  │                     └────────┬───────────┘           │
  │                         YES  │   NO                  │
  │                          ↓   │   ↓                   │
  │                       PASS   │  FAIL → Toast Alert   │
  │                              │         Re-upload     │
  └──────────────────────────────┼───────────────────────┘
                                 │ PASS
                                 ▼
  ┌───────────────────────────────────────────────────────┐
  │              PHASE 2: FULLSCREEN SANDBOX INIT         │
  │                                                       │
  │  POST /exam-start                                     │
  │  · Session timestamp locked                           │
  │  · Strike counter reset → 0                           │
  │  · 8-second grace period clock starts                 │
  │                                                       │
  │  Browser locks into fullscreen mode                   │
  │  Sandbox restrictions ACTIVATED:                      │
  │  ✗ Right-click context menu  → suppressed             |  
  │  ✗ Ctrl+C / Ctrl+V / Ctrl+X → intercepted             │
  │  ✗ Clipboard                 → wiped every 2s         | 
  │  ✗ F12 / Ctrl+Shift+I/J/C   → blocked                 │
  │  ✗ PrintScreen               → intercepted            │
  │  ✗ Tab switch / blur         → flagged                |
  └────────────────────────┬──────────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                    PHASE 3: PARALLEL LIVE MONITORING LOOPS                      │
  │                                                                                 │
  │    ┌──────────────────────────────────┐     ┌───────────────────────────────┐   │
  │    │   LOOP A: AI FRAME ANALYSIS      │     │   LOOP B: CURSOR BOUNDARY     │   │
  │    │   Interval: every 3.5 seconds    │     │   Tracking: continuous async  │   │
  │    │                                  │     │                               │   │
  │    │  Webcam → Base64 frame           │     │  mousemove listener active    │   │
  │    │  POST /analyze                   │     │  Pointer exits viewport?      │   │
  │    │        ↓                         │     │           ↓                   │   │
  │    │  [Grace period active?]          │     │    YES → 6-second countdown   │   │
  │    │   YES (< 8s) → skip strike       │     │          timer fires          │   │
  │    │   NO  → full detection run       │     │    Returns in time? → cancel  │   │
  │    │        ↓                         │     │    Timer expires?   → STRIKE  │   │
  │    │  YOLOv8 OpenVINO inference       │     │                               │   │
  │    │  conf ≥ 0.40  ·  iou = 0.45      │     │  [Indicates multi-monitor or  │   │
  │    │        ↓                         │     │   off-screen reference check] │   │
  │    │  ┌─── Detection Results ──────┐  │     └───────────────────────────────┘   │
  │    │  │                            │  │                     │                   │
  │    │  │  0 persons detected?       │  │                     │                   │
  │    │  │  → +1 no-person streak     │  │                     │                   │
  │    │  │  streak ≥ 3 frames?        │  │                     │                   │
  │    │  │  → LOG "No Person" STRIKE  │  │                     │                   │
  │    │  │                            │  │                     │                   │
  │    │  │  >1 person detected?       │  │                     │                   │
  │    │  │  → IMMEDIATE HARD STRIKE   │  │                     │                   │
  │    │  │                            │  │                     │                   │
  │    │  │  Class 67 (phone/device)?  │  │                     │                   │
  │    │  │  → IMMEDIATE HARD STRIKE   │  │                     │                   │
  │    │  └────────────────────────────┘  │                     │                   │
  │    └──────────────────────────────────┘                     │                   │
  │                       │                                     │                   │
  └───────────────────────┼─────────────────────────────────────┼───────────────────┘
                          │  STRIKE EVENT                       │  STRIKE EVENT
                          └────────────────┬────────────────────┘
                                           ▼
  ┌────────────────────────────────────────────────────────────────────────────────┐
  │                     PHASE 4: STRIKE ADJUDICATION ENGINE                        │
  │                                                                                |
  │  strike_count += 1                                                             │
  │  Supabase: INSERT violation_logs (type, timestamp, frame_snapshot)             │
  │                                                                                │
  │                    ┌────────────────────┐                                      │
  │                    │  strike_count < 3  │                                      │
  │                    └────────┬───────────┘                                      │
  │                        YES  │   NO (≥ 3)                                       │
  │                         ↓   │      ↓                                           │
  │              Toast Warning  │   ┌───────────────────────────────────────────┐  │
  │              "Strike N of 3"│   │  AUTOMATED EXAM TERMINATION               │  │
  │              Exam continues │   │  · Fullscreen forcibly exited             │  │
  │                             │   │  · Webcam stream killed                   │  │
  │                             │   │  · Session status → "TERMINATED"          │  │
  │                             │   │  · Supabase: UPDATE exam_sessions         │  │
  │                             │   │  · Violation image uploaded to Storage    │  │
  │                             │   │  · Student redirected to termination UI   │  │
  │                             │   └───────────────────────────────────────────┘  │
  └────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Operational Matrix

### Hard Violations — Strike-Threshold Events

> These violations directly increment the **3-strike forced termination counter**. Any single event is logged to Supabase with a frame snapshot, timestamp, and violation classification code.

| # | Violation Class | Trigger Condition | Detection Source | DB Log |
|---|---|---|---|---|
| `HV-01` | **Unauthorized Device** | Class 67 (phone, tablet, remote) detected with conf ≥ 0.40 | YOLOv8 OpenVINO | ✅ `violation_logs` |
| `HV-02` | **Multiple Persons** | >1 person (Class 0) detected in a single frame | YOLOv8 OpenVINO | ✅ `violation_logs` |
| `HV-03` | **Candidate Absence** | 0 persons detected across ≥ 3 consecutive frames | YOLOv8 OpenVINO | ✅ `violation_logs` |
| `HV-04` | **Focus Abandonment** | Cursor leaves active viewport AND 6-second re-entry timer expires | Cursor Boundary Tracker | ✅ `violation_logs` |
| `HV-05` | **Tab Switch Detected** | `visibilitychange` or `blur` event fires on exam window | Browser Event API | ✅ `violation_logs` |

---

### Soft Restrictions — Intercept-Only Enforcement

> These controls **silently neutralize exploit vectors** and fire real-time toast alerts without incrementing the strike counter. They are designed to prevent cheating attempts rather than penalize ambiguous behavior.

| # | Restriction Class | Trigger | Enforcement Action | User Feedback |
|---|---|---|---|---|
| `SR-01` | **Clipboard Copy Block** | `Ctrl+C` keypress | Event propagation stopped; clipboard write suppressed | 🔔 Toast: *"Copying is not permitted"* |
| `SR-02` | **Clipboard Paste Block** | `Ctrl+V` keypress | Event propagation stopped; paste action voided | 🔔 Toast: *"Pasting is not permitted"* |
| `SR-03` | **Clipboard Cut Block** | `Ctrl+X` keypress | Event propagation stopped; cut action voided | 🔔 Toast: *"Cutting is not permitted"* |
| `SR-04` | **Background Clipboard Wipe** | 2-second polling loop (continuous) | `navigator.clipboard.writeText("")` executed silently | *(Silent — no alert)* |
| `SR-05` | **Context Menu Suppression** | Right-click anywhere in exam UI | `preventDefault()` on `contextmenu` event | *(Silent — menu simply absent)* |
| `SR-06` | **DevTools Block** | `F12` · `Ctrl+Shift+I` · `Ctrl+Shift+J` · `Ctrl+Shift+C` | `preventDefault()` + `stopPropagation()` | 🔔 Toast: *"Developer tools are disabled"* |
| `SR-07` | **PrintScreen Intercept** | `PrintScreen` keypress | Keydown event captured and cancelled | 🔔 Toast: *"Screenshots are not permitted"* |
| `SR-08` | **Cursor Boundary Warning** | Mouse exits viewport (timer not yet expired) | 6-second countdown UI overlay activates | ⚠️ Countdown overlay: *"Return to exam window"* |

---

## 🗂️ Project Structure

```
secureframe-ai/
│
├── ai-service/                          # FastAPI Backend + AI Inference Engine
│   ├── main.py                          # API gateway — /exam-start /analyze /verify-document
│   ├── detector.py                      # YOLOv8 OpenVINO inference core
│   ├── requirements.txt                 # Python dependencies
│   └── yolov8n_openvino_model/          # Compiled OpenVINO model directory
│       ├── yolov8n.xml                  # Model topology (IR format)
│       ├── yolov8n.bin                  # Model weights (binary)
│       └── metadata.yaml               # Class labels + model metadata
│
├── frontend/                            # React 18 Exam Dashboard
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── ExamPage.jsx             # Hardened sandbox exam interface
│   │   │   └── Dashboard.jsx            # Student session hub + telemetry panel
│   │   ├── components/                  # Shared UI components
│   │   ├── hooks/                       # Custom React hooks
│   │   └── lib/
│   │       └── supabaseClient.js        # Supabase client initialization
│   ├── tailwind.config.js               # Dark cyberpunk theme configuration
│   └── package.json
│
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend UI** | React 18 + Tailwind CSS | Dark cyberpunk analytics dashboard |
| **Icons** | Lucide React | Consistent iconography system |
| **Webcam** | react-webcam | Live frame capture → Base64 streaming |
| **Backend** | FastAPI + Uvicorn | High-performance async API gateway |
| **Object Detection** | Ultralytics YOLOv8n | Person & device detection model |
| **Inference Optimizer** | Intel OpenVINO | CPU-optimized IR model compilation |
| **OCR Engine** | EasyOCR | Offline academic document verification |
| **Database** | Supabase (PostgreSQL) | Session logs, violation records |
| **File Storage** | Supabase Storage | Violation images, student avatars |

---

## 🚀 Installation & Setup

### Prerequisites

- Python `3.10+`
- Node.js `18+` and npm / yarn
- A Supabase project with storage buckets configured
- Intel CPU (OpenVINO optimizes for Intel architecture; AMD compatible)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-org/secureframe-ai.git
cd secureframe-ai
```

---

### Step 2 — Backend: Python Environment Setup

```bash
# Navigate to the AI service directory
cd ai-service

# Create and activate a virtual environment
python -m venv venv

# Linux / macOS
source venv/bin/activate

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# Install all Python dependencies
pip install -r requirements.txt
```

**`requirements.txt` should include (minimum):**

```
fastapi
uvicorn[standard]
ultralytics
openvino
easyocr
opencv-python-headless
numpy
Pillow
python-multipart
supabase
```

---

### Step 3 — Export YOLOv8n to OpenVINO IR Format

> This step compiles the base `yolov8n.pt` PyTorch model into an Intel OpenVINO Intermediate Representation (IR), producing the `yolov8n_openvino_model/` directory required by `detector.py`.

```bash
# Ensure you are inside the ai-service directory with venv active
cd ai-service

# Run the OpenVINO export conversion via Ultralytics CLI
yolo export model=yolov8n.pt format=openvino

# Expected output directory structure after export:
# ai-service/
# └── yolov8n_openvino_model/
#     ├── yolov8n.xml          ← Model topology (IR format)
#     ├── yolov8n.bin          ← Model weights (binary blob)
#     └── metadata.yaml        ← Class map + model configuration
```

> **Note:** If `yolov8n.pt` is not present locally, Ultralytics will automatically download it from the official model hub on first run.

---

### Step 4 — Launch the FastAPI Inference Server

```bash
# From the ai-service directory with venv active
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API gateway will be live at: `http://localhost:8000`

Interactive API documentation available at: `http://localhost:8000/docs`

---

### Step 5 — Frontend: Install Dependencies & Launch

```bash
# Navigate to the frontend directory
cd ../frontend

# Install Node.js dependencies
npm install

# Start the React development server
npm run dev
```

The dashboard will be available at: `http://localhost:5173`

---

### Step 6 — Environment Variables

Create a `.env` file in `frontend/` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Create a `.env` file in `ai-service/` if backend Supabase writes are configured:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

---

## 📡 API Endpoint Reference

### `POST /exam-start`

Initializes a new exam session. Locks the session start timestamp and resets all violation streak counters.

```json
// Response
{
  "status": "session_initialized",
  "session_id": "uuid-v4-string",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "grace_period_seconds": 8
}
```

---

### `POST /analyze`

Accepts a Base64-encoded webcam frame. Executes YOLOv8 OpenVINO inference and returns structured detection results.

```json
// Request Body
{
  "frame": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB...",
  "session_id": "uuid-v4-string"
}

// Response
{
  "status": "ok",
  "violations": [],
  "persons_detected": 1,
  "devices_detected": 0,
  "strike_count": 0,
  "grace_period_active": false
}
```

| Field | Type | Description |
|---|---|---|
| `violations` | `array` | List of violation objects fired this frame |
| `persons_detected` | `int` | Total person instances (Class 0) in frame |
| `devices_detected` | `int` | Total device instances (Class 67) in frame |
| `strike_count` | `int` | Current cumulative strike total for session |
| `grace_period_active` | `bool` | Whether startup grace window is still active |

---

### `POST /verify-document`

Accepts a Base64-encoded ID card image. Runs EasyOCR pattern matching against academic and government document keywords — fully offline.

```json
// Request Body
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB..."
}

// Response — Verified
{
  "verified": true,
  "matched_patterns": ["UNIVERSITY", "VIT", "REGISTRATION"],
  "confidence": "high"
}

// Response — Rejected
{
  "verified": false,
  "matched_patterns": [],
  "confidence": "low",
  "message": "No valid academic or government document patterns detected."
}
```

**Recognized Pattern Keywords:**

```
Academic:    UNIVERSITY · STUDENT · VIT · BHOPAL · REGISTRATION · COLLEGE · INSTITUTE
Government:  Layout-structural heuristics (seal positioning, font grid patterns)
```

---

## 🧠 AI Detector Interface

**File:** `ai-service/detector.py`

| Function | Signature | Description |
|---|---|---|
| `detect_from_frame` | `(frame: np.ndarray, conf=0.40, iou=0.45)` | Runs OpenVINO inference on an in-memory numpy frame array |
| `detect_from_file` | `(image_path: str)` | Loads image from disk path and runs detection pipeline |
| `labels_only` | `(detections: list)` | Strips bounding box coordinates; returns string label list only |

**Class Target Filter:**

```python
ALLOWED_CLASSES = {
    0:  "person",       # Candidate presence monitoring
    67: "cell phone",   # Unauthorized device detection
}
# All other COCO classes are silently discarded at inference time
# to eliminate computational noise and minimize per-frame latency.
```

---

## 🗄️ Supabase Schema Reference

### `exam_sessions`

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key — auto-generated |
| `student_id` | `uuid` | Foreign key to student profile |
| `started_at` | `timestamptz` | Session initialization timestamp |
| `ended_at` | `timestamptz` | Termination or completion timestamp |
| `status` | `text` | `active` · `completed` · `terminated` |
| `final_strike_count` | `int` | Total hard violations at session end |

### `violation_logs`

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key |
| `session_id` | `uuid` | FK → `exam_sessions.id` |
| `violation_type` | `text` | `HV-01` through `HV-05` classification code |
| `occurred_at` | `timestamptz` | Precise violation timestamp |
| `frame_snapshot_url` | `text` | Storage bucket URL for captured violation image |
| `strike_index` | `int` | Strike number at time of violation (1, 2, or 3) |

---

## 🔮 Roadmap

| Status | Feature |
|---|---|
| ✅ Done | YOLOv8 OpenVINO local CPU inference pipeline |
| ✅ Done | EasyOCR document pattern verification (offline) |
| ✅ Done | 3-strike hard violation termination engine |
| ✅ Done | Browser sandbox: clipboard wipe, DevTools block, cursor tracking |
| ✅ Done | Supabase forensic violation logging with frame snapshots |
| 🔄 In Progress | Gaze estimation (eye-tracking) for off-screen attention detection |
| 🔄 In Progress | Audio analysis pipeline (ambient voice / background speech detection) |
| 📋 Planned | Admin forensic review dashboard with session playback |
| 📋 Planned | Multi-student parallel session orchestration |
| 📋 Planned | WebRTC live proctoring stream for invigilator oversight |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request against `main`

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**SecureFrame-AI** — *Built for institutions where integrity is non-negotiable.*

</div>
