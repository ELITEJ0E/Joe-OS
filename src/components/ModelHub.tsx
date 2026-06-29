import React, { useState } from 'react';
import { OllamaModelInfo } from '../types';
import { Server, Download, Trash2, Search, Cpu, HardDrive, Play, CheckCircle2, AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';

interface ModelHubProps {
  models: OllamaModelInfo[];
  ollamaUrl: string;
  onClose: () => void;
  onRefresh: () => void;
}

export function ModelHub({ models, ollamaUrl, onClose, onRefresh }: ModelHubProps) {
  const [pullModelName, setPullModelName] = useState('');
  const [pullProgress, setPullProgress] = useState<{ status: string, digest?: string, total?: number, completed?: number } | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullController, setPullController] = useState<AbortController | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePull = async () => {
    if (!pullModelName.trim()) return;
    setIsPulling(true);
    setPullProgress({ status: 'Initiating pull...' });
    
    const controller = new AbortController();
    setPullController(controller);

    try {
      const response = await fetch('/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pullModelName, ollamaUrl }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('Pull request failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          const rawData = line.slice(6).trim();
          try {
            const data = JSON.parse(rawData);
            setPullProgress(data);
            if (data.status === 'success') {
               setTimeout(() => {
                 setPullProgress(null);
                 setIsPulling(false);
                 setPullModelName('');
                 setPullController(null);
                 onRefresh();
               }, 2000);
            }
          } catch (e) {
            console.error('SSE Parse error', e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
         setPullProgress({ status: 'Pull cancelled by user.' });
         setTimeout(() => setPullProgress(null), 3000);
      } else {
         setPullProgress({ status: `Error: ${err.message}` });
      }
      setIsPulling(false);
      setPullController(null);
    }
  };

  const handleCancelPull = () => {
    if (pullController) {
      pullController.abort();
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredModels = models.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#08100c] border border-[#00ff66]/20 rounded-xl shadow-2xl flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#00ff66]/20 bg-[#00ff66]/5 rounded-t-xl">
          <div className="flex items-center gap-2 text-[#00ff66]">
            <Server size={20} />
            <h2 className="font-bold font-mono tracking-widest uppercase">Model Hub</h2>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-500/60 hover:text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors">
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          
          {/* Pull Section */}
          <div className="bg-[#050a08] border border-emerald-900/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-emerald-400 font-mono text-sm font-bold flex items-center gap-2">
                <Download size={16} /> Pull New Model
              </h3>
              <div className="flex gap-2">
                <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                  <Search size={10} /> Search Ollama
                </a>
                <a href="https://huggingface.co/models?search=gguf" target="_blank" rel="noopener noreferrer" className="text-[10px] bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                  <Search size={10} /> Search Hugging Face
                </a>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g., llama3.2, hf.co/bartowski/Llama-3.2-1B-Instruct-GGUF"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
                disabled={isPulling}
                className="flex-1 bg-[#0a0f0c] border border-emerald-900/60 rounded px-3 py-2 text-emerald-300 font-mono text-sm focus:outline-none focus:border-[#00ff66]/50 placeholder-emerald-800"
              />
              {isPulling ? (
                <button
                  onClick={handleCancelPull}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 px-4 py-2 rounded font-mono text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                  CANCEL PULL
                </button>
              ) : (
                <button
                  onClick={handlePull}
                  disabled={!pullModelName.trim()}
                  className="bg-[#00ff66]/10 hover:bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/30 px-4 py-2 rounded font-mono text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  PULL
                </button>
              )}
            </div>
            <p className="text-[10px] text-emerald-500/50 font-mono mt-2 flex items-center gap-1">
              <Info size={10} /> Supports Ollama tags and Hugging Face GGUF URLs (e.g. hf.co/user/repo)
            </p>
            
            {/* Progress */}
            {pullProgress && (
              <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-900/40 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono text-emerald-300">{pullProgress.status}</span>
                  {pullProgress.total && pullProgress.completed && (
                    <span className="text-xs font-mono text-emerald-400">
                      {Math.round((pullProgress.completed / pullProgress.total) * 100)}%
                    </span>
                  )}
                </div>
                {pullProgress.total && pullProgress.completed && (
                  <div className="w-full bg-[#030504] rounded-full h-1.5 overflow-hidden border border-emerald-900/30">
                    <div 
                      className="bg-[#00ff66] h-1.5 transition-all duration-300 ease-out" 
                      style={{ width: `${(pullProgress.completed / pullProgress.total) * 100}%` }}
                    ></div>
                  </div>
                )}
                {pullProgress.total && pullProgress.completed && (
                   <div className="text-[10px] font-mono text-emerald-500/70 mt-1.5 text-right">
                     {formatBytes(pullProgress.completed)} / {formatBytes(pullProgress.total)}
                   </div>
                )}
              </div>
            )}
          </div>

          {/* List Section */}
          <div>
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <h3 className="text-emerald-400 font-mono text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                <HardDrive size={16} /> Installed Models ({models.length})
              </h3>
              
              <div className="flex items-center gap-3 flex-1 min-w-[200px] justify-end">
                <div className="relative flex-1 max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search size={14} className="text-emerald-600" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search installed models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#050a08] border border-emerald-900/50 rounded-lg pl-8 pr-3 py-1.5 text-emerald-300 font-mono text-xs focus:outline-none focus:border-[#00ff66]/50 placeholder-emerald-800/70"
                  />
                </div>
                
                <button onClick={onRefresh} className="text-emerald-500 hover:text-[#00ff66] transition-colors flex items-center gap-1 text-xs font-mono whitespace-nowrap bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-900/30">
                  <Server size={14} /> Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredModels.map((model) => (
                <div key={model.name} className="bg-[#0a0f0c] border border-emerald-900/40 hover:border-[#00ff66]/30 transition-colors rounded-lg p-4 relative group">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-mono font-bold text-emerald-300 text-lg truncate pr-8">{model.name}</h4>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* We could add delete button here in future */}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-emerald-500/50">SIZE</span>
                      <span className="text-emerald-400">{formatBytes(model.size)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-emerald-500/50">FAMILY</span>
                      <span className="text-emerald-400 uppercase">{model.details?.family || 'UNKNOWN'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-emerald-500/50">PARAMS</span>
                      <span className="text-emerald-400">{model.details?.parameter_size || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-emerald-500/50">QUANTIZATION</span>
                      <span className="text-emerald-400">{model.details?.quantization_level || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-4 text-[10px] text-emerald-500/40 font-mono">
                    <Clock size={10} />
                    <span>Modified: {new Date(model.modified_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              
              {models.length === 0 && (
                <div className="col-span-full p-8 border border-dashed border-emerald-900/40 rounded-lg text-center flex flex-col items-center justify-center text-emerald-500/60 font-mono">
                  <AlertCircle size={32} className="mb-2 opacity-50" />
                  <p>No local Ollama models detected.</p>
                  <p className="text-xs mt-1">Try pulling one above (e.g., 'llama3.2')</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
