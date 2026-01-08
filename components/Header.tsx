import React from 'react';

interface HeaderProps {
  onReset: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onReset, onLogout }) => {
  return (
    <header className="no-print bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-4 cursor-pointer group" 
          onClick={onReset}
        >
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
             <span className="text-white font-black text-xl">A</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter text-slate-950 leading-none">
              ANWAR ALI SEHAR
            </span>
            <span className="text-[10px] font-extrabold tracking-[0.3em] text-emerald-600 uppercase mt-1">
              AI PAPER COMPOSER
            </span>
          </div>
        </div>
        
        <nav className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session Type</span>
            <span className="text-[10px] font-bold text-slate-900 leading-none">ADMIN ACCESS</span>
          </div>
          <button 
            onClick={onReset}
            className="text-[11px] font-black bg-slate-950 text-white px-6 md:px-8 py-3 rounded-full hover:bg-emerald-600 transition-all tracking-widest uppercase shadow-xl active:scale-95"
          >
            New Project
          </button>
          <button 
            onClick={onLogout}
            className="p-3 text-slate-400 hover:text-red-500 transition-colors"
            title="Logout Session"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;