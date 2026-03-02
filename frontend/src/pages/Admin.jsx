import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Download, User, Trash2, Mail, ShieldCheck, Search, FileText, Camera } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Admin = () => {
  const [sessions, setSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('ExamSession')
      .select(`*, IncidentLog!sessionId(*)`)
      .order('startTime', { ascending: false });
    if (!error) setSessions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const deleteSession = async (id) => {
    if (window.confirm("Confirm permanent deletion of this record?")) {
      const { error } = await supabase.from('ExamSession').delete().eq('id', id);
      if (!error) fetchLogs();
    }
  };

  const getTier = (score) => {
    if (score <= 20) return { color: '#22c55e', label: 'Verified Safe', rgb: [34, 197, 94], bg: 'bg-green-500/10' };
    if (score <= 50) return { color: '#f59e0b', label: 'Review Required', rgb: [245, 158, 11], bg: 'bg-amber-500/10' };
    if (score <= 75) return { color: '#ef4444', label: 'High Risk', rgb: [239, 68, 68], bg: 'bg-red-500/10' };
    return { color: '#7f1d1d', label: 'Critical Violation', rgb: [127, 29, 29], bg: 'bg-red-900/20' };
  };

  const downloadReport = async (s) => {
    try {
      const doc = new jsPDF();
      const tier = getTier(s.riskScore);
      
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("INTEGRITY AUDIT REPORT", 14, 22);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 180);
      
      // FIX: Convert ID to String before calling toUpperCase
      const displayId = String(s.id || 'N/A').toUpperCase();
      doc.text(`SESSION ID: ${displayId}`, 14, 32);
      doc.text(`ISSUED: ${new Date().toLocaleString()}`, 14, 37);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("CANDIDATE PROFILE", 14, 55);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(14, 57, 45, 57);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Name:  ${s.userName || 'N/A'}`, 14, 66);
      doc.text(`Email: ${s.userEmail || 'N/A'}`, 14, 73);

      doc.setFillColor(...tier.rgb);
      doc.roundedRect(140, 50, 56, 30, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("RISK INDEX", 145, 59);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(`${s.riskScore}%`, 145, 72);
      doc.setFontSize(8);
      doc.text(tier.label.toUpperCase(), 145, 77);

      const tableData = (s.IncidentLog || []).map(l => [
        new Date(l.timestamp).toLocaleTimeString(),
        String(l.description || '').toUpperCase(),
        l.type || 'AI_SCAN'
      ]);

      autoTable(doc, {
        startY: 90,
        head: [['TIME', 'VIOLATION DESCRIPTION', 'LOG TYPE']],
        body: tableData.length > 0 ? tableData : [['--', 'NO VIOLATIONS DETECTED', '--']],
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 4 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      let currentY = doc.lastAutoTable.finalY + 15;
      const images = (s.IncidentLog || []).filter(l => l.evidence_url);
      
      if (images.length > 0) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("VISUAL EVIDENCE LOG", 14, currentY);
        currentY += 10;

        for (const log of images) {
          if (currentY > 240) { doc.addPage(); currentY = 20; }
          
          await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = log.evidence_url;
            img.onload = () => {
              try {
                doc.setDrawColor(230, 230, 230);
                doc.rect(14, currentY, 52, 39); 
                doc.addImage(img, 'JPEG', 15, currentY + 1, 50, 37);
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                doc.text(`Event: ${log.description}`, 70, currentY + 15);
                doc.text(`Time: ${new Date(log.timestamp).toLocaleTimeString()}`, 70, currentY + 22);
                currentY += 45;
              } catch (e) { console.warn(e); }
              resolve();
            };
            img.onerror = () => resolve();
          });
        }
      }

      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Generated by Integrity Oversight System. Confidential.", 105, 285, { align: "center" });
      
      // Safety check for filename
      const fileName = (s.userName || 'Report').replace(/\s+/g, '_');
      doc.save(`Audit_Report_${fileName}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF. Check console for details.");
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center text-emerald-500 font-mono">SYNCHRONIZING_AUDIT_LOGS...</div>;

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-200 font-sans p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="text-emerald-400" size={22} />
              Integrity Oversight Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">Audit logs for {sessions.length} candidates</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-emerald-500 w-80 transition-all text-white"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredSessions.map((s) => {
            const t = getTier(s.riskScore);
            return (
              <div key={s.id} className="bg-[#11141b] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all flex flex-col md:flex-row gap-6 items-center group">
                <div className="flex items-center gap-4 flex-1 min-w-[260px]">
                  <div className={`p-3 rounded-lg ${t.bg}`}>
                    <User size={20} style={{ color: t.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{s.userName}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Mail size={12} /> {s.userEmail}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-1 overflow-x-auto no-scrollbar">
                  {s.IncidentLog?.filter(l => l.evidence_url).slice(0, 5).map((log, i) => (
                    <div key={i} className="relative group/img">
                      <img 
                        src={log.evidence_url} 
                        className="w-10 h-10 object-cover rounded-md border border-white/5 hover:border-emerald-500 transition-all cursor-pointer flex-shrink-0"
                        onClick={() => window.open(log.evidence_url, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-md pointer-events-none">
                        <Camera size={10} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-8 px-6 border-l border-white/5">
                  <div className="text-center min-w-[60px]">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Risk</p>
                    <p className="text-lg font-bold" style={{ color: t.color }}>{s.riskScore}%</p>
                  </div>
                  <div className="w-32 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border" style={{ borderColor: `${t.color}33`, color: t.color }}>
                      {t.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-l border-white/5 pl-4">
                  <button onClick={() => downloadReport(s)} className="p-2.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-emerald-400 transition-all">
                    <Download size={18} />
                  </button>
                  <button onClick={() => deleteSession(s.id)} className="p-2.5 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-all">
                    <Trash2 size={18} />
                  </button>
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