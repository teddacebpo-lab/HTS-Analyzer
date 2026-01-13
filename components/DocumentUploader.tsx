
import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, FileUp } from 'lucide-react';
import { DocumentContext } from '../types';
import Tooltip from './Tooltip';

interface DocumentUploaderProps {
  onContextSet: (ctx: DocumentContext | null) => void;
  currentContext: DocumentContext | null;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onContextSet, currentContext }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      onContextSet({ type: 'file', content: base64String, mimeType: 'application/pdf', name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    onContextSet({ type: 'text', content: textInput, name: 'Pasted Text Content' });
  };

  if (currentContext) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/20 dark:border-orange-500/20 rounded-3xl p-8 flex items-center justify-between shadow-xl animate-fade-in transition-all hover:border-blue-500 dark:hover:border-orange-500">
        <div className="flex items-center gap-6">
          <div className="bg-blue-100 dark:bg-orange-900/50 p-4 rounded-[20px] shrink-0 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-900 dark:text-white leading-none mb-1">Knowledge Base Active</h3>
            <p className="text-sm font-bold text-slate-400">Source: <span className="text-blue-600 dark:text-orange-400 font-mono">{currentContext.name}</span></p>
          </div>
        </div>
        <Tooltip content="Remove Reference Document">
          <button onClick={() => onContextSet(null)} className="p-3 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-all text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 shadow-sm active:scale-90">
            <X className="w-6 h-6" />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
      <div className="flex p-2 gap-2 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
        <button 
          className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all ${activeTab === 'upload' ? 'bg-white dark:bg-orange-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-orange-950/20 hover:text-blue-600 dark:hover:text-orange-400'}`} 
          onClick={() => setActiveTab('upload')}
        >
          <FileUp className="w-4 h-4" /> Upload HTS PDF
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all ${activeTab === 'paste' ? 'bg-white dark:bg-orange-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-orange-950/20 hover:text-blue-600 dark:hover:text-orange-400'}`} 
          onClick={() => setActiveTab('paste')}
        >
          <FileText className="w-4 h-4" /> Paste Text List
        </button>
      </div>

      <div className="p-10">
        {activeTab === 'upload' ? (
          <div 
            onClick={() => fileInputRef.current?.click()} 
            className="group border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-orange-500 rounded-3xl p-16 transition-all cursor-pointer bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50/50 dark:hover:bg-orange-950/10"
          >
            <div className="bg-white dark:bg-slate-800 group-hover:scale-110 shadow-lg w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 transition-all duration-300 border border-slate-100 dark:border-slate-700">
              <Upload className="w-10 h-10 text-blue-500 dark:text-orange-500" />
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Select Reference Document</h4>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">PDF documents containing HTS lists (Max 10MB)</p>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="application/pdf" className="hidden" />
          </div>
        ) : (
          <div className="space-y-6 group">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste official HTS list here for analysis..."
              className="w-full h-64 p-6 border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-3xl focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-orange-500/5 outline-none text-sm font-mono text-slate-700 dark:text-slate-300 resize-none transition-all hover:border-blue-400 dark:hover:border-orange-500"
            />
            <button 
              onClick={handleTextSubmit} 
              disabled={!textInput.trim()} 
              className="w-full bg-blue-600 dark:bg-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 dark:hover:bg-orange-700 transition-all shadow-xl shadow-blue-500/20 dark:shadow-orange-500/20 active:scale-[0.98]"
            >
              Set Compliance Knowledge Base
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;
