
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

    // Initial check for API Key
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
    if (!process.env.API_KEY && !hasKey) {
      setIsKeySetupVisible(true);
    } else {
      setIsKeySetupVisible(false);
    }
  };

  const handleOpenKeySelection = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setIsKeySetupVisible(false);
    setError(null);
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
    // @ts-ignore
    const hasKey = await window.aistudio?.hasSelectedApiKey();
    if (!process.env.API_KEY && !hasKey) {
      setError("API Key Required. Please complete the setup above.");
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
      if (err.message === "API_KEY_NOT_FOUND") {
        setError("Your API key session expired or is invalid. Please select it again.");
        setIsKeySetupVisible(true);
      } else {
        setError("Composition failed. Ensure handwriting is legible.");
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
      alert("Sharing failed. The document might be too large.");
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
          <div className="max-w-6xl mx-auto w-full px-6 py-12 md:py-20 flex flex-col gap-10">
            
            {/* API KEY SETUP BANNER */}
            {isKeySetupVisible && (
              <div className="bg-white border-2 border-emerald-500 rounded-[2rem] p-8 shadow-2xl shadow-emerald-500/10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-xl font-black text-slate-900 mb-2">Netlify Setup: API Key Required</h2>
                    <p className="text-sm text-slate-500 font-medium mb-4">
                      To activate AI features on your deployed site, you can either select a key for this session or set it permanently in your Netlify dashboard.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <button 
                        onClick={handleOpenKeySelection}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg"
                      >
                        Select Key for Session
                      </button>
                      <a 
                        href="https://ai.google.dev/gemini-api/docs/billing" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-6 py-2.5 border-2 border-slate-100 text-slate-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:text-emerald-600 transition-all"
                      >
                        Billing Docs
                      </a>
                    </div>
                  </div>
                  <div className="hidden lg:block w-px h-24 bg-slate-100"></div>
                  <div className="hidden lg:flex flex-col gap-2 max-w-xs">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Admin Tip: Permanent Fix</span>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                      Go to Netlify Dashboard > Site Settings > Environment Variables. Add <b>API_KEY</b> as the key and your Gemini Key as the value.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center space-y-8">
              <div className="flex flex-col items-center gap-6">
                <div className="flex p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200">
                  {['UR', 'AR', 'EN'].map((lang) => (
                    <button 
                      key={lang}
                      onClick={() => setAppLanguage(lang as AppLanguage)}
                      className={`px-8 py-2.5 rounded-xl font-bold transition-all ${appLanguage === lang ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="font-bold">{error}</span>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-[3rem] p-4 shadow-2xl shadow-emerald-500/5">
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
            <div className="w-[420px] flex flex-col bg-white border-r border-slate-100 shadow-xl z-20">
              <div className="flex-1 overflow-auto preview-scroll-container">
                <EditorSection data={examData} onChange={setExamData} />
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    className="flex flex-col items-center justify-center gap-1 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="text-[10px] uppercase">{isExportingPDF ? '...' : 'PDF EXPORT'}</span>
                  </button>
                  <button 
                    onClick={handleShare}
                    className={`flex flex-col items-center justify-center gap-1 py-3 ${shareSuccess ? 'bg-emerald-500' : 'bg-slate-700'} text-white rounded-xl font-black transition-all active:scale-95`}
                  >
                    <span className="text-[10px] uppercase">{shareSuccess ? 'LINK COPIED' : 'SHARE LINK'}</span>
                  </button>
                </div>
                <button 
                  onClick={handlePrint}
                  className="w-full py-4 border-2 border-slate-200 text-slate-900 rounded-2xl font-black hover:border-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  PRINT PAPER
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-12 flex justify-center items-start bg-slate-100/50 no-print">
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
