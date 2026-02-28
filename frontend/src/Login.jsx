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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) setError(error.message);
  };

  return (
    <div className="flex h-screen bg-[#07090e] text-white overflow-hidden font-mono">
      <div className="relative hidden lg:flex w-1/2 items-center justify-center bg-[#07090e] border-r border-white/5 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#39FF14 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
        <img src="/LeftPanel.png" alt="Visual Panel" className="relative z-10 max-h-[75%] object-contain select-none pointer-events-none opacity-90" />
        <div className="scan-line z-20"></div>
        <div className="absolute inset-0 p-10 flex flex-col justify-between pointer-events-none z-30 text-[#39FF14] text-[9px] font-bold tracking-[0.4em]">
          <div className="flex justify-between"><span>{">"} SYSTEM: ACTIVE</span><span>{">"} AUTH: READY</span></div>
          <div className="flex justify-between"><span>{">"} SCAN: ENABLED</span><span>{">"} VER: 3.2.0</span></div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#0d0f14] px-12 lg:px-20">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-4">
            <img src="/favicon.png" alt="Logo" className="w-7 h-7 object-contain" />
            <div className="h-8 w-[1px] bg-white/10 mx-1"></div>
            <div className="flex flex-col justify-center">
              <span className="text-[#39FF14] text-[13px] font-black tracking-[0.4em] leading-none uppercase">SECUREFRAME - AI</span>
              <span className="text-gray-500 text-[7px] tracking-[0.6em] leading-none uppercase mt-1.5">Advanced Proctoring</span>
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-[0.1em] text-white uppercase">WELCOME <span className="text-[#39FF14]">STUDENT</span></h1>

          <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white text-black py-4 rounded font-bold text-[10px] tracking-[0.1em] uppercase flex items-center justify-center gap-3 hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] w-full bg-white/5"></div>
            <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest whitespace-nowrap">OR USE EMAIL</span>
            <div className="h-[1px] w-full bg-white/5"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-gray-500 tracking-[0.3em] uppercase">Email ID</label>
              <input type="email" required className="w-full bg-black border border-white/10 rounded px-4 py-4 text-sm text-white focus:border-[#39FF14] outline-none transition-all" placeholder="Enter your Email ID" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-gray-500 tracking-[0.3em] uppercase">Password</label>
              <input type="password" required className="w-full bg-black border border-white/10 rounded px-4 py-4 text-sm text-white focus:border-[#39FF14] outline-none transition-all" placeholder="Enter your Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-500 text-[10px] uppercase border-l-2 border-red-500 pl-2">⚠ {error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-[#39FF14] text-black py-5 rounded font-black text-[10px] tracking-[0.3em] uppercase hover:shadow-[0_0_30px_rgba(57,255,20,0.4)] transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? "AUTHENTICATING..." : "INITIALIZE SESSION"}
            </button>
            <p className="text-[10px] text-center text-gray-600 tracking-[0.2em] uppercase">NEED ACCESS? <Link to="/signup" className="text-[#39FF14] hover:underline font-bold ml-1">CREATE ACCOUNT</Link></p>
          </form>
        </div>
      </div>
      <style>{`.scan-line { position: absolute; width: 70%; height: 1px; left: 15%; background: #39FF14; box-shadow: 0 0 15px #39FF14, 0 0 30px #39FF14; animation: scanMove 4s ease-in-out infinite; } @keyframes scanMove { 0% { top: 20%; opacity: 0; } 10%, 90% { opacity: 1; } 100% { top: 80%; opacity: 0; } }`}</style>
    </div>
  );
};

export default Login;