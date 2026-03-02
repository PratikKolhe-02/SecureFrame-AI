import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import ExamPage from './pages/ExamPage';

const SessionLoader = () => (
  <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center font-mono text-center px-4">
    <div className="w-8 h-8 border-2 border-[#39FF14]/20 border-t-[#39FF14] rounded-full animate-spin mb-4"></div>
    <p className="text-[#39FF14] text-[10px] tracking-[0.3em] uppercase animate-pulse">Initializing Secure Session...</p>
  </div>
);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <SessionLoader />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/dashboard" replace />} />
        
        <Route path="/dashboard" element={session ? <Dashboard session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/exam" element={session ? <ExamPage session={session} /> : <Navigate to="/login" replace />} />
        
        <Route path="/admin" element={<Admin />} />
        
        <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}