import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Loader2, Activity, Cpu, AlertCircle, Zap, ChevronRight, Camera, UserCheck } from "lucide-react";

const ExamPage = ({ session }) => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [examStarted, setExamStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [activityLog, setActivityLog] = useState([]);
  const [status, setStatus] = useState("SECURE");
  const [riskScore, setRiskScore] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const fullName = session?.user?.user_metadata?.full_name || session?.user?.email || "Candidate";
  const formattedName = fullName.split(' ')[0].split('@')[0].toUpperCase();

  const examQuestions = [
    { id: 1, question: "What is the primary goal of AI Safety?", options: ["Speed", "Alignment", "Cost", "Power"] },
    { id: 2, question: "Which protocol is used for secure data transmission?", options: ["HTTP", "HTTPS", "FTP", "SMTP"] }
  ];

  const handleStartExam = async () => {
    setIsInitializing(true);
    try {
      const { data, error } = await supabase
        .from('ExamSession')
        .insert([{
          userId: session?.user?.id,
          userName: fullName,
          userEmail: session?.user?.email,
          startTime: new Date().toISOString(),
          riskScore: 0,
          status: 'ongoing'
        }])
        .select();

      if (error) throw error;
      if (data?.[0]) {
        setCurrentSessionId(data[0].id);
        setExamStarted(true);
      }
    } catch (e) {
      alert("System Error: Failed to initialize proctoring session.");
    } finally {
      setIsInitializing(false);
    }
  };

  const addLog = useCallback(async (message, type = "info", imageSrc = null) => {
    if (!currentSessionId) return;
    let evidence_url = null;
    if (imageSrc && type === "warning") {
      try {
        const fileName = `${session?.user?.id}_${Date.now()}.jpg`;
        const blob = await (await fetch(imageSrc)).blob();
        await supabase.storage.from('violation-evidence').upload(fileName, blob);
        const { data: pData } = supabase.storage.from('violation-evidence').getPublicUrl(fileName);
        evidence_url = pData.publicUrl;
      } catch (e) { console.error("Upload Error:", e); }
    }
    await supabase.from('IncidentLog').insert([{
      sessionId: currentSessionId,
      description: message,
      type,
      evidence_url,
      timestamp: new Date().toISOString()
    }]);
    setActivityLog(prev => [{ id: Date.now(), description: message, type }, ...prev].slice(0, 10));
  }, [session, currentSessionId]);

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
        setStatus("VIOLATION");
        addLog(`DETECTED: ${data.detections.join(", ")}`, "warning", imageSrc);
      } else { setStatus("SECURE"); }
    } catch (e) { setStatus("OFFLINE"); }
  }, [examStarted, addLog]);

  useEffect(() => {
    if (!examStarted) return;
    const interval = setInterval(capture, 3000);
    return () => clearInterval(interval);
  }, [examStarted, capture]);

  const handleSubmit = async () => {
    if (currentSessionId) {
      await supabase.from('ExamSession').update({ 
        status: 'completed', 
        endTime: new Date().toISOString() 
      }).eq('id', currentSessionId);
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white p-4 flex flex-col font-mono selection:bg-[#39FF14]/30">
      <nav className="flex justify-between items-center mb-4 border border-white/10 bg-[#11141b]/50 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/favicon.png" className="w-5 h-5" alt="logo" />
          <h2 className="text-sm tracking-[0.3em] font-black uppercase">
            SECUREFRAME<span className="text-[#39FF14]">-AI</span>
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[8px] text-white/30 uppercase tracking-widest font-bold">Integrity Level</span>
            <div className="w-32 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
               <div className="h-full bg-[#39FF14] transition-all duration-500" style={{ width: `${100 - riskScore}%` }}></div>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black border transition-all ${status === 'VIOLATION' ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]'}`}>
            STATUS: {status}
          </div>
        </div>
      </nav>

      <div className="flex flex-1 gap-4 overflow-hidden">
        <aside className="w-80 flex flex-col gap-4">
          <div className="aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl group">
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/80 px-2 py-1 rounded text-[8px] font-bold uppercase border border-white/5">
              <Activity size={10} className="text-red-500 animate-pulse" />
              LIVE ANALYSIS
            </div>
          </div>
          <div className="bg-[#11141b] border border-white/5 p-4 rounded-2xl flex items-center gap-4">
            <div className="bg-[#39FF14]/5 p-2 rounded-lg border border-[#39FF14]/10">
              <Cpu size={18} className="text-[#39FF14]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[8px] text-white/30 uppercase tracking-widest leading-none mb-1">Authenticated</p>
              <p className="text-xs font-bold text-white truncate">{formattedName}</p>
            </div>
          </div>
          <div className="flex-grow bg-[#11141b] border border-white/5 rounded-2xl p-4 overflow-hidden flex flex-col">
            <p className="text-[9px] text-white/30 uppercase font-black mb-4 flex items-center gap-2 tracking-widest">
              <AlertCircle size={12} /> Forensic Stream
            </p>
            <div className="space-y-3 overflow-y-auto no-scrollbar opacity-50">
              {activityLog.length === 0 && <p className="text-[10px] italic tracking-tighter">Waiting for telemetry...</p>}
              {activityLog.map(log => (
                <div key={log.id} className="text-[9px] border-l border-white/10 pl-2 py-1">
                  <span className="text-[#39FF14]/50 mr-2">{new Date(log.id).toLocaleTimeString([], {hour12: false})}</span>
                  {log.description}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-[#11141b] rounded-[2rem] border border-white/10 flex flex-col relative overflow-hidden shadow-2xl">
          {!examStarted ? (
            <div className="m-auto w-full max-w-2xl px-8">
              <div className="bg-[#07090e] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#39FF14]/5 rounded-full blur-3xl"></div>
                
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="relative group/logo mb-6">
                    <div className="absolute inset-0 bg-[#39FF14]/20 blur-2xl rounded-full scale-150 opacity-0 group-hover/logo:opacity-100 transition-all duration-700"></div>
                    <img src="/favicon.png" className="w-16 h-16 object-contain relative z-10 transition-transform group-hover/logo:scale-110" alt="Logo" />
                  </div>

                  <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter italic">System Authentication</h3>
                  <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-8">All Systems Operational</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 relative overflow-hidden group/box">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#39FF14]/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity"></div>
                      <Camera size={20} className="text-[#39FF14]" />
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Visual Link</p>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#39FF14]/10 rounded-full border border-[#39FF14]/20">
                        <div className="w-1 h-1 bg-[#39FF14] rounded-full animate-pulse"></div>
                        <span className="text-[8px] text-[#39FF14] font-bold">ACTIVE</span>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 relative overflow-hidden group/box">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#39FF14]/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity"></div>
                      <ShieldCheck size={20} className="text-[#39FF14]" />
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Environment</p>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#39FF14]/10 rounded-full border border-[#39FF14]/20">
                        <div className="w-1 h-1 bg-[#39FF14] rounded-full animate-pulse"></div>
                        <span className="text-[8px] text-[#39FF14] font-bold">SECURE</span>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 relative overflow-hidden group/box">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#39FF14]/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity"></div>
                      <UserCheck size={20} className="text-[#39FF14]" />
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Identity Auth</p>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#39FF14]/10 rounded-full border border-[#39FF14]/20">
                        <div className="w-1 h-1 bg-[#39FF14] rounded-full animate-pulse"></div>
                        <span className="text-[8px] text-[#39FF14] font-bold">VERIFIED</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleStartExam} 
                    disabled={isInitializing}
                    className="w-full bg-[#39FF14] hover:bg-white text-black font-black py-6 rounded-2xl transition-all active:scale-95 shadow-[0_0_40px_-10px_#39FF14] flex items-center justify-center gap-3 uppercase tracking-widest text-xs group/btn"
                  >
                    {isInitializing ? <Loader2 className="animate-spin" /> : <Zap size={16} className="fill-black" />}
                    <span>{isInitializing ? "Establishing Link..." : "Deploy Assessment"}</span>
                    <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 h-full flex flex-col">
              <div className="flex items-center gap-4 mb-12">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#39FF14] bg-[#39FF14]/10 px-4 py-2 rounded-lg border border-[#39FF14]/20">
                  DATA SEGMENT: 0{currentIndex + 1}
                </span>
                <div className="flex-grow h-[1px] bg-white/5"></div>
              </div>

              <div className="max-w-3xl">
                <h3 className="text-4xl font-black mb-12 text-white leading-tight tracking-tighter uppercase">
                  {examQuestions[currentIndex].question}
                </h3>
                
                <div className="space-y-4">
                  {examQuestions[currentIndex].options.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => setAnswers({...answers, [currentIndex]: i})} 
                      className={`w-full text-left p-6 rounded-2xl border transition-all flex justify-between items-center group/opt ${answers[currentIndex] === i ? "border-[#39FF14] bg-[#39FF14]/5 text-[#39FF14]" : "border-white/5 hover:bg-white/5 text-white/40"}`}
                    >
                      <span className="text-lg font-bold tracking-tight uppercase">{opt}</span>
                      <div className={`w-5 h-5 rounded border-2 ${answers[currentIndex] === i ? "border-[#39FF14] bg-[#39FF14]" : "border-white/10"}`}>
                        {answers[currentIndex] === i && <ShieldCheck size={16} className="text-black" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-8 flex justify-between items-center">
                <button 
                   onClick={() => setCurrentIndex(p => p - 1)} 
                   disabled={currentIndex === 0} 
                   className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-lg border border-white/5 ${currentIndex === 0 ? "opacity-0" : "hover:bg-white/5"}`}
                >
                  [ Previous ]
                </button>
                <button 
                  onClick={currentIndex === examQuestions.length - 1 ? handleSubmit : () => setCurrentIndex(p => p + 1)} 
                  className="bg-[#39FF14] text-black font-black px-12 py-5 rounded-xl uppercase text-xs tracking-[0.2em] shadow-[0_0_30px_-5px_#39FF14] hover:scale-105 transition-all"
                >
                  {currentIndex === examQuestions.length - 1 ? "Terminate Session" : "Next Segment"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ExamPage;