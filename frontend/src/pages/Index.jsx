import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { supabase } from '../supabaseClient';
import { Shield } from "lucide-react";

const Index = ({ session }) => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [examStarted, setExamStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [status, setStatus] = useState("Status: Nominal");
  const [startTime] = useState(new Date().toISOString());

  const examQuestions = [
    { id: 1, question: "What is the primary goal of AI Safety?", options: ["Speed", "Alignment", "Cost", "Power"] },
    { id: 2, question: "Which protocol is used for secure data transmission?", options: ["HTTP", "HTTPS", "FTP", "SMTP"] }
  ];

  const addLog = useCallback(async (message, type = "info", imageSrc = null) => {
    const lastLog = activityLog[0];
    if (lastLog && lastLog.description === message && (Date.now() - lastLog.id < 4000)) return;

    let evidence_url = null;
    if (imageSrc && type === "warning") {
      try {
        const fileName = `${session?.user?.id}_${Date.now()}.jpg`;
        const blob = await (await fetch(imageSrc)).blob();
        await supabase.storage.from('violation-evidence').upload(fileName, blob);
        const { data: pData } = supabase.storage.from('violation-evidence').getPublicUrl(fileName);
        evidence_url = pData.publicUrl;
      } catch (e) { console.error(e); }
    }

    setActivityLog(prev => [{ 
        id: Date.now(), 
        description: message, 
        timestamp: new Date().toISOString(), 
        type, 
        evidence_url 
    }, ...prev]);
  }, [session, activityLog]);

  const capture = useCallback(async () => {
    if (!examStarted || !webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc }),
      });
      const data = await res.json();
      
      if (data.status === "success" && data.detections.length > 0) {
        setStatus("⚠️ VIOLATION");
        addLog(`Detected: ${data.detections.join(", ")}`, "warning", imageSrc);
      } else {
        setStatus("✅ NOMINAL");
      }
    } catch (e) { setStatus("OFFLINE"); }
  }, [examStarted, addLog]);

  useEffect(() => {
    if (!examStarted) return;
    const interval = setInterval(capture, 1500);
    return () => clearInterval(interval);
  }, [examStarted, capture]);

  const handleSubmit = async () => {
    try {
      const warnings = activityLog.filter(l => l.type === 'warning');
      let risk = 0;
      warnings.forEach(log => {
        const d = log.description.toLowerCase();
        if (d.includes('phone') || d.includes('remote')) risk += 60;
        else if (d.includes('person')) risk += 50;
        else risk += 15;
      });

      const riskScore = Math.min(risk, 100);
      const { data: sData } = await supabase.from('ExamSession').insert([{
        userId: session?.user?.id,
        userName: session?.user?.user_metadata?.full_name || "Student",
        userEmail: session?.user?.email,
        startTime,
        endTime: new Date().toISOString(),
        riskScore,
        status: 'completed'
      }]).select();

      if (sData?.[0]) {
        const incidents = activityLog.map(l => ({
          sessionId: sData[0].id,
          description: l.description,
          type: l.type,
          evidence_url: l.evidence_url,
          timestamp: l.timestamp
        }));
        await supabase.from('IncidentLog').insert(incidents);
      }
      navigate('/dashboard');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex min-h-screen bg-[#07090e] text-white font-mono p-4 gap-4">
      <div className="w-72 border border-white/10 rounded-2xl bg-black/40 p-4 flex flex-col">
        <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-xl mb-4 border border-white/10" />
        <div className={`text-center py-1 rounded text-[10px] font-bold mb-4 ${status.includes('VIOLATION') ? 'bg-red-600' : 'bg-[#39FF14] text-black'}`}>{status}</div>
        <div className="flex-grow overflow-y-auto space-y-2">
           {activityLog.map(log => (
             <div key={log.id} className={`p-2 rounded text-[9px] border ${log.type === 'warning' ? 'bg-red-500/10 border-red-500/30' : 'opacity-30'}`}>{log.description}</div>
           ))}
        </div>
      </div>
      <div className="flex-grow bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col">
        {!examStarted ? (
          <div className="m-auto text-center">
             <Shield size={48} className="text-[#39FF14] mx-auto mb-4" />
             <button onClick={() => setExamStarted(true)} className="bg-[#39FF14] text-black px-10 py-3 rounded-xl font-black">START</button>
          </div>
        ) : (
          <>
            <h3 className="text-xl mb-8 font-bold">{examQuestions[currentIndex].question}</h3>
            <div className="grid gap-3 flex-grow">
              {examQuestions[currentIndex].options.map((opt, i) => (
                <button key={i} onClick={() => setAnswers({...answers, [currentIndex]: i})} className={`w-full text-left p-5 rounded-xl border ${answers[currentIndex] === i ? "border-[#39FF14] bg-[#39FF14]/5" : "border-white/5 hover:bg-white/5"}`}>{opt}</button>
              ))}
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={() => setCurrentIndex(p => p - 1)} disabled={currentIndex === 0} className="opacity-40">PREV</button>
              <button onClick={currentIndex === examQuestions.length - 1 ? handleSubmit : () => setCurrentIndex(p => p + 1)} className="bg-[#39FF14] text-black px-10 py-3 rounded-xl font-black">{currentIndex === examQuestions.length - 1 ? "FINISH" : "NEXT"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default Index;