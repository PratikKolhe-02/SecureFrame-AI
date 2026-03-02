import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Download, User, Trash2, Search, ShieldAlert, Calendar, Clock, Fingerprint } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Admin = () => {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data: sData } = await supabase.from('ExamSession').select('*').order('startTime', { ascending: false });
      const { data: lData } = await supabase.from('IncidentLog').select('*');

      const combined = sData.map(session => {
        const sessionLogs = lData.filter(log => log.sessionId === session.id);
        
        // FORCE CALCULATION: If DB says 0 but logs exist, calculate:
        // 20% risk for every 1 violation found.
        const manualScore = sessionLogs.length > 0 
          ? Math.min(sessionLogs.length * 20, 100) 
          : (session.riskScore || 0);

        return { 
          ...session, 
          riskScore: manualScore, 
          IncidentLog: sessionLogs 
        };
      });

      setSessions(combined);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, []);

  const getRiskData = (score) => {
    const s = score || 0;
    if (s <= 20) return { color: '#39FF14', label: 'SECURE STANCE', bg: 'bg-[#39FF14]/10' };
    if (s <= 40) return { color: '#fbbf24', label: 'MILD ANOMALY', bg: 'bg-amber-400/10' };
    if (s <= 70) return { color: '#ea580c', label: 'SUSPICIOUS ACT', bg: 'bg-orange-600/10' };
    return { color: '#ff4444', label: 'TERMINAL BREACH', bg: 'bg-red-500/10' };
  };

  const downloadReport = async (s) => {
    const doc = new jsPDF();
    const risk = getRiskData(s.riskScore);
    doc.setFillColor(7, 9, 14); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(57, 255, 20); doc.setFontSize(22); doc.text("FORENSIC AUDIT REPORT", 15, 25);
    
    autoTable(doc, {
      startY: 45,
      body: [
        ['CANDIDATE', s.userName?.toUpperCase()],
        ['EMAIL', s.userEmail],
        ['SESSION ID', String(s.id)],
        ['RISK LEVEL', `${s.riskScore}% (${risk.label})`]
      ],
      theme: 'plain'
    });

    // Embed Images into PDF
    const evidence = s.IncidentLog?.filter(l => l.evidence_url) || [];
    if (evidence.length > 0) {
      let yPos = doc.lastAutoTable.finalY + 15;
      doc.text("FORENSIC EVIDENCE", 15, yPos);
      let xPos = 15; yPos += 5;
      for (const img of evidence) {
        if (xPos > 160) { xPos = 15; yPos += 45; }
        try { doc.addImage(img.evidence_url, 'JPEG', xPos, yPos, 40, 30); xPos += 45; } catch (e) {}
      }
    }
    doc.save(`Audit_${s.userName}.pdf`);
  };

  if (loading) return <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-[#39FF14] font-mono">RECALCULATING_RISK_MODELS...</div>;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-300 p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Logo */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 border-b border-white/5 pb-8 gap-6">
          <div className="flex items-center gap-4">
            <img src="/favicon.png" alt="Logo" className="w-12 h-12 object-contain" />
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
              Risk <span className="text-[#39FF14]">Terminal</span>
            </h1>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input type="text" placeholder="FILTER_IDENTITY..." className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-xs focus:outline-none focus:border-[#39FF14] w-full md:w-80 text-white font-mono" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          {sessions.filter(s => s.userName?.toLowerCase().includes(searchTerm.toLowerCase())).map((s) => {
            const risk = getRiskData(s.riskScore);
            return (
              <div key={s.id} className="bg-[#11141b] border border-white/5 rounded-2xl p-6 flex flex-wrap lg:flex-nowrap items-center gap-6 group hover:bg-[#151922] transition-all relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: risk.color }}></div>
                
                {/* 1. Details */}
                <div className="w-full lg:w-1/4">
                  <h3 className="text-xl font-black text-white truncate uppercase tracking-tight leading-none">{s.userName}</h3>
                  <p className="text-[11px] text-white/30 truncate mt-1">{s.userEmail}</p>
                  <p className="text-[9px] font-mono text-[#39FF14]/40 mt-1">ID: {String(s.id).slice(0, 14)}</p>
                </div>

                {/* 2. Logistics */}
                <div className="w-1/2 lg:w-auto border-l border-white/5 pl-6 flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-[10px] font-mono text-white/40"><Calendar size={13} className="text-[#39FF14]"/> {new Date(s.startTime).toLocaleDateString()}</span>
                  <span className="flex items-center gap-2 text-[10px] font-mono text-white/40"><Clock size={13} className="text-[#39FF14]"/> {new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>

                {/* 3. Forensic Evidence (The Images) */}
                <div className="flex-1 flex gap-3 overflow-x-auto no-scrollbar justify-center px-4 border-l border-white/5">
                  {s.IncidentLog?.length > 0 ? (
                    s.IncidentLog.filter(l => l.evidence_url).map((log, i) => (
                      <div key={i} className="relative shrink-0">
                        <img src={log.evidence_url} className="w-14 h-14 object-cover rounded-xl border border-white/10" onClick={() => window.open(log.evidence_url, '_blank')} />
                        <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5 shadow-lg"><ShieldAlert size={10} className="text-white" /></div>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] font-mono opacity-10 uppercase tracking-widest">No_Incidents</span>
                  )}
                </div>

                {/* 4. Score & Actions */}
                <div className="w-full lg:w-1/4 border-l border-white/5 pl-8 flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-white/20 uppercase mb-1">Risk Index</p>
                    <p className="text-4xl font-black italic" style={{ color: risk.color }}>{s.riskScore}%</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => downloadReport(s)} className="p-3 bg-white/5 hover:bg-[#39FF14]/10 rounded-xl text-[#39FF14] transition-all border border-white/10"><Download size={20} /></button>
                    <button onClick={() => { if(confirm("PURGE SESSION?")) supabase.from('ExamSession').delete().eq('id', s.id).then(fetchLogs) }} className="p-3 hover:bg-red-500/10 rounded-xl text-red-500 transition-all border border-transparent hover:border-red-500/20"><Trash2 size={20} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Admin;