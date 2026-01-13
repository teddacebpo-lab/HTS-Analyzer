
import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Info, Layers, ChevronDown, ChevronUp, Quote, Search } from 'lucide-react';
import { AnalysisResult, MetalType, DerivativeMatch } from '../types';
import Tooltip from './Tooltip';

const MatchSnippet: React.FC<{ snippet: string }> = ({ snippet }) => {
  // We highlight HTS code patterns (XXXX.XX) within the snippet if found
  const htsPattern = /\b\d{4}(?:\.\d{2})?(?:\.\d{2})?(?:\.\d{2})?\b/g;
  const parts = snippet.split(htsPattern);
  const matches = snippet.match(htsPattern);

  return (
    <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4 border border-blue-200 dark:border-orange-500/30 font-medium italic relative group overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
        <Search size={24} />
      </div>
      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {matches && matches[i] && (
              <span className="bg-blue-100 dark:bg-orange-500/20 text-blue-800 dark:text-orange-200 px-1 rounded font-bold font-mono">
                {matches[i]}
              </span>
            )}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
};

const MatchItem: React.FC<{ match: DerivativeMatch }> = ({ match }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isAluminum = match.metalType === MetalType.ALUMINUM;
  const isSteel = match.metalType === MetalType.STEEL;
  
  const accentClass = isAluminum 
    ? "border-blue-500 text-blue-600 dark:text-blue-400" 
    : isSteel 
      ? "border-orange-500 text-orange-600 dark:text-orange-400"
      : "border-slate-500 text-slate-600 dark:text-slate-400";

  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm mb-4 transition-all duration-300 hover:shadow-md ${isExpanded ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 border-l-4 ${accentClass} rounded-full`}></div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">{match.derivativeCategory}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-current ${accentClass} bg-opacity-10`}>
                {match.metalType}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                Confidence: {match.confidence}
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 dark:hover:text-orange-500 transition-colors"
        >
          {isExpanded ? <><ChevronUp size={16} /> Hide Detail</> : <><ChevronDown size={16} /> View Match Rule</>}
        </button>
      </div>

      <div className="pl-5 space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
          {match.matchDetail}
        </p>
        
        {isExpanded && match.sourceSnippet && (
          <div className="animate-fade-in mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase text-slate-400 tracking-widest">
               <Quote size={12} /> Matched Rule Snippet
             </div>
             <MatchSnippet snippet={match.sourceSnippet} />
          </div>
        )}
      </div>
    </div>
  );
};

const AnalysisResultCard: React.FC<{ result: AnalysisResult; htsCode: string }> = ({ result, htsCode }) => {
  if (!result.found) return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 animate-fade-in shadow-xl group transition-all duration-500 hover:border-blue-500 dark:hover:border-orange-500">
      <div className="flex items-start gap-6">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-blue-500 dark:group-hover:text-orange-500 transition-colors">
          <AlertCircle size={32} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-2">HTS {htsCode} - Not Subject</h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{result.reasoning}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fade-in transition-all duration-500 hover:border-blue-500 dark:hover:border-orange-500">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-orange-600 dark:to-orange-700 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white">
            <CheckCircle size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white leading-none">Match Identified</h3>
            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">Section 232 Subject Classification</p>
          </div>
        </div>
        <div className="bg-black/20 backdrop-blur-md px-5 py-2 rounded-xl border border-white/10">
          <span className="text-white font-mono font-bold text-lg">{htsCode}</span>
        </div>
      </div>
      
      <div className="p-8">
        <div className="mb-8">
          <h4 className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2">
            <Layers size={14} /> Association Details
          </h4>
          <div>{result.matches.map((m, i) => <MatchItem key={i} match={m} />)}</div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
          <h4 className="text-[10px] font-black uppercase text-slate-400 mb-2">Intelligence Reasoning</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {result.reasoning}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultCard;
