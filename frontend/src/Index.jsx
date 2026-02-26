import React, { useRef } from 'react';
import Webcam from 'react-webcam';

const Index = () => {
  const webcamRef = useRef(null);

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-mono p-8">
      <header className="flex justify-between items-center mb-8 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          <h1 className="text-2xl font-bold text-[#39FF14]">SecureFrame-AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></span>
          <span className="text-xs uppercase tracking-widest text-[#39FF14]">Proctoring Active</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto relative border-2 border-[#1e293b] rounded-xl overflow-hidden bg-black shadow-2xl">
        <Webcam 
          ref={webcamRef} 
          audio={false} 
          screenshotFormat="image/jpeg" 
          className="w-full h-auto" 
        />
        <div className="scan-line"></div>
      </main>
    </div>
  );
};

export default Index;