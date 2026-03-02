import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CheckCircle, Video, Lock, LogOut } from "lucide-react";

const Dashboard = ({ session }) => {
  const navigate = useNavigate();
  
  const fullName = session?.user?.user_metadata?.full_name || session?.user?.email || "Candidate";
  const firstName = fullName.split(' ')[0].split('@')[0];
  const formattedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white p-6 lg:p-12 font-sans">
      <nav className="max-w-6xl mx-auto mb-16 flex justify-between items-center border-b border-white/5 pb-6">
        <div className="flex items-center gap-4 group cursor-default">
          <img src="/favicon.png" alt="Logo" className="w-9 h-9 object-contain group-hover:rotate-12 transition-transform" />
          <div className="flex flex-col">
            <h2 className="text-white text-xl tracking-[0.25em] font-black leading-none">
              SECUREFRAME<span className="text-[#39FF14]">-AI</span>
            </h2>
            <span className="text-[8px] text-[#39FF14] tracking-[0.5em] uppercase font-bold mt-1">Advanced Proctoring</span>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-white/40 hover:text-red-500 hover:bg-red-500/5 transition-all text-[10px] tracking-widest uppercase font-bold px-4 py-2 rounded-lg border border-white/5"
        >
          <LogOut className="w-3 h-3" />
          Terminate Session
        </button>
      </nav>

      <header className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-[1px] w-8 bg-[#39FF14]"></div>
          <p className="text-[#39FF14] text-[10px] uppercase tracking-[0.3em] font-bold">Authenticated User</p>
        </div>
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
          Welcome, <span className="text-[#39FF14]">{formattedName}</span>
        </h1>
        <p className="text-white/40 text-sm max-w-2xl font-light leading-relaxed">
          The SecureFrame-AI environment is currently active. All biometric sensors and environmental monitors are synchronized with your profile.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#11141b] border border-white/10 p-8 rounded-3xl relative overflow-hidden group shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#39FF14]/5 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-start mb-10">
            <div className="bg-black/40 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
              <img src="/favicon.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <div className="flex items-center gap-2 bg-[#39FF14]/10 px-4 py-1.5 rounded-full border border-[#39FF14]/20">
              <div className="w-1.5 h-1.5 bg-[#39FF14] rounded-full animate-pulse"></div>
              <span className="text-[#39FF14] text-[10px] font-bold uppercase tracking-wider">Active Module</span>
            </div>
          </div>
          
          <h3 className="text-3xl font-bold mb-4 text-white tracking-tight">General Intelligence & AI Ethics</h3>
          <p className="text-white/50 text-base mb-10 leading-relaxed">
            Standardized examination regarding neural network ethics and logic processing. 
            <span className="text-[#39FF14] block mt-2 font-bold uppercase text-[10px] tracking-widest">Awaiting initialization...</span>
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase text-white/30 mb-2 font-bold tracking-widest">Time Limit</p>
              <div className="flex items-center gap-3 text-white font-bold">
                <Lock className="w-4 h-4 text-[#39FF14]"/> 60 Minutes
              </div>
            </div>
            <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
              <p className="text-[10px] uppercase text-white/30 mb-2 font-bold tracking-widest">Supervision</p>
              <div className="flex items-center gap-3 text-white font-bold">
                <Video className="w-4 h-4 text-[#39FF14]"/> AI Proctor
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/exam')} 
            className="w-full bg-[#39FF14] hover:bg-[#32e612] text-black font-black py-6 text-xl rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-lg hover:shadow-[#39FF14]/20"
          >
            <img src="/favicon.png" alt="Logo" className="w-6 h-6 brightness-0" />
            INITIALIZE EXAM
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-[#11141b] border border-white/10 p-8 rounded-3xl">
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-8 font-black border-l-2 border-[#39FF14] pl-4">
              System Health
            </h4>
            <div className="space-y-4">
              {["Facial Recognition", "Browser Lockdown", "Audio Analysis"].map((check, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-[#39FF14]/20 transition-colors">
                  <span className="text-sm font-medium text-white/70">{check}</span>
                  <CheckCircle className="w-5 h-5 text-[#39FF14]" />
                </div>
              ))}
            </div>
            
            <div className="mt-10 p-4 bg-[#39FF14]/5 rounded-xl border border-[#39FF14]/10 text-center">
              <p className="text-[9px] text-[#39FF14] font-bold uppercase tracking-widest">
                Protocol: Secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;