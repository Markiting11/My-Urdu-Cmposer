
import React from 'react';
import { ExamPaperData } from '../types';

interface A4PreviewProps {
  data: ExamPaperData;
  id?: string;
  isExportVersion?: boolean;
}

const stripOptionLabel = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/^([\(\[\{]?[\d\u0660-\u0669a-zA-Z]+[\)\]\}]?\s*[\-\.\s۔]*)/i, '')
    .replace(/\s*[\(\[\{][\d\u0660-\u0669]+[\)\]\}]\s*$/, '')
    .trim();
};

const stripQuestionPrefix = (num: string): string => {
  if (!num) return "";
  return num.replace(/^(Q|Question|Quest|Q\.|سوال|نمبر|س|السؤال)\s*\.?\s*/i, '')
            .replace(/[-.:]$/, '')
            .trim();
};

const cleanQuestionText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/^[\(\[\{]?[\d\u0660-\u0669]+[\)\]\}]?\s*[-.)۔]\s*/, '')
    .replace(/\s*[\(\[\{][\d\u0660-\u0669]+[\)\]\}]\s*$/, '')
    .trim();
};

/**
 * Enhanced Math Formatter
 * - Italicizes single letter variables (x, y, z, n, etc.)
 * - Handles superscripts (^) and subscripts (_)
 * - Standardizes spacing around operators (+, -, =, /)
 */
