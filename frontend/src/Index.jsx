import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { supabase } from './supabaseClient';

const Index = () => {
  const webcamRef = useRef(null);
  const [status, setStatus] = useState("Status: Nominal");
  const [detections, setDetections] = useState([]);
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('secureframe_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [startTime] = useState(new Date().toISOString());

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const capture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      try {
        const response = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageSrc }),
        });
        const data = await response.json();

        const actualThreats = data.detections?.filter(item => {
          const label = item.toLowerCase();
          return label.includes("phone") || 
                 label.includes("cell") || 
                 label.includes("mobile") ||
                 label.includes("multiple") ||
                 label.includes("no person")
        }) || [];

        if (data.status === "success" && actualThreats.length > 0) {
          setDetections(actualThreats);
          setStatus("Alert: Activity Detected");
          
          const fileName = `violation_${Date.now()}.jpg`;
          const res = await fetch(imageSrc);
          const blob = await res.blob();
          
          const { data: uploadData } = await supabase.storage
            .from('violation-evidence')
            .upload(fileName, blob);

          const evidenceUrl = uploadData ? 
            supabase.storage.from('violation-evidence').getPublicUrl(fileName).data.publicUrl : null;

          setLogs(prev => [{ 
            time: new Date().toLocaleTimeString(), 
            msg: actualThreats.join(", "),
            evidence: evidenceUrl 
          }, ...prev].slice(0, 10));
        } else {
          setDetections([]);
          setStatus("Status: Nominal");
        }
      } catch (error) {
        setStatus("AI Service Offline");
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(capture, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('secureframe_logs', JSON.stringify(logs));
  }, [logs]);

  const handleEndSession = async () => {
    if (window.confirm("Submit logs and end session?")) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        await fetch('http://localhost:5000/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            violations: logs,
            timestamp: startTime,
            userId: user?.id || null
          }),
        });
        
        localStorage.removeItem('secureframe_logs');
        setLogs([]);
        alert("Session saved.");
        handleLogout();
      } catch (error) {
        alert("Database sync failed.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-mono p-8 flex flex-col items-center">
      <header className="w-full max-w-5xl flex justify-between items-center mb-10 border-b border-[#1e293b] pb-6">
        <h1 className="text-2xl font-bold text-[#39FF14]">SECUREFRAME-AI</h1>
        <div className="flex gap-4 items-center">
          <button onClick={handleLogout} className="text-[10px] text-gray-400 border border-white/20 px-2 py-1 rounded uppercase">Logout</button>
          <button onClick={handleEndSession} className="border border-red-500 text-red-500 px-3 py-1 rounded text-[10px] uppercase">End Session</button>
          <div className="px-4 py-1 rounded-full border border-[#39FF14]/30 bg-[#39FF14]/10">
            <span className="text-[10px] font-bold text-[#39FF14]">{status}</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl relative border-2 border-[#1e293b] rounded-2xl overflow-hidden bg-black shadow-[0_0_50px_rgba(57,255,20,0.1)]">
        <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="w-full h-auto" style={{ transform: 'scaleX(-1)' }} />
        <div className="absolute bottom-4 left-4 flex gap-2">
          {detections.map((item, i) => (
            <span key={i} className="bg-red-600 px-2 py-1 rounded text-xs font-bold uppercase">Detected: {item}</span>
          ))}
        </div>
      </main>

      <div className="mt-8 w-full max-w-4xl bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
        <h2 className="text-[#39FF14] text-[10px] font-bold uppercase mb-3">Live Violation Log</h2>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {logs.length === 0 ? <p className="text-gray-500 text-[10px]">No violations recorded.</p> : 
            logs.map((log, i) => (
              <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 text-[10px]">
                <span className="text-red-500 font-bold">[{log.time}] Flagged: {log.msg}</span>
                {log.evidence && <a href={log.evidence} target="_blank" rel="noreferrer" className="text-[#39FF14] underline ml-2 text-[8px]">PROOF</a>}
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

export default Index;