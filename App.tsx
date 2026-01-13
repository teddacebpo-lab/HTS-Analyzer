
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Database, 
  ArrowRight, 
  Loader2, 
  History, 
  Lock, 
  Unlock, 
  Settings, 
  Moon, 
  Sun, 
  BookOpen, 
  RefreshCw, 
  Shield, 
  LayoutDashboard, 
  ChevronRight, 
  X, 
  FileText, 
  ScanText, 
  FileSearch, 
  AlertCircle,
  ShieldCheck,
  ScanSearch,
  Layers,
  TableProperties,
  Quote,
  Activity,
  ZapOff,
  Scale
} from 'lucide-react';
import DocumentUploader from './components/DocumentUploader';
import AnalysisResultCard from './components/AnalysisResultCard';
import ProvisionResultCard from './components/ProvisionResultCard';
import LoadingAnalysis from './components/LoadingAnalysis';
import ManualEntryManager from './components/ManualEntryManager';
import ReferenceInfo from './components/ReferenceInfo';
import Tooltip from './components/Tooltip';
// Fixed: Removed non-existent GeminiError import.
import { checkHtsCode, extractDocumentHeadings, lookupHtsProvision } from './services/geminiService';
import { 
  saveContextToDb, 
  getContextFromDb, 
  clearContextInDb,
  saveEntryToDb,
  getEntriesFromDb,
  deleteEntryFromDb
} from './services/dbService';
import { AnalysisResult, DocumentContext, ManualEntry, HeadingInfo, ProvisionResult } from './types';

