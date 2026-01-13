
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, Database, X, AlertCircle } from 'lucide-react';
import { ManualEntry, MetalType } from '../types';
import Tooltip from './Tooltip';

interface ManualEntryManagerProps {
  entries: ManualEntry[];
  onAdd: (entry: ManualEntry) => void;
  onUpdate: (entry: ManualEntry) => void;
  onDelete: (id: string) => void;
}

const ManualEntryManager: React.FC<ManualEntryManagerProps> = ({ entries, onAdd, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ManualEntry>>({
    code: '',
    description: '',
    category: '',
    metalType: MetalType.ALUMINUM
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    const htsRegex = /^[\d.]+(?:\s*-\s*[\d.]+)?$/;

    if (!formData.code?.trim()) newErrors.code = "HTS Code is required";
    else if (!htsRegex.test(formData.code.trim())) newErrors.code = "Invalid format";
    if (!formData.category?.trim()) newErrors.category = "Category name is required";
    if (!formData.description?.trim()) newErrors.description = "Rule detail is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ code: '', description: '', category: '', metalType: MetalType.ALUMINUM });
    setErrors({});
    setIsEditing(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isEditing) onUpdate({ ...formData, id: isEditing } as ManualEntry);
    else onAdd({ ...formData, id: crypto.randomUUID() } as ManualEntry);
    resetForm();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 p-8 transition-all duration-300">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 dark:bg-orange-950/40 rounded-2xl text-blue-600 dark:text-orange-400 shadow-inner">
          <Database className="w-6 h-6" />
        </div>
        <div>
           <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">Override Repository</h3>
           <p className="text-sm font-bold text-slate-400">Manage user-defined classification logic and scope overrides.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-10 bg-slate-50 dark:bg-slate-950/30 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em] ml-2">HTS Code Identifier</label>
            <input
              type="text"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl border-2 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-8 outline-none transition-all border-slate-100 dark:border-slate-800 focus:ring-blue-500/5 dark:focus:ring-orange-500/5 hover:border-blue-500 dark:hover:border-orange-500"
              placeholder="e.g. 7317.00.30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em] ml-2">Regulatory Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl border-2 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-8 outline-none transition-all border-slate-100 dark:border-slate-800 focus:ring-blue-500/5 dark:focus:ring-orange-500/5 hover:border-blue-500 dark:hover:border-orange-500"
              placeholder="e.g. Steel Nails"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em] ml-2">Classification Reasoning</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-5 py-4 rounded-2xl border-2 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-8 outline-none transition-all border-slate-100 dark:border-slate-800 focus:ring-blue-500/5 dark:focus:ring-orange-500/5 hover:border-blue-500 dark:hover:border-orange-500"
              placeholder="Matched based on FR 11249 definition..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em] ml-2">Subject Material</label>
            <select
              value={formData.metalType}
              onChange={e => setFormData({...formData, metalType: e.target.value as MetalType})}
              className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-orange-500/5 outline-none hover:border-blue-500 dark:hover:border-orange-500 cursor-pointer"
            >
              <option value={MetalType.ALUMINUM}>Aluminum (232)</option>
              <option value={MetalType.STEEL}>Steel (232)</option>
              <option value={MetalType.BOTH}>Both Categories</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
          {isEditing && (
            <button type="button" onClick={resetForm} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all flex items-center gap-2">
              <X className="w-4 h-4" /> Discard
            </button>
          )}
          <button 
            type="submit" 
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 dark:bg-orange-600 hover:bg-blue-700 dark:hover:bg-orange-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-blue-500/20 dark:shadow-orange-500/20 transition-all active:scale-95"
          >
            {isEditing ? <><Save className="w-4 h-4" /> Commit Update</> : <><Plus className="w-4 h-4" /> Add Logic Entry</>}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-8 py-5">HTS Identifier</th>
              <th className="px-8 py-5">Category Scope</th>
              <th className="px-8 py-5">Subject</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900/40">
            {entries.length > 0 ? entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-blue-50/50 dark:hover:bg-orange-950/10 transition-colors group">
                <td className="px-8 py-4 font-mono font-black text-slate-900 dark:text-white">{entry.code}</td>
                <td className="px-8 py-4 font-bold text-slate-600 dark:text-slate-400">{entry.category}</td>
                <td className="px-8 py-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${entry.metalType === MetalType.ALUMINUM ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : entry.metalType === MetalType.STEEL ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>{entry.metalType}</span>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip content="Edit Record">
                      <button onClick={() => { setIsEditing(entry.id); setFormData(entry); }} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-orange-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Delete Record">
                      <button onClick={() => onDelete(entry.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold italic">No manual override rules are currently defined in the repository.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManualEntryManager;