const FormattedMathText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  
  // Regex captures math constructs: ^{...}, _{...}, ^x, _x, and basic equations
  const mathRegex = /(\^\{[^}]+\}|_\{[^}]+\}|\^[a-zA-Z0-9]|_[a-zA-Z0-9])/g;
  const parts = text.split(mathRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('^')) {
          const exponent = part.startsWith('^{') ? part.slice(2, -1) : part.slice(1);
          return (
            <sup key={index} className="text-[0.75em] leading-none align-baseline relative -top-[0.45em] font-serif italic">
              {exponent}
            </sup>
          );
        } else if (part.startsWith('_')) {
          const subscript = part.startsWith('_{') ? part.slice(2, -1) : part.slice(1);
          return (
            <sub key={index} className="text-[0.75em] leading-none align-baseline relative top-[0.25em] font-serif italic">
              {subscript}
              {/* Fix: changed malformed sub> to </sub> */}
            </sub>
          );
        }

        // Process variables and operators in the base text
        // If it looks like math (contains variables and operators), style it
        const isMathContext = /[a-zA-Z]/.test(part) && /[\+\-\=\/\*]/.test(part);
        
        if (isMathContext) {
          const subParts = part.split(/([a-zA-Z]{1}|[\+\-\=\/\*])/g);
          return (
            <span key={index} className="font-serif">
              {subParts.map((sp, spi) => {
                const isVar = /^[a-zA-Z]$/.test(sp);
                const isOp = /^[\+\-\=\/\*]$/.test(sp);
                return (
                  <span key={spi} className={`${isVar ? 'italic' : ''} ${isOp ? 'px-1' : ''}`}>
                    {sp}
                  </span>
                );
              })}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

const Brackets: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  return (
    <span 
      className={`inline-block font-sans font-bold ${className}`} 
      style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
    >
      ({children})
    </span>
  );
};

const A4Preview: React.FC<A4PreviewProps> = ({ data, id, isExportVersion = false }) => {
  const isUrdu = data.language === 'UR';
  const isArabic = data.language === 'AR';
  const isEnglish = data.language === 'EN';
  const isRTL = isUrdu || isArabic;
  
  const direction = isRTL ? 'rtl' : 'ltr';
  
  let fontFamily = "'Times New Roman', Times, serif";
  if (isUrdu) fontFamily = "'Noto Nastaliq Urdu', serif";
  if (isArabic) fontFamily = "'Noto Naskh Arabic', serif";
  if (isEnglish) fontFamily = "'Inter', sans-serif"; // Modern look for English

  const urduLineHeight = '2.1'; 
  const arabicLineHeight = '1.8';
  const englishLineHeight = '1.6';
  
  const lineHeight = isUrdu ? urduLineHeight : isArabic ? arabicLineHeight : englishLineHeight;

  const labels = {
    subject: isUrdu ? 'مضمون' : isArabic ? 'المادة' : 'Subject',
    totalMarks: isUrdu ? 'کل نمبر' : isArabic ? 'الدرجة الكلية' : 'Total Marks',
    time: isUrdu ? 'وقت' : isArabic ? 'الوقت' : 'Time Allowed',
    rollNo: isUrdu ? 'رول نمبر' : isArabic ? 'رقم الجلوس' : 'Roll No'
  };

  const template = data.headerTemplate || 'CLASSIC';

  const renderHeader = () => {
    switch (template) {
      case 'MODERN':
        return (
          <div className={`mb-12 ${isRTL ? 'text-right' : 'text-center'} overflow-visible`}>
            <div className="flex flex-col items-center">
              <h1 className={`${isRTL ? 'text-[28pt] leading-[1.8]' : 'text-[24pt]'} font-black mb-4 overflow-visible uppercase tracking-tight text-slate-950`}>
                {data.title}
              </h1>
              <div className="w-24 h-[3pt] bg-emerald-600 mb-8 rounded-full"></div>
            </div>
            <div className={`grid grid-cols-3 gap-6 border-y-2 border-slate-100 py-5 ${isRTL ? 'text-[14pt]' : 'text-[11pt]'} font-black text-slate-800 uppercase tracking-wide`}>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-emerald-600 tracking-widest">{labels.subject}</span>
                <span className="text-black">{data.subject}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-emerald-600 tracking-widest">{labels.totalMarks}</span>
                <span className="text-black">{data.totalMarks}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-emerald-600 tracking-widest">{labels.time}</span>
                <span className="text-black">{data.timeAllowed}</span>
              </div>
            </div>
          </div>
        );

      case 'BOXED':
        return (
          <div className="mb-12 border-[2pt] border-slate-950 overflow-visible rounded-xl overflow-hidden">
            <div className="bg-slate-50 border-b-[2pt] border-slate-950 p-6 text-center">
              <h1 className={`${isRTL ? 'text-[26pt] leading-[1.6]' : 'text-[22pt]'} font-black overflow-visible text-slate-950`}>
                {data.title}
              </h1>
            </div>
            <div className={`grid grid-cols-2 divide-x-2 divide-y-2 divide-slate-950/10 ${isRTL ? 'text-[14pt]' : 'text-[11pt]'}`}>
              <div className="p-4 flex justify-between bg-white">
                <span className="font-black text-emerald-600 uppercase text-[9px] tracking-widest">{labels.subject}</span>
                <span className="font-bold">{data.subject}</span>
              </div>
              <div className="p-4 flex justify-between bg-white">
                <span className="font-black text-emerald-600 uppercase text-[9px] tracking-widest">{labels.totalMarks}</span>
                <span className="font-bold">{data.totalMarks}</span>
              </div>
              <div className="p-4 flex justify-between bg-white">
                <span className="font-black text-emerald-600 uppercase text-[9px] tracking-widest">{labels.time}</span>
                <span className="font-bold">{data.timeAllowed}</span>
              </div>
              <div className="p-4 flex justify-between bg-white">
                <span className="font-black text-emerald-600 uppercase text-[9px] tracking-widest">{labels.rollNo}</span>
                <span className="w-32 border-b-2 border-dotted border-slate-300"></span>
              </div>
            </div>
          </div>
        );

      case 'ACADEMIC':
        return (
          <div className="mb-12 flex items-start gap-10 overflow-visible">
            <div className="w-3 h-32 bg-emerald-600 rounded-full"></div>
            <div className="flex-1 overflow-visible pt-2">
              <h1 className={`${isRTL ? 'text-[32pt] leading-[1.6] text-right' : 'text-[26pt] text-left'} font-black mb-6 overflow-visible tracking-tighter text-slate-950`}>
                {data.title}
              </h1>
              <div className="flex gap-12 border-t-2 border-slate-100 pt-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">{labels.subject}</span>
                  <span className={`font-black ${isRTL ? 'text-[16pt]' : 'text-[12pt]'}`}>{data.subject}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">{labels.totalMarks}</span>
                  <span className={`font-black ${isRTL ? 'text-[16pt]' : 'text-[12pt]'}`}>{data.totalMarks}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">{labels.time}</span>
                  <span className={`font-black ${isRTL ? 'text-[16pt]' : 'text-[12pt]'}`}>{data.timeAllowed}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'CLASSIC':
      default:
        return (
          <div style={{ pageBreakInside: 'avoid', marginBottom: '50px', overflow: 'visible' }}>
            <div className={`mb-10 ${isRTL ? 'text-right' : 'text-center'} overflow-visible`}>
              <h1 className={`${isRTL ? 'text-[34pt] leading-[2.2]' : 'text-[28pt]'} font-black mb-4 overflow-visible tracking-tighter text-slate-950`}>
                {data.title}
              </h1>
              <div className="w-full h-[3pt] bg-slate-950 rounded-full"></div>
              <div className="w-full h-[1pt] bg-slate-200 mt-2 rounded-full"></div>
            </div>

            <div className={`grid grid-cols-2 gap-x-16 gap-y-8 ${isRTL ? 'text-[16pt]' : 'text-[12pt]'} overflow-visible`}>
              <div className="flex items-end overflow-visible gap-3">
                <span className="font-black whitespace-nowrap text-emerald-700 uppercase text-[10px] tracking-widest pb-1">{labels.subject}</span>
                <div className={`flex-1 border-b-2 border-slate-300 mb-1 px-4 font-black ${isRTL ? 'text-right' : 'text-left'}`}>
                  {data.subject}
                </div>
              </div>
              <div className="flex items-end overflow-visible gap-3">
                <span className="font-black whitespace-nowrap text-emerald-700 uppercase text-[10px] tracking-widest pb-1">{labels.totalMarks}</span>
                <div className={`flex-1 border-b-2 border-slate-300 mb-1 px-4 font-black text-center`}>
                  <Brackets>{data.totalMarks}</Brackets>
                </div>
              </div>
              <div className="flex items-end overflow-visible gap-3">
                <span className="font-black whitespace-nowrap text-emerald-700 uppercase text-[10px] tracking-widest pb-1">{labels.time}</span>
                <div className={`flex-1 border-b-2 border-slate-300 mb-1 px-4 font-black ${isRTL ? 'text-right' : 'text-left'}`}>
                  {data.timeAllowed}
                </div>
              </div>
              <div className="flex items-end overflow-visible gap-3">
                <span className="font-black whitespace-nowrap text-emerald-700 uppercase text-[10px] tracking-widest pb-1">{labels.rollNo}</span>
                <div className="flex-1 border-b-2 border-slate-300 mb-1">
                  &nbsp;
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      id={id}
      className={`a4-page bg-white text-slate-950 ${!isExportVersion ? 'shadow-2xl shadow-emerald-500/10 origin-top scale-[0.75] md:scale-[0.8] lg:scale-[0.9] xl:scale-100' : ''}`} 
      dir={direction}
      style={{
        width: '210mm',
        height: 'auto', 
        minHeight: '297mm',
        padding: isRTL ? '20mm 25mm 25mm 25mm' : '20mm 25mm 25mm 25mm', 
        fontFamily,
        boxSizing: 'border-box',
        backgroundColor: 'white',
        lineHeight,
        position: 'relative',
        margin: isExportVersion ? '0' : '0 auto',
        display: 'block',
        textAlign: isRTL ? 'right' : 'left',
        overflow: 'visible',
        fontSize: isRTL ? '14pt' : '11.5pt',
        textRendering: 'optimizeLegibility',
        WebkitFontSmoothing: 'antialiased'
      }}
    >
      {renderHeader()}

      <div className="space-y-12 overflow-visible pb-16">
        {data.sections.map((section, sIdx) => (
          <div key={sIdx} className="section" style={{ pageBreakInside: 'auto', overflow: 'visible' }}>
            <div style={{ pageBreakInside: 'avoid', marginBottom: '30px', width: '100%', overflow: 'visible' }}>
              <div className={`flex ${isRTL ? 'justify-start' : 'justify-center'} w-full overflow-visible`}>
                <div style={{ 
                  border: '2pt solid #0f172a', 
                  padding: isRTL ? '10px 40px' : '8px 40px', 
                  display: 'inline-block',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  overflow: 'visible'
                }}>
                  <h2 className={`${isRTL ? 'text-[18pt] leading-[1.6] text-right' : 'text-[13pt] text-center'} font-black overflow-visible uppercase tracking-[0.2em] text-slate-900`}>
                    {section.title}
                  </h2>
                </div>
              </div>
              
              {section.instructions && (
                <div className={`mt-6 flex ${isRTL ? 'justify-start' : 'justify-center'} overflow-visible`}>
                  <div className={`italic ${isRTL ? 'text-[13pt] leading-[2.1] text-right' : 'text-[11pt] text-center'} border-y-[1pt] border-slate-200 py-3 px-8 inline-block text-slate-500 font-medium overflow-visible bg-slate-50/30 rounded-lg`}>
                    <span className="font-black text-emerald-600 me-2 tracking-widest uppercase text-[10px]">
                      {isUrdu ? 'ہدایات:' : isArabic ? 'تعليمات:' : 'Instructions:'}
                    </span>
                    <FormattedMathText text={section.instructions} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-10 overflow-visible">
              {section.questions.map((q, qIdx) => (
                <div 
                  key={q.id || qIdx} 
                  className="question-row flex flex-col" 
                  style={{ pageBreakInside: 'avoid', marginBottom: '20px', overflow: 'visible' }}
                >
                  <div className={`flex justify-between items-start gap-6 w-full overflow-visible`}>
                    <div className={`font-black whitespace-nowrap ${isRTL ? 'text-[15pt] order-1' : 'text-[12pt]'} text-emerald-700 overflow-visible`}>
                      {isUrdu ? 'سوال' : isArabic ? 'س' : 'Q'}. {stripQuestionPrefix(q.number)}:
                    </div>
                    
                    <div className={`flex-1 whitespace-pre-wrap overflow-visible font-semibold ${isRTL ? `text-[15pt] text-right leading-[${lineHeight}] order-2` : 'text-[11.5pt] text-justify leading-relaxed'}`}>
                      <FormattedMathText text={cleanQuestionText(q.text)} />
                    </div>

                    {q.marks && (
                      <div className={`font-black whitespace-nowrap pt-1 ${isRTL ? 'text-[15pt] order-3' : 'text-[11.5pt]'} overflow-visible text-slate-400`}>
                        <Brackets>{q.marks}</Brackets>
                      </div>
                    )}
                  </div>
                  
                  {q.subQuestions && q.subQuestions.length > 0 && (
                    <div className={`mt-6 flex flex-wrap gap-x-12 gap-y-6 overflow-visible ${isRTL ? 'pr-20' : 'pl-20'}`}>
                      {q.subQuestions.map((sub, subIdx) => (
                        <div key={subIdx} className="flex gap-4 items-center overflow-visible" style={{ pageBreakInside: 'avoid' }}>
                          <span className={`font-black text-emerald-600 ${isRTL ? 'text-[14pt]' : 'text-[11pt]'}`}>
                            {isUrdu || isArabic ? `${subIdx + 1}- ` : `${String.fromCharCode(97 + subIdx)}) `}
                          </span>
                          <span className={`font-medium ${isRTL ? 'text-right text-[14pt] leading-[2.1]' : 'text-left text-[11pt]'}`}>
                            <FormattedMathText text={stripOptionLabel(sub)} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-24 ${isRTL ? 'text-right' : 'text-center'} pt-10 pb-12 overflow-visible`} style={{ pageBreakInside: 'avoid' }}>
        <div className={`inline-block border-y-2 border-slate-950 py-4 ${isRTL ? 'px-16' : 'px-32'} overflow-visible bg-slate-50 rounded-lg`}>
          <p className={`${isRTL ? 'text-[15pt]' : 'text-[12pt]'} font-black tracking-[0.4em] text-slate-950 uppercase overflow-visible`}>
            {isUrdu ? '*** پیپر ختم ہوا ***' : isArabic ? '*** انتهت الأسئلة ***' : '*** END OF PAPER ***'}
          </p>
        </div>
      </div>

      <div 
        className="absolute bottom-8 left-0 right-0 px-16 flex justify-between items-center opacity-40 text-[9px] font-black uppercase tracking-[0.3em] pointer-events-none overflow-visible text-slate-400" 
        style={{ direction: 'ltr' }}
      >
        <span>Anwar Ali Sehar</span>
        <span className="text-emerald-600">AI Professional Composer</span>
        <span>A4 Standard Format</span>
      </div>
    </div>
  );
};

export default A4Preview;
