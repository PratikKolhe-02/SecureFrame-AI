import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match");
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authError) { setError(authError.message); return; }
    alert("Verification email sent!");
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-mono flex">
      <div className="hidden lg:block lg:w-[60%] relative overflow-hidden border-r border-white/5 bg-[#07090e]">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="h-[70vh] w-auto opacity-40">
            <path d="M100,20 Q140,20 160,60 T160,140 T100,180 T40,140 T40,60 T100,20" fill="none" stroke="#39FF14" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="absolute inset-0 p-12 text-[#39FF14] text-[10px] tracking-[0.3em] font-bold flex flex-col justify-between uppercase">
          <div>{">"} INIT: OPERATOR ENROLLMENT</div>
          <div className="self-end">{">"} SECURITY LEVEL: ALPHA</div>
        </div>
      </div>
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-[#0d0f14]">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 text-[#39FF14] text-xs font-bold tracking-[0.4em] uppercase">
            <div className="w-6 h-6 border border-[#39FF14] flex items-center justify-center text-[8px]">S</div>
            SECUREFRAME-AI
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter leading-none">CREATE<br/><span className="text-[#39FF14]">ACCOUNT</span></h1>
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-1">
              <label className="text-gray-500 text-[9px] font-bold tracking-widest uppercase">Institutional Email</label>
              <input type="email" onChange={(e) => setEmail(e.target.value)} required className="w-full bg-black border border-[#39FF14]/30 focus:border-[#39FF14] rounded px-4 py-4 text-sm text-white outline-none transition-all" placeholder="id@vitbhopal.ac.in" />
            </div>
            <div className="space-y-1">
              <label className="text-gray-500 text-[9px] font-bold tracking-widest uppercase">System Passcode</label>
              <input type="password" onChange={(e) => setPassword(e.target.value)} required className="w-full bg-black border border-[#39FF14]/30 focus:border-[#39FF14] rounded px-4 py-4 text-sm text-white outline-none transition-all" placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <label className="text-gray-500 text-[9px] font-bold tracking-widest uppercase">Confirm Passcode</label>
              <input type="password" onChange={(e) => setConfirm(e.target.value)} required className="w-full bg-black border border-[#39FF14]/30 focus:border-[#39FF14] rounded px-4 py-4 text-sm text-white outline-none transition-all" placeholder="••••••••" />
            </div>
            {error && <div className="text-red-500 text-[10px] uppercase border-l-2 border-red-500 pl-2">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-[#39FF14] text-black font-black py-5 rounded text-[10px] tracking-widest uppercase hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] disabled:opacity-50">
              {loading ? 'ENROLLING...' : 'INITIALIZE ENROLLMENT'}
            </button>
          </form>
          <p className="text-center text-[10px] text-gray-600 tracking-widest uppercase">Already registered? <Link to="/login" className="text-[#39FF14] hover:underline">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}