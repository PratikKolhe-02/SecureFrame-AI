import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Index from './Index';
import Login from './Login';
import Signup from './Signup';

const SessionLoader = () => (
  <div className="min-h-screen bg-[#07090e] flex flex-col items-center justify-center font-mono">
    <div className="w-8 h-8 border-2 border-[#39FF14]/20 border-t-[#39FF14] rounded-full animate-spin mb-4"></div>
    <p className="text-[#39FF14] text-[10px] tracking-[0.3em] uppercase animate-pulse">Initializing System...</p>
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
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Index userId={session.user.id} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}