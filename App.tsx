
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import ProcessingState from './components/ProcessingState';
import EditorSection from './components/EditorSection';
import A4Preview from './components/A4Preview';
import AuthView from './components/AuthView';
import { processHandwrittenImage } from './services/geminiService';
import { exportToDocx } from './services/wordExportService';
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

    // Check for API Key presence on load
    checkApiKey();

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
        console.error("Failed to parse shared link data", e);
      }
    }
  }, []);

  const checkApiKey = async () => {
    // @ts-ignore
    const hasKey = await window.aistudio?.hasSelectedApiKey();
    // If process.env.API_KEY is not defined by Netlify, show the selection banner
    if (!process.env.API_KEY && !hasKey) {
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
      console.error("Key selection failed", e);
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
    // Ensure we have a key before starting
    // @ts-ignore
    const hasKey = await window.aistudio?.hasSelectedApiKey();
    const envKey = process.env.API_KEY;

    if (!envKey && !hasKey) {
      setError("System Configuration Required: Please select an API key to proceed.");
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
      console.error(err);
      if (err.message === "API_KEY_NOT_FOUND" || err.message?.includes("API key")) {
        setError("Your API key session is invalid or expired.");
        setIsKeySetupVisible(true);
      } else {
        setError("Composition failed. Please ensure handwriting is clear and try again.");
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
      alert("Sharing failed. Document content may be too large for a link.");
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
        filename: `${(examData.title || 'Exam').replace(/\s+/g, '_')}_AAS.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], before: '.section' }
      };
      // @ts-ignore
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
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
    <div className="min-h-screen flex flex-col font-sans selection:bg-emerald-100 bg-white">
      <Header onReset={reset} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col overflow-hidden no-print theme-gradient">
        {appState === AppState.LANDING && (
          <div className="max-w-6xl mx-auto w-full px-6 py-10 md:py-16 flex flex-col gap-10">
            
            {/* ENHANCED API KEY SETUP DASHBOARD */}
            {isKeySetupVisible && (
              <div className="bg-white border-2 border-emerald-500 rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-500/10 border-dashed animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
                  <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center flex-shrink-0 border border-emerald-100 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Configuration Required</h2>
                      <p className="text-slate-500 font-medium leading-relaxed max-w-xl mt-1">
                        To enable AI processing on Netlify, you must provide a Gemini API Key. Use the button below to link your account for this session.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={handleOpenKeySelection}
                        className="px-8 py-3.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-95 flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Select API Key Now
                      </button>
                      <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-8 py-3.5 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-emerald-600 hover:border-emerald-100 transition-all flex items-center gap-2"
                      >
                        Billing Info
                      </a>
                    </div>
                  </div>

                  <div className="hidden lg:block w-px h-32 bg-slate-100"></div>
                  
                  <div className="hidden lg:flex flex-col gap-3 max-w-[240px]">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Permanent Deployment Fix</span>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                      For a permanent solution, add <b>API_KEY</b> to your site's Environment Variables in the Netlify Dashboard.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center space-y-10">
              <div className="flex flex-col items-center gap-6">
                <div className="flex p-1 bg-slate-200/50 rounded-2xl w-fit border border-slate-200">
                  {['UR', 'AR', 'EN'].map((lang) => (
                    <button 
                      key={lang}
                      onClick={() => setAppLanguage(lang as AppLanguage)}
                      className={`px-10 py-3 rounded-xl font-black transition-all ${appLanguage === lang ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {lang === 'UR' ? 'اردو' : lang === 'AR' ? 'العربية' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <h1 className={`text-6xl md:text-8xl font-black text-slate-950 tracking-tighter leading-none ${appLanguage === 'UR' ? 'font-urdu' : appLanguage === 'AR' ? 'font-arabic' : ''}`}>
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
              <div className="bg-red-50 border-2 border-red-100 text-red-700 px-8 py-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-black text-sm">{error}</span>
                </div>
                <button 
                  onClick={handleOpenKeySelection}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
                >
                  Resolve Now
                </button>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-[3.5rem] p-5 shadow-2xl shadow-emerald-500/5">
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
            <div className="w-[440px] flex flex-col bg-white border-r border-slate-100 shadow-2xl z-20">
              <div className="flex-1 overflow-auto preview-scroll-container">
                <EditorSection data={examData} onChange={setExamData} />
              </div>
              <div className="p-10 bg-slate-50 border-t border-slate-200 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    className="flex flex-col items-center justify-center gap-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="text-[10px] opacity-70">PROFESSIONAL</span>
                    <span className="text-[11px]">PDF EXPORT</span>
                  </button>
                  <button 
                    onClick={handleShare}
                    className={`flex flex-col items-center justify-center gap-1 py-4 ${shareSuccess ? 'bg-emerald-500' : 'bg-slate-800'} text-white rounded-2xl font-black transition-all active:scale-95 shadow-xl`}
                  >
                    <span className="text-[10px] opacity-70">CLOUD</span>
                    <span className="text-[11px]">{shareSuccess ? 'LINK COPIED' : 'SHARE LINK'}</span>
                  </button>
                </div>
                <button 
                  onClick={handlePrint}
                  className="w-full py-5 border-2 border-slate-200 text-slate-950 rounded-[1.5rem] font-black hover:border-emerald-500 hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  PRINT EXAMINATION PAPER
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-16 flex justify-center items-start bg-slate-100/50 no-print">
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
