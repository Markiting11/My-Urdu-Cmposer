
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import ProcessingState from './components/ProcessingState';
import EditorSection from './components/EditorSection';
import A4Preview from './components/A4Preview';
import AuthView from './components/AuthView';
import { processHandwrittenImage } from './services/geminiService';
import { AppLanguage, AppState, ExamPaperData, UploadedFile } from './types';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [appLanguage, setAppLanguage] = useState<AppLanguage>('UR'); 
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [examData, setExamData] = useState<ExamPaperData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isKeySetupVisible, setIsKeySetupVisible] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('paper_composer_session');
    if (session === 'true') {
      setIsAdmin(true);
    }
    setAuthLoading(false);

    // Initial check for API Key on load
    checkApiKeyStatus();

    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      try {
        const base64Data = hash.substring(1);
        const jsonStr = atob(base64Data);
        const data = JSON.parse(decodeURIComponent(escape(jsonStr)));
        if (data && data.sections) {
          setExamData(data);
          setAppState(AppState.EDITOR);
        }
      } catch (e) {
        console.error("Shared link parsing failed", e);
      }
    }
  }, []);

  const checkApiKeyStatus = async () => {
    // @ts-ignore
    const hasSelectedKey = await window.aistudio?.hasSelectedApiKey();
    const isEnvKeyPresent = !!process.env.API_KEY && process.env.API_KEY !== 'undefined';
    
    // Show setup if no environment key AND no session key
    if (!isEnvKeyPresent && !hasSelectedKey) {
      setIsKeySetupVisible(true);
    } else {
      setIsKeySetupVisible(false);
    }
  };

  const handleOpenKeySelection = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setIsKeySetupVisible(false);
      setError(null);
    } catch (e) {
      console.error("Key selection error:", e);
    }
  };

  const handleLogin = (status: boolean) => {
    if (status) {
      localStorage.setItem('paper_composer_session', 'true');
      setIsAdmin(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('paper_composer_session');
    setIsAdmin(false);
    reset();
  };

  const reset = () => {
    setAppState(AppState.LANDING);
    setUploadedFiles([]);
    setExamData(null);
    setError(null);
    window.location.hash = '';
  };

  const startProcessing = async (files: UploadedFile[]) => {
    // Check key again right before processing
    // @ts-ignore
    const hasSelectedKey = await window.aistudio?.hasSelectedApiKey();
    const envKey = process.env.API_KEY;

    if (!envKey && !hasSelectedKey) {
      setError("Setup Required: Please connect your API key to enable AI processing on Netlify.");
      setIsKeySetupVisible(true);
      return;
    }

    setUploadedFiles(files);
    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      const base64Images = files.map(f => f.preview);
      const result = await processHandwrittenImage(base64Images, appLanguage);
      setExamData(result);
      setAppState(AppState.EDITOR);
    } catch (err: any) {
      console.error("Processing error:", err);
      if (err.message === "API_KEY_NOT_FOUND") {
        setError("API Session expired. Please link your key again.");
        setIsKeySetupVisible(true);
      } else {
        setError("AI Analysis failed. Check image quality and try again.");
      }
      setAppState(AppState.LANDING);
    }
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 300);
  };

  const handleShare = () => {
    if (!examData) return;
    try {
      const jsonStr = JSON.stringify(examData);
      const base64Data = btoa(unescape(encodeURIComponent(jsonStr)));
      const shareUrl = `${window.location.origin}${window.location.pathname}#${base64Data}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      });
    } catch (e) {
      alert("Sharing failed. Content might be too large.");
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('pdf-export-content');
    if (!element || !examData) return;
    setIsExportingPDF(true);
    try {
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 2000));
      const opt = {
        margin: 0,
        filename: `${(examData.title || 'Exam').replace(/\s+/g, '_')}_AnwarSehar.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.section' }
      };
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white selection:bg-emerald-100">
      <Header onReset={reset} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col overflow-hidden no-print theme-gradient">
        {appState === AppState.LANDING && (
          <div className="max-w-6xl mx-auto w-full px-6 py-12 md:py-16 flex flex-col gap-12">
            
            {/* NETLIFY-READY SETUP BANNER */}
            {isKeySetupVisible && (
              <div className="bg-white border-2 border-emerald-500 rounded-[3rem] p-10 shadow-2xl shadow-emerald-500/10 border-dashed animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="flex flex-col md:flex-row items-center gap-12">
                  <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center flex-shrink-0 border border-emerald-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-2">
                      Netlify Deployment Optimizer
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">API Link Required</h2>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
                      To activate the AI Engine on this Netlify domain, you must link a Gemini API key. Use the button below to connect securely.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                      <button 
                        onClick={handleOpenKeySelection}
                        className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center gap-3"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Link API Key Now
                      </button>
                      <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-10 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-emerald-600 hover:border-emerald-100 transition-all"
                      >
                        Check Billing
                      </a>
                    </div>
                  </div>

                  <div className="hidden lg:block w-px h-40 bg-slate-100"></div>
                  
                  <div className="hidden lg:flex flex-col gap-4 max-w-[200px]">
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Dashboard Tip</div>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                      For zero-setup access, add your key to <b>Environment Variables</b> in the Netlify Dashboard settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center space-y-12">
              <div className="flex flex-col items-center gap-6">
                <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem] w-fit border border-slate-200 shadow-inner">
                  {['UR', 'AR', 'EN'].map((lang) => (
                    <button 
                      key={lang}
                      onClick={() => setAppLanguage(lang as AppLanguage)}
                      className={`px-12 py-3.5 rounded-2xl font-black transition-all ${appLanguage === lang ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {lang === 'UR' ? 'اردو' : lang === 'AR' ? 'العربية' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <h1 className={`text-6xl md:text-9xl font-black text-slate-950 tracking-tighter leading-none ${appLanguage === 'UR' ? 'font-urdu' : appLanguage === 'AR' ? 'font-arabic' : ''}`}>
                {appLanguage === 'UR' ? (
                  <>تحریر سے <span className="text-emerald-500">پیشہ ورانہ</span> کمال</>
                ) : appLanguage === 'AR' ? (
                  <>من الخط إلى <span className="text-emerald-500">الإتقان</span></>
                ) : (
                  <>Draft to <span className="text-emerald-500">Distinction.</span></>
                )}
              </h1>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-100 text-red-700 px-10 py-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-black text-lg">System Alert</h4>
                    <p className="font-bold text-sm opacity-80">{error}</p>
                  </div>
                </div>
                <button 
                  onClick={handleOpenKeySelection}
                  className="px-10 py-3.5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
                >
                  Configure Key
                </button>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-[4rem] p-6 shadow-2xl shadow-emerald-500/5">
              <FileUploader onFilesSelected={startProcessing} />
            </div>
          </div>
        )}

        {appState === AppState.PROCESSING && (
          <div className="flex-1 flex items-center justify-center">
            <ProcessingState />
          </div>
        )}

        {appState === AppState.EDITOR && examData && (
          <div className="flex-1 flex h-full overflow-hidden">
            <div className="w-[460px] flex flex-col bg-white border-r border-slate-100 shadow-[20px_0_50px_rgba(0,0,0,0.02)] z-20">
              <div className="flex-1 overflow-auto preview-scroll-container">
                <EditorSection data={examData} onChange={setExamData} />
              </div>
              <div className="p-12 bg-slate-50 border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    className="flex flex-col items-center justify-center gap-1 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black shadow-2xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="text-[10px] uppercase opacity-70 tracking-widest font-bold">HQ</span>
                    <span className="text-xs tracking-widest">PDF EXPORT</span>
                  </button>
                  <button 
                    onClick={handleShare}
                    className={`flex flex-col items-center justify-center gap-1 py-5 ${shareSuccess ? 'bg-emerald-500' : 'bg-slate-800'} text-white rounded-[1.5rem] font-black transition-all active:scale-95 shadow-2xl`}
                  >
                    <span className="text-[10px] uppercase opacity-70 tracking-widest font-bold">LINK</span>
                    <span className="text-xs tracking-widest">{shareSuccess ? 'COPIED' : 'SHARE CLOUD'}</span>
                  </button>
                </div>
                <button 
                  onClick={handlePrint}
                  className="w-full py-6 border-2 border-slate-200 text-slate-950 rounded-[2rem] font-black hover:border-emerald-500 hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-4 text-sm tracking-widest"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  INSTITUTIONAL PRINT
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-20 flex justify-center items-start bg-slate-100/50 no-print">
              <A4Preview data={examData} />
            </div>
          </div>
        )}
      </main>

      <div className="pdf-export-wrapper" style={{ visibility: 'hidden', position: 'absolute', left: '-9999px' }}>
        {examData && (
          <div id="pdf-export-content" style={{ width: '210mm' }}>
            <A4Preview data={examData} isExportVersion={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
