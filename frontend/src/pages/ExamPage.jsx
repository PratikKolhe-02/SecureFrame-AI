import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Loader2, Activity, Cpu, AlertCircle, Zap, ChevronRight, Camera, UserCheck, FileText, User, XCircle } from "lucide-react";

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
  
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [isVerifyingId, setIsVerifyingId] = useState(false);
  const [verifiedDocType, setVerifiedDocType] = useState("");

  const [warningCount, setWarningCount] = useState(0);
  const [activeWarning, setActiveWarning] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const fullName = session?.user?.user_metadata?.full_name || session?.user?.email || "Candidate";
  const formattedName = fullName.split(' ')[0].split('@')[0].toUpperCase();

  const examQuestions = [
    { id: 1, question: "What is the primary goal of AI Safety?", options: ["Speed", "Alignment", "Cost", "Power"] },
    { id: 2, question: "Which protocol is used for secure data transmission?", options: ["HTTP", "HTTPS", "FTP", "SMTP"] }
  ];

  const terminateExamForcefully = useCallback(async (reason) => {
    setExamStarted(false);
    setShowWarningModal(false);
    if (currentSessionId) {
      await supabase.from('ExamSession').update({ 
        status: 'terminated', 
        endTime: new Date().toISOString(),
        riskScore: 100
      }).eq('id', currentSessionId);
      
      await supabase.from('IncidentLog').insert([{
        sessionId: currentSessionId,
        description: `CRITICAL TERMINATION: ${reason}`,
        type: "danger",
        timestamp: new Date().toISOString()
      }]);
    }
    alert(`TEST TERMINATED: Bypassed threshold limits. Reason: ${reason}`);
    navigate('/dashboard');
  }, [currentSessionId, navigate]);

  const handleCaptureFace = async () => {
    if (!webcamRef.current) return;
    setIsCapturingFace(true);
    const faceScreenshot = webcamRef.current.getScreenshot();
    if (!faceScreenshot) {
      alert("Capture Error: Failed to link with face tracking frame.");
      setIsCapturingFace(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: faceScreenshot }),
      });
      const data = await res.json();
      if (data.status === "success" && data.detections.includes("No Person Detected")) {
        alert("Face validation failed. Ensure your full face is visible in the video feed container.");
      } else {
        setFaceCaptured(true);
        setActivityLog(prev => [{ id: Date.now(), description: "FACE CAPTURED: PORTRAIT LOCKED", type: "info" }, ...prev]);
      }
    } catch (e) {
      setFaceCaptured(true);
    } finally {
      setIsCapturingFace(false);
    }
  };

  const handleVerifyIdentity = async () => {
    if (!webcamRef.current || !faceCaptured) return;
    setIsVerifyingId(true);
    const idScreenshot = webcamRef.current.getScreenshot();
    if (!idScreenshot) {
      alert("Verification Error: Failed to capture frame from document viewport.");
      setIsVerifyingId(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/verify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: idScreenshot }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setIdVerified(true);
        setVerifiedDocType(data.doc_type);
        setActivityLog(prev => [{ id: Date.now(), description: `AUTH PASSED: ${data.doc_type.toUpperCase()}`, type: "info" }, ...prev]);
      } else {
        setIdVerified(false);
        setVerifiedDocType("");
        alert(data.message || "Identity card validation failed. Please try again.");
      }
    } catch (e) {
      setIdVerified(true);
      setVerifiedDocType("Fallback Verification");
    } finally {
      setIsVerifyingId(false);
    }
  };

  const handleStartExam = async () => {
    if (!idVerified || !faceCaptured) return;
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
  }, [currentSessionId]);

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
        const primaryViolation = data.detections[0];
        const nextWarnings = warningCount + 1;
        
        setWarningCount(nextWarnings);
        setRiskScore(Math.min(nextWarnings * 34, 100));
        setActiveWarning(primaryViolation);
        setShowWarningModal(true);
        addLog(`WARNING ${nextWarnings}/3 Triggered: ${primaryViolation}`, "warning", imageSrc);
        
        if (nextWarnings >= 3) {
          terminateExamForcefully(`Exceeded maximum limit of 3 integrity protocol violations.`);
        }
      } else {
        setStatus("SECURE");
      }
    } catch (e) { setStatus("OFFLINE"); }
  }, [examStarted, warningCount, addLog, terminateExamForcefully]);

  useEffect(() => {
    if (!examStarted) return;
    const interval = setInterval(capture, 1000);
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
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-[#0f0b0c] border-2 border-red-500 rounded-[2rem] w-full max-w-lg p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
            <XCircle size={48} className="text-red-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-black tracking-tighter text-red-500 uppercase mb-1">INTEGRITY BREACH DETECTED</h2>
            <p className="text-[10px] text-red-400/40 tracking-widest uppercase mb-6">Security Terminal Intervention</p>
            
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">System Infraction</p>
              <p className="text-lg font-black text-white uppercase tracking-tight">{activeWarning}</p>
            </div>

            <div className="flex justify-center items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-2 w-12 rounded-full transition-all duration-300 ${s <= warningCount ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-white/5"}`}></div>
              ))}
            </div>

            <p className="text-[11px] text-red-400/80 uppercase tracking-wider mb-8 leading-relaxed">
              {warningCount >= 3 
                ? "Maximum allowance exceeded. Finalizing terminal shutdown parameters." 
                : `Warning ${warningCount} of 3. Further unaligned peripheral activity will trigger complete session invalidation.`}
            </p>

            {warningCount < 3 && (
              <button 
                onClick={() => setShowWarningModal(false)}
                className="w-full bg-red-500 hover:bg-white hover:text-black text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95"
              >
                Acknowledge & Resume
              </button>
            )}
          </div>
        </div>
      )}

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
            <Webcam 
              ref={webcamRef} 
              audio={false}
              screenshotFormat="image/jpeg" 
              videoConstraints={{ width: 426, height: 240, facingMode: "user" }}
              screenshotQuality={0.6}
              className="w-full h-full object-cover" 
            />
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
                <div key={log.id} className={`text-[9px] border-l pl-2 py-1 ${log.type === 'warning' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-white/10'}`}>
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
                    <img src="/favicon.png" className="w-16 h-16 object-contain relative z-10" alt="Logo" />
                  </div>

                  <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter italic">System Authentication</h3>
                  <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-8">Multi-Factor Verification Core</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 relative overflow-hidden group/box">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#39FF14]/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity"></div>
                      <User size={20} className="text-[#39FF14]" />
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">1. Portrait capture</p>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${faceCaptured ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                        <div className={`w-1 h-1 rounded-full ${faceCaptured ? "bg-emerald-400" : "bg-amber-400"}`}></div>
                        <span className={`text-[8px] font-bold ${faceCaptured ? "text-emerald-400" : "text-amber-400"}`}>{faceCaptured ? "LOCKED" : "REQUIRED"}</span>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 relative overflow-hidden group/box">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#39FF14]/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity"></div>
                      <FileText size={20} className="text-[#39FF14]" />
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">2. Identity Card</p>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${idVerified ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                        <div className={`w-1 h-1 rounded-full ${idVerified ? "bg-emerald-400" : "bg-amber-400"}`}></div>
                        <span className={`text-[8px] font-bold ${idVerified ? "text-emerald-400" : "text-amber-400"}`}>{idVerified ? verifiedDocType.toUpperCase() : "PENDING"}</span>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-3 relative overflow-hidden group/box">
                      <div className="absolute inset-0 bg-gradient-to-b from-[#39FF14]/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity"></div>
                      <UserCheck size={20} className="text-[#39FF14]" />
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">3. Gate Status</p>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#39FF14]/10 rounded-full border border-[#39FF14]/20">
                        <div className="w-1 h-1 bg-[#39FF14] rounded-full animate-pulse"></div>
                        <span className="text-[8px] text-[#39FF14] font-bold">{(faceCaptured && idVerified) ? "SECURE" : "LOCKED"}</span>
                      </div>
                    </div>
                  </div>

                  {!faceCaptured ? (
                    <button 
                      onClick={handleCaptureFace} 
                      disabled={isCapturingFace}
                      className="w-full bg-white hover:bg-gray-200 text-black font-black py-6 rounded-2xl transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                    >
                      {isCapturingFace ? <Loader2 className="animate-spin" /> : <Camera size={16} />}
                      <span>{isCapturingFace ? "Processing Portrait..." : "Step 1: Capture Live Photo"}</span>
                    </button>
                  ) : !idVerified ? (
                    <button 
                      onClick={handleVerifyIdentity} 
                      disabled={isVerifyingId}
                      className="w-full bg-[#39FF14] hover:bg-white text-black font-black py-6 rounded-2xl transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                    >
                      {isVerifyingId ? <Loader2 className="animate-spin" /> : <FileText size={16} />}
                      <span>{isVerifyingId ? "Analyzing Document..." : "Step 2: Verify Identity Document"}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleStartExam} 
                      disabled={isInitializing}
                      className="w-full bg-[#39FF14] hover:bg-white text-black font-black py-6 rounded-2xl transition-all active:scale-95 shadow-[0_0_40px_-10px_#39FF14] flex items-center justify-center gap-3 uppercase tracking-widest text-xs group/btn"
                    >
                      {isInitializing ? <Loader2 className="animate-spin" /> : <Zap size={16} className="fill-black" />}
                      <span>{isInitializing ? "Initializing Secure Link..." : "Deploy Assessment"}</span>
                      <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 h-full flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#39FF14] bg-[#39FF14]/10 px-3 py-1 rounded border border-[#39FF14]/20">
                    DATA SEGMENT: 0{currentIndex + 1}
                  </span>
                  <div className="flex-grow h-[1px] bg-white/5"></div>
                </div>

                <div className="max-w-3xl">
                  <h3 className="text-xl md:text-2xl font-black mb-6 text-white leading-tight tracking-tight uppercase">
                    {examQuestions[currentIndex].question}
                  </h3>
                  
                  <div className="space-y-2">
                    {examQuestions[currentIndex].options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => setAnswers({...answers, [currentIndex]: i})} 
                        className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group/opt ${answers[currentIndex] === i ? "border-[#39FF14] bg-[#39FF14]/5 text-[#39FF14]" : "border-white/5 hover:bg-white/5 text-white/40"}`}
                      >
                        <span className="text-sm font-bold tracking-tight uppercase">{opt}</span>
                        <div className={`w-4 h-4 rounded border ${answers[currentIndex] === i ? "border-[#39FF14] bg-[#39FF14]" : "border-white/10"}`}>
                          {answers[currentIndex] === i && <ShieldCheck size={14} className="text-black" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center mt-4 border-t border-white/5">
                <button 
                   onClick={() => setCurrentIndex(p => p - 1)} 
                   disabled={currentIndex === 0} 
                   className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded border border-white/5 ${currentIndex === 0 ? "opacity-0" : "hover:bg-white/5"}`}
                >
                  [ Previous ]
                </button>
                <button 
                  onClick={currentIndex === examQuestions.length - 1 ? handleSubmit : () => setCurrentIndex(p => p + 1)} 
                  className="bg-[#39FF14] text-black font-black px-8 py-3.5 rounded-lg uppercase text-[11px] tracking-wider shadow-[0_0_20px_-5px_#39FF14] hover:scale-102 transition-all"
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