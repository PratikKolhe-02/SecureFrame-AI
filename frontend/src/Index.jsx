import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

const Index = () => {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [detections, setDetections] = useState([]);
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('secureframe_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('secureframe_logs', JSON.stringify(logs));
  }, [logs]);

  const formatTime = (date) =>
    date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const capture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;
      try {
        const response = await fetch('http://localhost:5001/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageSrc }),
        });
        const data = await response.json();
        if (data.status === "success") {
          setDetections(data.detections || []);
          if (data.detections?.length > 0) {
            setStatus("Alert: Activity Detected");
            setLogs(prev => [{ time: formatTime(new Date()), msg: data.detections.join(", ") }, ...prev].slice(0, 10));
          } else {
            setStatus("Status: Nominal");
          }
        }
      } catch (error) { setStatus("AI Service Offline"); }
    }
  };

  useEffect(() => {
    const interval = setInterval(capture, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleEndSession = async () => {
    if (window.confirm("Submit logs and end session?")) {
      try {
        await fetch('http://localhost:5000/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ violations: logs, timestamp: new Date() }),
        });
        localStorage.removeItem('secureframe_logs');
        setLogs([]);
        alert("Session Submitted Successfully.");
      } catch (error) { alert("Failed to sync with backend."); }
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-mono p-8 flex flex-col items-center">
      <header className="w-full max-w-5xl flex justify-between items-center mb-10 border-b border-[#1e293b] pb-6">
        <div className="flex items-center gap-3">
          {/* Favicon added here */}
          <img src="/favicon.png" alt="logo" className="w-8 h-8 object-contain" />
          <h1 className="text-2xl font-bold text-[#39FF14]">SECUREFRAME-AI</h1>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={handleEndSession} className="border border-red-500/50 text-red-500 px-3 py-1 rounded text-[10px] uppercase hover:bg-red-500/10 transition-colors">
            End Session
          </button>
          <div className="px-4 py-1 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/10">
            <span className="text-[10px] font-bold text-[#39FF14]">{status}</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl relative border-2 border-[#1e293b] rounded-2xl overflow-hidden bg-black">
        <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="w-full h-auto" style={{ transform: 'scaleX(-1)' }} />
        <div className="scan-line" />
        {/* Detection Badges */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {detections.map((item, index) => (
            <span key={index} className="bg-red-600 text-white text-[10px] px-2 py-1 rounded uppercase animate-pulse">
              Detected: {item}
            </span>
          ))}
        </div>
      </main>

      <div className="mt-8 w-full max-w-4xl bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="text-[#39FF14] text-[10px] font-bold uppercase mb-3">Live Violation Log</h2>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-[10px]">No violations recorded.</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex justify-between border-b border-white/5 pb-2 text-[10px]">
                <span className="text-red-500 font-bold">[{log.time}]</span>
                <span className="text-gray-300">Flagged: {log.msg}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;