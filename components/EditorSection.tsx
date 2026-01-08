
import React from 'react';
import { ExamPaperData, ExamSection, ExamQuestion, HeaderTemplate } from '../types';

interface EditorSectionProps {
  data: ExamPaperData;
  onChange: (newData: ExamPaperData) => void;
}

const EditorSection: React.FC<EditorSectionProps> = ({ data, onChange }) => {
  const isUrdu = data.language === 'UR';
  const isArabic = data.language === 'AR';
  const isRTL = isUrdu || isArabic;
  const direction = isRTL ? 'rtl' : 'ltr';

  const updateField = (field: keyof ExamPaperData, value: any) => onChange({ ...data, [field]: value });

  const updateSection = (sIdx: number, updates: Partial<ExamSection>) => {
    const newSections = [...data.sections];
    newSections[sIdx] = { ...newSections[sIdx], ...updates };
    onChange({ ...data, sections: newSections });
  };

  const updateQuestion = (sIdx: number, qIdx: number, updates: Partial<ExamQuestion>) => {
    const newSections = [...data.sections];
    const newQuestions = [...newSections[sIdx].questions];
    newQuestions[qIdx] = { ...newQuestions[qIdx], ...updates };
    newSections[sIdx] = { ...newSections[sIdx], questions: newQuestions };
    onChange({ ...data, sections: newSections });
  };

  const addQuestion = (sIdx: number) => {
    const newSections = [...data.sections];
    newSections[sIdx].questions.push({
      id: Math.random().toString(36).substr(2, 9),
      number: (newSections[sIdx].questions.length + 1).toString(),
      text: isUrdu ? "نیا سوال درج کریں..." : "Enter question text...",
      marks: "5"
    });
    onChange({ ...data, sections: newSections });
  };

  const templates: { id: HeaderTemplate; label: string }[] = [
    { id: 'CLASSIC', label: 'Classic' },
    { id: 'MODERN', label: 'Modern' },
    { id: 'BOXED', label: 'Boxed' },
    { id: 'ACADEMIC', label: 'Academic' }
  ];

  return (
    <div className="h-full flex flex-col bg-white" dir={direction}>
      <div className="p-10 border-b border-slate-100">
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 tracking-tighter">
          Editor
          <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-100">Live</span>
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-10 space-y-12">
        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Header Templates</h3>
          <div className="grid grid-cols-2 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => updateField('headerTemplate', t.id)}
                className={`px-4 py-3 rounded-2xl border-2 transition-all font-bold text-sm ${
                  (data.headerTemplate || 'CLASSIC') === t.id 
                    ? 'border-emerald-600 bg-emerald-50/30 text-emerald-700 shadow-sm' 
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Institutional Info</h3>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest ml-1">Title</label>
              <input 
                type="text" value={data.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none font-bold transition-all shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest ml-1">Subject</label>
                <input 
                  type="text" value={data.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-950 uppercase tracking-widest ml-1">Marks</label>
                <input 
                  type="text" value={data.totalMarks}
                  onChange={(e) => updateField('totalMarks', e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-emerald-500 outline-none font-bold text-center shadow-sm"
                />
              </div>
            </div>
          </div>
        </section>

        <hr className="border-slate-100" />

        <section className="space-y-8 pb-10">
          {data.sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-5">
              <div className="flex items-center gap-4">
                <input 
                  type="text" value={section.title}
                  onChange={(e) => updateSection(sIdx, { title: e.target.value })}
                  className="flex-1 font-black text-xl bg-transparent border-b-2 border-slate-100 focus:border-emerald-500 outline-none py-2 transition-all"
                />
              </div>
              
              <div className="space-y-4">
                {section.questions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5 group">
                    <div className="flex gap-4">
                      <input 
                        type="text" value={q.number}
                        onChange={(e) => updateQuestion(sIdx, qIdx, { number: e.target.value })}
                        className="w-10 h-10 flex items-center justify-center text-center font-black text-emerald-600 bg-emerald-50 rounded-xl outline-none"
                      />
                      <textarea 
                        value={q.text}
                        onChange={(e) => updateQuestion(sIdx, qIdx, { text: e.target.value })}
                        className={`flex-1 text-sm font-semibold bg-transparent outline-none resize-none leading-relaxed ${isRTL ? 'font-urdu text-right' : ''}`}
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => addQuestion(sIdx)}
                  className="w-full py-5 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-black text-xs uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all active:scale-95"
                >
                  + Add Item
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default EditorSection;
