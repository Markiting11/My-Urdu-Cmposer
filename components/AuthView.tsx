import React, { useState } from 'react';

interface AuthViewProps {
  onLogin: (status: boolean) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Simple local check
    setTimeout(() => {
      if (username === 'admin' && password === 'anwar786') {
        onLogin(true);
      } else {
        setError('Incorrect username or password. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 theme-gradient">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6 transform hover:rotate-6 transition-transform">
             <span className="text-white font-black text-3xl">A</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter">
            Admin Login
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Secure access to Paper Composer Professional Suite
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-500/5 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl animate-shake text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest ml-1">Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none font-bold transition-all"
                placeholder="Enter username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none font-bold transition-all"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Authenticating...' : 'Access Portal'}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Powered by Anwar Ali Sehar AI
        </p>
      </div>
    </div>
  );
};

export default AuthView;