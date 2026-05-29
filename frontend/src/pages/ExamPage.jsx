import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Loader2, Activity, Cpu, AlertCircle, Zap, ChevronRight, Camera, FileText, User, XCircle } from "lucide-react";

const ExamPage = ({ session }) => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const examContainerRef = useRef(null);

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
  const [toastMessage, setToastMessage] = useState(null);

  const warningCooldownRef = useRef(false);
  const isTerminatingRef = useRef(false);
  const warningCountRef = useRef(0);
  const showWarningModalRef = useRef(false);
  const examStartedRef = useRef(false);
  const currentSessionIdRef = useRef(null);
  const mouseInsideRef = useRef(true);
  const mouseLeaveTimerRef = useRef(null);

  const fullName = session?.user?.user_metadata?.full_name || session?.user?.email || "Candidate";
  const formattedName = fullName.split(' ')[0].split('@')[0].toUpperCase();
  const userUniqueKey = session?.user?.id || "default_user";

  const examQuestions = [
    { id: 1, question: "What is the primary goal of AI Safety?", options: ["Speed", "Alignment", "Cost", "Power"] },
    { id: 2, question: "Which protocol is used for secure data transmission?", options: ["HTTP", "HTTPS", "FTP", "SMTP"] }
  ];

  const cleanUpProctoringListeners = useCallback(() => {
    isTerminatingRef.current = true;
    examStartedRef.current = false;
    setExamStarted(false);

    if (mouseLeaveTimerRef.current) {
      clearTimeout(mouseLeaveTimerRef.current);
      mouseLeaveTimerRef.current = null;
    }
  }, []);

  const addLog = useCallback(async (message, type = "info", imageSrc = null) => {
    const sessionId = currentSessionIdRef.current;
    if (!sessionId) return;

    let evidence_url = null;
    if (imageSrc && type === "warning") {
      try {
        const fileName = `v_${userUniqueKey}_${Date.now()}.jpg`;
        const blob = await (await fetch(imageSrc)).blob();
        await supabase.storage.from('violation-evidence').upload(fileName, blob);
        const { data: pData } = supabase.storage.from('violation-evidence').getPublicUrl(fileName);
        evidence_url = pData.publicUrl;
      } catch (_) {}
    }
    try {
      await supabase.from('IncidentLog').insert([{
        sessionId,
        description: message,
        type,
        evidence_url,
        timestamp: new Date().toISOString()
      }]);
    } catch (_) {}
    setActivityLog(prev => [{ id: Date.now(), description: message, type }, ...prev].slice(0, 10));
  }, [userUniqueKey]);

  const terminateExamForcefully = useCallback(async (reason) => {
    cleanUpProctoringListeners();
    setShowWarningModal(false);
    showWarningModalRef.current = false;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    const sessionId = currentSessionIdRef.current;
    if (sessionId) {
      await supabase.from('ExamSession').update({ status: 'terminated', endTime: new Date().toISOString(), riskScore: 100 }).eq('id', sessionId);
      await supabase.from('IncidentLog').insert([{ sessionId, description: `CRITICAL TERMINATION: ${reason}`, type: "danger", timestamp: new Date().toISOString() }]);
    }
    alert(`TEST TERMINATED: ${reason}`);
    navigate('/dashboard');
  }, [navigate, cleanUpProctoringListeners]);

  const triggerManualWarning = useCallback((violationType) => {
    if (isTerminatingRef.current || showWarningModalRef.current || warningCooldownRef.current || !examStartedRef.current) return;

    const nextWarnings = warningCountRef.current + 1;
    warningCountRef.current = nextWarnings;
    warningCooldownRef.current = true;
    showWarningModalRef.current = true;

    setStatus("VIOLATION");
    setWarningCount(nextWarnings);
    setRiskScore(Math.min(nextWarnings * 34, 100));
    setActiveWarning(violationType);
    setShowWarningModal(true);
    addLog(`WARNING ${nextWarnings}/3: ${violationType}`, "warning", null);

    if (nextWarnings >= 3) {
      terminateExamForcefully('Exceeded maximum limit of 3 integrity protocol violations.');
    }
  }, [addLog, terminateExamForcefully]);

  const triggerSoftWarning = useCallback((violationType) => {
    if (isTerminatingRef.current || !examStartedRef.current) return;
    setToastMessage(violationType);
    addLog(`INTERCEPT: ${violationType}`, "info", null);
    setTimeout(() => setToastMessage(null), 3000);
  }, [addLog]);

  const capture = useCallback(async () => {
    if (isTerminatingRef.current || !webcamRef.current || showWarningModalRef.current || warningCooldownRef.current || !examStartedRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const res = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc }),
      });
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.detections) && data.detections.length > 0) {
        const phoneLabels = ['cell phone', 'mobile phone', 'phone', 'smartphone', 'iphone', 'android'];
        const phoneDetection = data.detections.find(d =>
          phoneLabels.some(label => d.toLowerCase().includes(label))
        );
        const primaryViolation = phoneDetection
          ? "Mobile Device / Phone Detected"
          : data.detections[0];

        const nextWarnings = warningCountRef.current + 1;
        warningCountRef.current = nextWarnings;
        warningCooldownRef.current = true;
        showWarningModalRef.current = true;
        setStatus("VIOLATION");
        setWarningCount(nextWarnings);
        setRiskScore(Math.min(nextWarnings * 34, 100));
        setActiveWarning(primaryViolation);
        setShowWarningModal(true);
        addLog(`WARNING ${nextWarnings}/3: ${primaryViolation}`, "warning", imageSrc);
        if (nextWarnings >= 3) {
          terminateExamForcefully('Exceeded maximum limit of 3 integrity protocol violations.');
        }
      } else {
        if (warningCountRef.current === 0) setStatus("SECURE");
      }
    } catch (_) {
      setStatus("OFFLINE");
    }
  }, [addLog, terminateExamForcefully]);

  const handleCaptureFaceOnly = async () => {
    if (!webcamRef.current) return;
    setIsCapturingFace(true);
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) { setIsCapturingFace(false); return; }
    try {
      const blob = await (await fetch(screenshot)).blob();
      const fileName = `profile_${userUniqueKey}.jpg`;
      await supabase.storage.from('avatars').remove([fileName]);
      await supabase.storage.from('avatars').upload(fileName, blob, { upsert: true });
      setFaceCaptured(true);
    } catch (_) {
      alert("Snapshot tracking registration error.");
    } finally {
      setIsCapturingFace(false);
    }
  };

  const handleVerifyIdentityOnly = async () => {
    if (!webcamRef.current) return;
    setIsVerifyingId(true);
    const idScreenshot = webcamRef.current.getScreenshot();
    if (!idScreenshot) { setIsVerifyingId(false); return; }
    try {
      const res = await fetch('http://localhost:8000/verify-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_image: idScreenshot, baseline_image_url: "" }),
      });
      const data = await res.json();
      if (data.verified) {
        setIdVerified(true);
        setVerifiedDocType(data.doc_type);
      } else {
        alert(data.message || "Identity card validation structural fault.");
      }
    } catch (_) {
      setIdVerified(true);
      setVerifiedDocType("Identity Document");
    } finally {
      setIsVerifyingId(false);
    }
  };

  const startMouseLeaveTracking = useCallback(() => {
    const handleMouseLeave = () => {
      if (!examStartedRef.current || isTerminatingRef.current || showWarningModalRef.current || warningCooldownRef.current) return;
      mouseInsideRef.current = false;
      if (!mouseLeaveTimerRef.current) {
        mouseLeaveTimerRef.current = setTimeout(() => {
          triggerManualWarning("Potential Screen Off-Look / External Assistance");
          mouseLeaveTimerRef.current = null;
        }, 6000);
      }
    };
    const handleMouseEnter = () => {
      mouseInsideRef.current = true;
      if (mouseLeaveTimerRef.current) {
        clearTimeout(mouseLeaveTimerRef.current);
        mouseLeaveTimerRef.current = null;
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [triggerManualWarning]);

  const handleStartExam = async () => {
    if (!idVerified || !faceCaptured) return;
    setIsInitializing(true);
    isTerminatingRef.current = false;

    if (examContainerRef.current) {
      examContainerRef.current.requestFullscreen().catch(() => {});
    }

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

      if (error) { setIsInitializing(false); return; }

      if (data?.[0]) {
        currentSessionIdRef.current = data[0].id;
        setCurrentSessionId(data[0].id);

        examStartedRef.current = true;
        setExamStarted(true);
      }
    } catch (_) {
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!examStarted || isTerminatingRef.current) return;
    const interval = setInterval(capture, 3500);
    return () => clearInterval(interval);
  }, [examStarted, capture]);

  useEffect(() => {
    if (!examStarted) return;
    const cleanupMouse = startMouseLeaveTracking();
    return cleanupMouse;
  }, [examStarted, startMouseLeaveTracking]);

  useEffect(() => {
    if (!examStarted) return;

    const handleVisibilityChange = () => {
      if (isTerminatingRef.current || !examStartedRef.current) return;
      if (document.hidden) triggerManualWarning("Tab/Window Switch Detected");
    };

    const handleFullscreenChange = () => {
      if (isTerminatingRef.current || !examStartedRef.current) return;
      if (!document.fullscreenElement) triggerManualWarning("Fullscreen Mode Exited");
    };

    const handleContextMenu = (e) => {
      if (examStartedRef.current && !isTerminatingRef.current) {
        e.preventDefault();
        triggerSoftWarning("Right-Click Context Menu is Prohibited");
      }
    };

    const handleCopy = (e) => {
      if (!examStartedRef.current || isTerminatingRef.current) return;
      e.preventDefault();
      e.clipboardData?.clearData();
      triggerSoftWarning("Clipboard Copy Action Intercepted & Prohibited");
    };

    const handlePaste = (e) => {
      if (!examStartedRef.current || isTerminatingRef.current) return;
      e.preventDefault();
      triggerSoftWarning("Clipboard Paste Action Intercepted & Prohibited");
    };

    const handleCut = (e) => {
      if (!examStartedRef.current || isTerminatingRef.current) return;
      e.preventDefault();
      e.clipboardData?.clearData();
      triggerSoftWarning("Clipboard Cut Action Intercepted & Prohibited");
    };

    const handleKeyUp = (e) => {
      if (isTerminatingRef.current || !examStartedRef.current) return;
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText("").catch(() => {});
        triggerSoftWarning("Screen Capture Attempt Blocked");
      }
    };

    const handleKeyDown = (e) => {
      if (isTerminatingRef.current || !examStartedRef.current) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && ['c', 'v', 'x'].includes(e.key)) {
        e.preventDefault();
        triggerSoftWarning("Clipboard Shortcut Key Combination Blocked");
        return;
      }
      if (ctrl && ['u', 'p', 's', 'a'].includes(e.key)) {
        e.preventDefault();
        triggerSoftWarning("System Prohibited Operational Key Sequence Triggered");
      }
      if (e.key === 'F12' || (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(e.key))) {
        e.preventDefault();
        triggerSoftWarning("Browser Development Inspection Panel Key Bound");
      }
    };

    const handleClipboardRead = () => {
      if (!examStartedRef.current || isTerminatingRef.current) return;
      triggerSoftWarning("Background Clipboard Inspection Request Blocked");
    };

    if (navigator.clipboard && navigator.clipboard.readText) {
      const origRead = navigator.clipboard.readText.bind(navigator.clipboard);
      navigator.clipboard.readText = async (...args) => {
        handleClipboardRead();
        return origRead(...args);
      };
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCut);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keydown", handleKeyDown);

    const clipboardClearInterval = setInterval(() => {
      navigator.clipboard.writeText("").catch(() => {});
    }, 2000);

    return () => {
      clearInterval(clipboardClearInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCut);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [examStarted, triggerManualWarning, triggerSoftWarning]);

  const handleCloseWarningModal = () => {
    setShowWarningModal(false);
    showWarningModalRef.current = false;
    if (examContainerRef.current && !document.fullscreenElement) {
      examContainerRef.current.requestFullscreen().catch(() => {});
    }
    setTimeout(() => { warningCooldownRef.current = false; }, 4000);
  };

  const handleSubmit = async () => {
    cleanUpProctoringListeners();
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }
    const sessionId = currentSessionIdRef.current;
    if (sessionId) {
      await supabase.from('ExamSession').update({ status: 'completed', endTime: new Date().toISOString() }).eq('id', sessionId);
    }
    navigate('/dashboard');
  };

  return (
    <div ref={examContainerRef} className="w-full min-h-screen bg-[#07090e] text-white p-6 overflow-y-auto flex flex-col box-border relative">
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500/10 border-2 border-amber-500 rounded-xl px-6 py-3 shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center gap-3 animate-fade-in text-white backdrop-blur-md">
          <AlertCircle size={18} className="text-amber-500 animate-pulse" />
          <p className="text-xs font-black tracking-tight uppercase">{toastMessage}</p>
        </div>
      )}

      {showWarningModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="bg-[#0f0b0c] border-2 border-red-500 rounded-[2rem] w-full max-w-lg p-8 text-center relative overflow-hidden">
            <XCircle size={48} className="text-red-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-black tracking-tighter text-red-500 uppercase mb-1">INTEGRITY BREACH DETECTED</h2>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-6">
              <p className="text-lg font-black text-white uppercase tracking-tight">{activeWarning}</p>
            </div>
            <div className="flex justify-center items-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-2 w-12 rounded-full ${s <= warningCount ? "bg-red-500" : "bg-white/5"}`}></div>
              ))}
            </div>
            {warningCount < 3 && (
              <button onClick={handleCloseWarningModal} className="w-full bg-red-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest">
                Acknowledge & Resume
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="flex justify-between items-center mb-6 border border-white/10 bg-[#11141b] p-4 rounded-2xl w-full h-16 box-border shrink-0">
        <h2 className="text-sm tracking-[0.3em] font-black uppercase">SECUREFRAME<span className="text-[#39FF14]">-AI</span></h2>
        <div className={`px-4 py-1.5 rounded-lg text-[10px] font-black border ${status === 'VIOLATION' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-[#39FF14]/10 border-[#39FF14]/40 text-[#39FF14]'}`}>
          STATUS: {status}
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 w-full flex-1 items-start box-border">
        <aside className="w-full flex flex-col gap-4 box-border">
          <div className="w-full aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl shrink-0">
            <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={{ width: 640, height: 480, facingMode: "user" }} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/80 px-2 py-1 rounded text-[8px] font-bold uppercase border border-white/10">
              <Activity size={10} className="text-red-500 animate-pulse" /> LIVE ANALYSIS
            </div>
          </div>
          <div className="bg-[#11141b] border border-white/5 p-4 rounded-2xl flex items-center gap-4 w-full h-14 box-border">
            <Cpu size={18} className="text-[#39FF14] shrink-0" />
            <p className="text-xs font-bold text-white truncate">{formattedName}</p>
          </div>
          <div className="w-full bg-[#11141b] border border-white/5 rounded-2xl p-4 h-64 flex flex-col box-border">
            <p className="text-[9px] text-white/30 uppercase font-black mb-4 flex items-center gap-2 tracking-widest shrink-0">
              <AlertCircle size={12} /> Forensic Stream
            </p>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {activityLog.length === 0 && <p className="text-[10px] italic text-white/20">Waiting for telemetry...</p>}
              {activityLog.map(log => (
                <div key={log.id} className="text-[9px] border-l pl-2 py-1 border-white/10 break-words text-white/60">
                  {log.description}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="w-full bg-[#11141b] rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col justify-between box-border min-h-[460px]">
          {!examStarted ? (
            <div className="w-full text-center my-auto flex flex-col justify-center h-full max-w-2xl mx-auto px-4 box-border">
              <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter italic">System Authentication</h3>
              <p className="text-[10px] text-white/30 tracking-[0.4em] uppercase mb-8">Multi-Factor Verification Core</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8 box-border">
                <div className="bg-[#11141b]/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 relative overflow-hidden">
                  <User size={22} className="text-[#39FF14]" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">1. Portrait Capture</p>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-[9px] font-black tracking-wider ${faceCaptured ? "bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14]" : "bg-amber-500/10 border-amber-500/20 text-amber-500"}`}>
                    <span>{faceCaptured ? "VERIFIED" : "REQUIRED"}</span>
                  </div>
                </div>

                <div className="bg-[#11141b]/50 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-3 relative overflow-hidden">
                  <FileText size={22} className="text-[#39FF14]" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">2. Identity Document</p>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-[9px] font-black tracking-wider ${idVerified ? "bg-[#39FF14]/10 border-[#39FF14]/30 text-[#39FF14]" : "bg-amber-500/10 border-amber-500/20 text-amber-500"}`}>
                    <span>{idVerified ? verifiedDocType.toUpperCase() : "PENDING"}</span>
                  </div>
                </div>
              </div>

              <div className="w-full box-border">
                {!faceCaptured ? (
                  <button onClick={handleCaptureFaceOnly} disabled={isCapturingFace} className="w-full bg-[#39FF14] text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all">
                    {isCapturingFace ? <Loader2 className="animate-spin" /> : <Camera size={14} />} Step 1: Capture Profile Face Snapshot
                  </button>
                ) : !idVerified ? (
                  <button onClick={handleVerifyIdentityOnly} disabled={isVerifyingId} className="w-full bg-[#39FF14] text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all">
                    {isVerifyingId ? <Loader2 className="animate-spin" /> : <FileText size={14} />} Step 2: Scan & Validate Identity Document
                  </button>
                ) : (
                  <button onClick={handleStartExam} disabled={isInitializing} className="w-full bg-[#39FF14] text-black font-black py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all group/btn">
                    {isInitializing ? <Loader2 className="animate-spin" /> : <Zap size={14} className="fill-black" />} Deploy Target Assessment
                    <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col justify-between flex-1 box-border">
              <div className="w-full">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#39FF14] mb-3">DATA SEGMENT: 0{currentIndex + 1}</p>
                <h3 className="text-xl font-black mb-6 uppercase text-white tracking-tight border-b border-white/5 pb-4">{examQuestions[currentIndex].question}</h3>
                <div className="space-y-3 w-full">
                  {examQuestions[currentIndex].options.map((opt, i) => (
                    <button key={i} onClick={() => setAnswers({ ...answers, [currentIndex]: i })} className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center box-border group ${answers[currentIndex] === i ? "border-[#39FF14] bg-[#39FF14]/5 text-[#39FF14]" : "border-white/5 bg-white/5 text-white/60 hover:text-white"}`}>
                      <span className="text-sm font-bold uppercase tracking-tight">{opt}</span>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${answers[currentIndex] === i ? "border-[#39FF14] bg-[#39FF14]" : "border-white/20"}`}>
                        {answers[currentIndex] === i && <ShieldCheck size={12} className="text-black stroke-[3]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex justify-between items-center mt-6 border-t border-white/5 w-full box-border">
                <button onClick={() => setCurrentIndex(p => p - 1)} disabled={currentIndex === 0} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${currentIndex === 0 ? "opacity-0 cursor-default" : "text-white/40 hover:text-[#39FF14]"}`}>[ Previous ]</button>
                <button onClick={currentIndex === examQuestions.length - 1 ? handleSubmit : () => setCurrentIndex(p => p + 1)} className="bg-[#39FF14] text-black font-black px-8 py-3 rounded-lg uppercase text-[11px] tracking-wider hover:bg-emerald-400 transition-all">
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