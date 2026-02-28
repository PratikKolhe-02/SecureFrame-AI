import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const Admin = () => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('ExamSession')
        .select(`*, IncidentLog(*)`)
        .order('startTime', { ascending: false });
      setSessions(data || []);
    };
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-white p-10 font-mono">
      <h1 className="text-3xl font-bold text-[#39FF14] mb-8 border-b border-white/10 pb-4">ADMIN OVERSIGHT</h1>
      
      <div className="grid gap-6">
        {sessions.map((session) => (
          <div key={session.id} className="border border-white/10 bg-white/5 p-6 rounded-xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#39FF14] text-xs">SESSION_ID: {session.id}</p>
                <p className="text-gray-400 text-[10px]">STARTED: {new Date(session.startTime).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-[10px] ${session.riskScore > 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                  RISK SCORE: {session.riskScore}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {session.IncidentLog?.map((log, i) => (
                <div key={i} className="bg-black/40 border border-white/5 p-3 rounded-lg">
                  <p className="text-red-500 text-[10px] font-bold mb-2 uppercase">{log.description}</p>
                  {log.evidence_url ? (
                    <img 
                      src={log.evidence_url} 
                      alt="Violation Evidence" 
                      className="w-full h-32 object-cover rounded border border-white/10 hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(log.evidence_url, '_blank')}
                    />
                  ) : (
                    <div className="h-32 bg-white/5 flex items-center justify-center text-[10px] text-gray-600">No Image Data</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;