const WatermarkBackground: React.FC<{ mode: 'compliance' | 'lookup' | 'admin-doc' | 'admin-manual' }> = ({ mode }) => {
  const getIcons = () => {
    switch(mode) {
      case 'compliance': return { primary: ShieldCheck, secondary: ScanSearch };
      case 'lookup': return { primary: BookOpen, secondary: FileSearch };
      case 'admin-doc': return { primary: Layers, secondary: LayoutDashboard };
      case 'admin-manual': return { primary: Database, secondary: TableProperties };
      default: return { primary: Shield, secondary: Search };
    }
  };
  const { primary: Icon1, secondary: Icon2 } = getIcons();
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.05] transition-all duration-1000">
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-24 p-24 rotate-[-15deg] scale-125">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="flex gap-24 transition-all duration-1000 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
            <Icon1 size={140} strokeWidth={0.5} />
            <Icon2 size={140} strokeWidth={0.5} />
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
  const [documentContext, setDocumentContext] = useState<DocumentContext | null>(null);
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([]);
  const [htsInput, setHtsInput] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isScanningDoc, setIsScanningDoc] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [searchedHts, setSearchedHts] = useState('');
  const [provisionResult, setProvisionResult] = useState<ProvisionResult | null>(null);
  const [searchedProvision, setSearchedProvision] = useState('');
  const [error, setError] = useState<{message: string, type: string} | null>(null);
  const [history, setHistory] = useState<{code: string, found: boolean}[]>([]);
  const [selectedHeading, setSelectedHeading] = useState<HeadingInfo | null>(null);
  const [searchMode, setSearchMode] = useState<'compliance' | 'lookup'>('compliance');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    return 'light';
  });

  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminTab, setAdminTab] = useState<'document' | 'manual'>('document');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      const savedContext = await getContextFromDb();
      if (savedContext) setDocumentContext(savedContext);
      const savedEntries = await getEntriesFromDb();
      setManualEntries(savedEntries);
    };
    loadData();
  }, []);

  const handleContextUpdate = async (context: DocumentContext | null) => {
    setDocumentContext(context);
    if (context) {
      await saveContextToDb(context);
    } else {
      await clearContextInDb();
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!htsInput.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setProvisionResult(null);

    try {
      if (searchMode === 'compliance') {
        const data = await checkHtsCode(documentContext, manualEntries, htsInput);
        setResult(data);
        setSearchedHts(htsInput);
        setHistory(prev => [{ code: htsInput, found: data.found }, ...prev.slice(0, 4)]);
      } else {
        const data = await lookupHtsProvision(documentContext, htsInput);
        setProvisionResult(data);
        setSearchedProvision(htsInput);
      }
    } catch (err: any) {
      // Fixed: Replaced GeminiError check with generic error handling.
      const message = err instanceof Error ? err.message : String(err);
      setError({ message, type: 'generic' });
    } finally {
      setIsLoading(false);
    }
  };

  const isSystemReady = documentContext || manualEntries.length > 0;
  const currentWatermarkMode = viewMode === 'admin' 
    ? (adminTab === 'document' ? 'admin-doc' : 'admin-manual')
    : (searchMode === 'compliance' ? 'compliance' : 'lookup');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-blue-100/30 dark:from-slate-950 dark:via-slate-900 dark:to-orange-950/20 font-sans text-slate-900 dark:text-slate-100 transition-all duration-300 relative overflow-hidden">
      
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300/10 dark:bg-orange-900/5 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200/10 dark:bg-orange-800/5 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      <WatermarkBackground mode={currentWatermarkMode} />

      <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-white/20 dark:border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setViewMode('user')}>
              <div className="bg-gradient-to-tr from-blue-700 to-blue-500 dark:from-orange-600 dark:to-orange-500 p-2 rounded-xl shadow-lg shadow-blue-500/20 dark:shadow-orange-500/30 transition-all duration-300 transform group-hover:scale-105">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tighter text-slate-900 dark:text-white leading-none">TEU GLOBAL</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">Trade Expeditors Inc.</span>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <Tooltip content={theme === 'light' ? 'Dark Mode' : 'Light Mode'} position="bottom">
                <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className="p-2.5 rounded-full hover:bg-blue-100/50 dark:hover:bg-orange-900/30 transition-all text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-orange-400">
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
              </Tooltip>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
              <Tooltip content={viewMode === 'admin' ? 'Exit Admin' : 'Admin Setup'} position="bottom">
                <button onClick={() => setViewMode(v => v === 'user' ? 'admin' : 'user')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 border ${viewMode === 'admin' ? 'bg-slate-900 text-white border-slate-900 hover:bg-blue-600 dark:bg-orange-600 dark:border-orange-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-orange-500 shadow-sm'}`}>
                  {viewMode === 'admin' ? <><ArrowRight size={14} /> Exit</> : <><Settings size={14} /> Admin</>}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col gap-8">
        {viewMode === 'admin' && (
          <div className="max-w-4xl mx-auto w-full animate-fade-in-up">
            {!isAdminAuthenticated ? (
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[32px] shadow-2xl border border-white/50 dark:border-slate-700 p-12 text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-blue-100 dark:bg-orange-950/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-blue-50 dark:border-orange-900/30"><Lock className="w-8 h-8 text-blue-600 dark:text-orange-500" /></div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Restricted Setup</h2>
                <form onSubmit={(e) => { e.preventDefault(); if(adminPassword==='332')setIsAdminAuthenticated(true);else alert('Invalid'); }} className="space-y-4">
                  <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-orange-500/10 focus:border-blue-500 dark:focus:border-orange-500 outline-none transition-all text-center font-mono tracking-widest hover:border-blue-500 dark:hover:border-orange-500" placeholder="••••" />
                  <button type="submit" className="w-full bg-blue-600 dark:bg-orange-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 dark:hover:bg-orange-700 transition-all active:scale-95 shadow-xl shadow-blue-500/20 dark:shadow-orange-500/20">Authenticate</button>
                </form>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Knowledge Engine</h2>
                  <button onClick={() => setIsAdminAuthenticated(false)} className="text-xs font-black uppercase text-red-500 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950 px-4 py-2 rounded-xl transition-all"><Lock size={14} /> Lock Panel</button>
                </div>
                <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl max-w-xs">
                  <button onClick={() => setAdminTab('document')} className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'document' ? 'bg-white dark:bg-orange-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>Ref Documents</button>
                  <button onClick={() => setAdminTab('manual')} className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${adminTab === 'manual' ? 'bg-white dark:bg-orange-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>Override Rules</button>
                </div>
                {adminTab === 'document' ? (
                  <div className="animate-fade-in">
                    <DocumentUploader onContextSet={handleContextUpdate} currentContext={documentContext} />
                  </div>
                ) : (
                  <ManualEntryManager 
                    entries={manualEntries} 
                    onAdd={async e => { await saveEntryToDb(e); setManualEntries(p => [...p, e]); }} 
                    onUpdate={async e => { await saveEntryToDb(e); setManualEntries(p => p.map(m => m.id === e.id ? e : m)); }} 
                    onDelete={async id => { await deleteEntryFromDb(id); setManualEntries(p => p.filter(m => m.id !== id)); }} 
                  />
                )}
              </div>
            )}
          </div>
        )}

        {viewMode === 'user' && (
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-8 animate-fade-in-up">
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-12 shadow-2xl border border-white/60 dark:border-slate-800 transition-all duration-500 hover:shadow-blue-500/10 dark:hover:shadow-orange-500/10">
              <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-10">
                <div className="space-y-1 text-center md:text-left">
                  <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">Compliance Intelligence</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Evaluate HTS codes against official Section 232 lists.</p>
                </div>
                <div className="flex gap-2 p-1 bg-slate-100/50 dark:bg-slate-950/50 rounded-2xl">
                  <button onClick={() => setSearchMode('compliance')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${searchMode === 'compliance' ? 'bg-white dark:bg-orange-600 text-blue-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-blue-500 dark:hover:text-orange-400'}`}><ScanSearch size={14}/> Analyze</button>
                  <button onClick={() => setSearchMode('lookup')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${searchMode === 'lookup' ? 'bg-white dark:bg-orange-600 text-blue-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-blue-500 dark:hover:text-orange-400'}`}><FileSearch size={14}/> Lookup</button>
                </div>
              </div>

              <form onSubmit={handleSearch} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">HTS Numeric Identifier</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-orange-500 transition-colors">
                      <Search size={28} />
                    </div>
                    <input 
                      type="text" 
                      value={htsInput} 
                      onChange={e => setHtsInput(e.target.value.replace(/[^0-9.]/g, ''))} 
                      className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[24px] pl-16 pr-8 py-6 text-2xl font-mono outline-none transition-all hover:border-blue-500 dark:hover:border-orange-500 focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-orange-500/5" 
                      placeholder="e.g. 7614.10"
                      autoFocus
                    />
                  </div>
                </div>

                <button 
                  disabled={!htsInput || isLoading || !isSystemReady} 
                  type="submit" 
                  className={`w-full py-6 rounded-[24px] text-white font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4 group ${searchMode === 'compliance' ? 'bg-gradient-to-r from-blue-700 to-blue-500 shadow-blue-500/20' : 'bg-gradient-to-r from-blue-600 to-cyan-500 shadow-blue-500/20'} dark:from-orange-700 dark:to-orange-500 dark:shadow-orange-500/20`}
                >
                  {isLoading ? (
                    <><Loader2 className="animate-spin" size={20} /> Process Intelligence</>
                  ) : (
                    <>{searchMode === 'compliance' ? 'Execute Compliance Scan' : 'Query Provision Details'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </form>

              {!isSystemReady && (
                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl flex items-center gap-3 animate-pulse">
                  <AlertCircle size={18} className="text-amber-600" />
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200">System context is uninitialized. Go to Admin Setup to provide reference documents.</p>
                </div>
              )}
            </div>

            <div className="space-y-8">
              {isLoading ? (
                <LoadingAnalysis />
              ) : (
                <div className="space-y-8">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900/40 rounded-3xl p-8 animate-fade-in shadow-lg">
                      <div className="flex gap-6 items-start">
                        <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-2xl"><AlertCircle className="text-red-600" size={32} /></div>
                        <div className="flex-1">
                          <h4 className="text-xl font-black uppercase tracking-tighter text-red-900 dark:text-red-100">Analysis Halted</h4>
                          <p className="text-sm font-bold text-red-700 dark:text-red-300 mt-2 leading-relaxed">{error.message}</p>
                          <button onClick={handleSearch} className="mt-6 flex items-center gap-2 px-6 py-3 bg-white dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-200 hover:bg-red-100 transition-all">Re-Attempt Classification</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {searchMode === 'compliance' ? (
                    result && <AnalysisResultCard result={result} htsCode={searchedHts} />
                  ) : (
                    provisionResult && <ProvisionResultCard result={provisionResult} code={searchedProvision} />
                  )}
                  {!result && !provisionResult && !error && (
                    <div className="p-20 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-inner group">
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-slate-300 dark:text-slate-600 shadow-xl group-hover:text-blue-500 dark:group-hover:text-orange-500 transition-all duration-500 group-hover:rotate-12">
                        <ScanSearch size={48} />
                      </div>
                      <h3 className="text-2xl font-black mb-2 text-slate-400 dark:text-slate-500">Core Engine Standby</h3>
                      <p className="text-slate-400 dark:text-slate-600 font-medium">Awaiting HTS code for regulatory evaluation.</p>
                    </div>
                  )}
                  <ReferenceInfo />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 py-16 border-t border-slate-200/50 dark:border-slate-800/50 backdrop-blur-md bg-white/30 dark:bg-slate-950/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6 group cursor-pointer">
             <div className="w-10 h-10 bg-blue-700 dark:bg-orange-600 rounded-xl flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform">T</div>
             <div className="text-left">
               <span className="font-black tracking-tighter text-slate-900 dark:text-white block leading-none">TEU GLOBAL</span>
               <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Trade Expeditors Inc.</span>
             </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Secure HTS Compliance Logic &bull; Powered by JUNAID ABBASI</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
