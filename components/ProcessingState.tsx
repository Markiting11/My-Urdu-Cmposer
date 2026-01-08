
import React, { useEffect, useState } from 'react';

const ProcessingState: React.FC = () => {
  const [dots, setDots] = useState('');
  const messages = [
    "Interpreting handwriting...",
    "Digitizing text...",
    "Structuring layouts...",
    "Polishing typography...",
    "Formatting A4 standards...",
    "Finalizing composition..."
  ];
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-sm">
      <div className="relative w-28 h-28 mb-10 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-slate-100 rounded-[2rem]"></div>
        <div className="absolute inset-0 border-4 border-emerald-500 rounded-[2rem] border-t-transparent animate-spin"></div>
        <span className="text-emerald-500 font-black text-xs uppercase tracking-tighter animate-pulse">AI</span>
      </div>
      
      <h2 className="text-2xl font-black text-slate-950 mb-3 tracking-tight">
        Processing{dots}
      </h2>
      <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">
        {messages[msgIdx]}
      </p>
      
      <div className="mt-12 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className="bg-emerald-500 h-full animate-loading-bar shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
      </div>
      
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 80%; transform: translateX(0); }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default ProcessingState;
