import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    if (data?.user) navigate("/");
  };

  return (
    <div className="flex h-screen bg-[#07090e] text-white overflow-hidden font-mono">

      {/* ================= LEFT PANEL (3D Face & Scan) ================= */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center bg-[#07090e] border-r border-white/5 overflow-hidden">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#39FF14 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}>
        </div>

        <img
          src="/LeftPanel.png"
          alt="Biometric Mesh"
          className="relative z-10 max-h-[75%] object-contain select-none pointer-events-none opacity-90"
        />

        <div className="scan-line z-20"></div>

        {/* HUD Data Overlays */}
        <div className="absolute inset-0 p-10 flex flex-col justify-between pointer-events-none z-30">
          <div className="flex justify-between text-[#39FF14] text-[9px] font-bold tracking-[0.4em]">
            <span>{">"} SYSTEM: SCANNING_USER</span>
            <span>{">"} STATUS: SECURE</span>
          </div>
          <div className="flex justify-between text-[#39FF14] text-[9px] font-bold tracking-[0.4em]">
            <span>{">"} NODES: 1,024 ACTIVE</span>
            <span>{">"} CONFIDENCE: 98.4%</span>
          </div>
        </div>
      </div>

      {/* ================= RIGHT PANEL (Form & Branding) ================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#0d0f14] px-12 lg:px-20">
        <div className="w-full max-w-md space-y-10">
          
          {/* BRANDING SECTION (Updated with favicon) */}
          <div className="flex items-center gap-3 text-[#39FF14] text-[10px] font-bold tracking-[0.4em] uppercase">
            <img src="/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
            <span className="opacity-80">SECUREFRAME-AI</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter leading-none">
              WELCOME,<br/><span className="text-[#39FF14]">STUDENT</span>
            </h1>
            <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em]">
              // PROCTORING SYSTEM INITIALIZATION REQUIRED
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-gray-500 tracking-widest uppercase">Institutional Email</label>
              <input
                type="email"
                required
                className="w-full bg-black border border-[#39FF14]/20 rounded px-4 py-4 text-sm focus:border-[#39FF14] focus:shadow-[0_0_10px_rgba(57,255,20,0.1)] transition-all outline-none"
                placeholder="student@vitbhopal.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-gray-500 tracking-widest uppercase">Security Passcode</label>
              <input
                type="password"
                required
                className="w-full bg-black border border-[#39FF14]/20 rounded px-4 py-4 text-sm focus:border-[#39FF14] transition-all outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-[10px] font-bold uppercase border-l-2 border-red-500 pl-2">⚠ {error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#39FF14] text-black py-5 rounded font-black text-[10px] tracking-[0.3em] uppercase hover:shadow-[0_0_25px_#39FF14] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "INITIALIZING..." : "INITIALIZE SESSION"}
            </button>

            <p className="text-[10px] text-center text-gray-600 tracking-[0.2em] uppercase">
              NOT REGISTERED?{" "}
              <Link to="/signup" className="text-[#39FF14] hover:underline font-bold">
                ENROLL NOW
              </Link>
            </p>
          </form>
        </div>
      </div>

      <style>{`
        .scan-line {
          position: absolute;
          width: 70%;
          height: 1px;
          left: 15%;
          background: #39FF14;
          box-shadow: 0 0 15px #39FF14, 0 0 30px #39FF14;
          animation: scanMove 4s ease-in-out infinite;
        }
        @keyframes scanMove {
          0% { top: 20%; opacity: 0; }
          10%, 90% { opacity: 1; }
          100% { top: 80%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Login;