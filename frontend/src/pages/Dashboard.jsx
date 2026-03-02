import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, ShieldCheck, Zap, Loader2, Globe, Lock, Cpu, Clock, ChevronRight, Activity } from "lucide-react";

const Dashboard = ({ session }) => {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(false);
  
  const fullName = session?.user?.user_metadata?.full_name || session?.user?.email || "Candidate";
  const firstName = fullName.split(' ')[0].split('@')[0];
  const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const initializeSession = async () => {
    setIsInitializing(true);
    try {
      const { data, error } = await supabase
        .from('ExamSession')
        .insert([{ 
          userId: session.user.id, 
          userName: fullName,
          userEmail: session.user.email,
          startTime: new Date().toISOString(),
          riskScore: 0,
          status: 'ongoing'
        }])
        .select();

      if (error) throw error;
      if (data?.[0]) {
        localStorage.setItem('currentSessionId', data[0].id);
        navigate('/exam');
      }
    } catch (err) {
      alert(`System Error: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 font-sans p-6 lg:p-10 selection:bg-[#39FF14]/30">
      {/* Navbar - Standard Size */}
      <nav className="max-w-6xl mx-auto mb-12 flex justify-between items-center bg-[#11141b]/60 border border-white/10 p-5 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="relative">
            {/* Green Glow on Nav Logo */}
            <div className="absolute inset-0 bg-[#39FF14]/40 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <img src="/favicon.png" alt="SF" className="w-8 h-8 object-contain relative z-10 transition-transform group-hover:scale-110" />
          </div>
          <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
          <h2 className="text-sm tracking-[0.25em] font-black uppercase text-white">
            SECUREFRAME<span className="text-[#39FF14]">AI</span>
          </h2>
        </div>
        
        <button 
          onClick={handleLogout}
          className="group flex items-center gap-2 text-white/40 hover:text-red-500 transition-all text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-xl border border-white/5 hover:bg-red-500/5"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </nav>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Welcome Hero */}
        <div className="lg:col-span-8 bg-[#11141b] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Activity size={14} className="text-[#39FF14] animate-pulse" />
              <span className="text-[#39FF14] text-[9px] font-black uppercase tracking-[0.3em]">Neural Link: Active</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white mb-6 tracking-tighter">
              Welcome, <br/>
              <span className="text-[#39FF14]">{formattedName}</span>
            </h1>
            <p className="text-white/40 text-lg max-w-xl font-light leading-relaxed">
              Biometric verification successful. Your terminal is synchronized with the <span className="text-white font-medium text-base">Oversight Core v3.0</span>.
            </p>
          </div>
        </div>

        {/* Stats Column */}
        <div className="lg:col-span-4 grid grid-cols-1 gap-6">
          <div className="bg-[#11141b] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between hover:border-[#39FF14]/20 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-[#39FF14]/30 transition-colors">
                <Globe size={20} className="text-[#39FF14]" />
              </div>
              <span className="text-[10px] text-white/20 font-mono tracking-widest">PING: 24MS</span>
            </div>
            <div className="mt-4">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black mb-1">Network</p>
              <h4 className="text-xl font-bold text-white uppercase italic">Encrypted</h4>
            </div>
          </div>

          <div className="bg-[#11141b] border border-white/5 rounded-[2rem] p-8 flex flex-col justify-between hover:border-[#39FF14]/20 transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-[#39FF14]/30 transition-colors">
                <Lock size={20} className="text-[#39FF14]" />
              </div>
              <span className="text-[10px] text-white/20 font-mono tracking-widest">LEVEL: 05</span>
            </div>
            <div className="mt-4">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black mb-1">AI Shield</p>
              <h4 className="text-xl font-bold text-white uppercase italic">Active</h4>
            </div>
          </div>
        </div>

        {/* Assessment Module - Balanced Size & Logo Glow */}
        <div className="lg:col-span-12 bg-white/5 border border-white/10 rounded-[3rem] p-[1px] group">
          <div className="bg-[#07090e] rounded-[2.9rem] p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-10 hover:bg-[#0c0e14] transition-colors">
            
            <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
              <div className="relative group/logo cursor-pointer">
                {/* Green Glow on Assessment Logo */}
                <div className="absolute inset-0 bg-[#39FF14]/30 blur-3xl rounded-full scale-150 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-700"></div>
                <img 
                  src="/favicon.png" 
                  alt="Assessment Logo" 
                  className="w-24 h-24 object-contain relative z-10 transition-transform group-hover/logo:scale-110 duration-500" 
                />
              </div>

              <div className="h-16 w-[1px] bg-white/10 hidden md:block"></div>

              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                  Intelligence <span className="text-[#39FF14]">Assessment</span>
                </h3>
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4 opacity-60">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#39FF14]" />
                    <span className="text-[11px] text-white uppercase font-black tracking-widest">60 Minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#39FF14]" />
                    <span className="text-[11px] text-white uppercase font-black tracking-widest">Proctored</span>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={initializeSession} 
              disabled={isInitializing}
              className="w-full md:w-auto bg-[#39FF14] hover:bg-white text-black font-black px-12 py-7 rounded-[2rem] transition-all active:scale-95 shadow-[0_0_50px_-10px_#39FF14] flex items-center justify-center gap-4 uppercase tracking-[0.2em] text-xs"
            >
              {isInitializing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Zap size={20} className="fill-black" />
              )}
              {isInitializing ? "Processing..." : "Initiate Link"}
              <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      <footer className="mt-20 py-10 text-center opacity-20">
        <p className="text-[10px] text-white uppercase tracking-[1em] font-medium">
          SecureFrame-AI System Terminal // Auth_Verified
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;