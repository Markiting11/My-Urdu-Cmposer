
import React, { useRef, useState } from 'react';
import { UploadedFile } from '../types';

interface FileUploaderProps {
  onFilesSelected: (files: UploadedFile[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    const uploadPromises = validFiles.map(file => {
      return new Promise<UploadedFile>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({ file, preview: e.target?.result as string });
        };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(uploadPromises).then(onFilesSelected);
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-[2.5rem] p-16 transition-all flex flex-col items-center justify-center gap-6 ${
        isDragging ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-emerald-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
    >
      <input 
        type="file" multiple accept="image/*" className="hidden" 
        ref={fileInputRef} onChange={(e) => handleFiles(e.target.files)}
      />
      
      <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      
      <div className="text-center">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Upload Draft Images</h3>
        <p className="text-slate-500 mt-2 font-medium">Drag photos here or click to browse</p>
      </div>
      
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="mt-2 px-12 py-4 bg-slate-950 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
      >
        Select Content
      </button>
    </div>
  );
};

export default FileUploader;
