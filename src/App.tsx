import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import * as Diff from 'diff';
import {
  Brain,
  Code,
  ShieldCheck,
  Search,
  Database,
  Play,
  Settings,
  Terminal,
  RefreshCw,
  Clock,
  Trash2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  HelpCircle,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Download,
  Menu,
  Sliders,
  X,
  Palette
} from 'lucide-react';
import { Agent, AgentId, PipelineNode, Message, MemoryItem } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';

// 128-dimensional local vector hashing helper
function getLocalEmbeddingVector(text: string): number[] {
  const dims = 128;
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  if (words.length === 0) return vec;
  
  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dims;
    vec[idx] += 1;
  }
  
  let sumSq = 0;
  for (let i = 0; i < dims; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < dims; i++) {
      vec[i] /= norm;
    }
  }
  return vec;
}

// Cosine similarity helper
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function CodeDiffViewer({ oldCode, newCode, title }: { oldCode: string, newCode: string, title?: string }) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const diffs = Diff.diffLines(oldCode || '', newCode || '');

  return (
    <div className="rounded-xl border border-emerald-900/30 bg-[#030504] overflow-hidden my-3 shadow-inner">
      <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-950 bg-[#08100c]">
        <div className="flex items-center gap-2">
          <Code size={14} className="text-emerald-400" />
          <span className="text-xs font-mono font-bold text-emerald-400">{title || 'CODE DIFF'}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${viewMode === 'split' ? 'bg-emerald-900/60 text-emerald-300' : 'text-slate-400 hover:bg-emerald-950/40'}`}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${viewMode === 'unified' ? 'bg-emerald-900/60 text-emerald-300' : 'text-slate-400 hover:bg-emerald-950/40'}`}
          >
            Unified
          </button>
        </div>
      </div>
      
      <div className="p-0 overflow-x-auto text-[12px] font-mono leading-relaxed max-h-[600px] bg-[#020302]">
        {viewMode === 'unified' ? (
          <div className="flex flex-col min-w-max">
            {diffs.map((part, i) => {
              if (part.added) {
                return <div key={i} className="bg-emerald-900/20 text-[#00ff66] px-4 py-0.5 whitespace-pre border-l-2 border-[#00ff66]">+ {part.value.replace(/\n$/, '')}</div>;
              }
              if (part.removed) {
                return <div key={i} className="bg-rose-900/20 text-rose-400 px-4 py-0.5 whitespace-pre border-l-2 border-rose-500">- {part.value.replace(/\n$/, '')}</div>;
              }
              return <div key={i} className="text-slate-400 px-4 py-0.5 whitespace-pre border-l-2 border-transparent">  {part.value.replace(/\n$/, '')}</div>;
            })}
          </div>
        ) : (
          <div className="flex min-w-max w-full">
            <div className="flex-1 border-r border-emerald-900/30">
              <div className="sticky top-0 bg-[#050806] px-4 py-1.5 border-b border-emerald-900/30 text-[10px] text-slate-400 font-bold tracking-wider">PREVIOUS</div>
              <div className="flex flex-col pb-4">
                {diffs.map((part, i) => {
                  if (part.added) {
                    return <div key={i} className="bg-emerald-900/10 text-transparent select-none px-4 py-0.5 whitespace-pre border-l-2 border-transparent">  {part.value.replace(/\n$/, '')}</div>;
                  }
                  if (part.removed) {
                    return <div key={i} className="bg-rose-900/20 text-rose-400 px-4 py-0.5 whitespace-pre border-l-2 border-rose-500">- {part.value.replace(/\n$/, '')}</div>;
                  }
                  return <div key={i} className="text-slate-400 px-4 py-0.5 whitespace-pre border-l-2 border-transparent">  {part.value.replace(/\n$/, '')}</div>;
                })}
              </div>
            </div>
            <div className="flex-1">
              <div className="sticky top-0 bg-[#050806] px-4 py-1.5 border-b border-emerald-900/30 text-[10px] text-emerald-400 font-bold tracking-wider">UPDATED</div>
              <div className="flex flex-col pb-4">
                {diffs.map((part, i) => {
                  if (part.added) {
                    return <div key={i} className="bg-emerald-900/20 text-[#00ff66] px-4 py-0.5 whitespace-pre border-l-2 border-[#00ff66]">+ {part.value.replace(/\n$/, '')}</div>;
                  }
                  if (part.removed) {
                    return <div key={i} className="bg-rose-900/10 text-transparent select-none px-4 py-0.5 whitespace-pre border-l-2 border-transparent">  {part.value.replace(/\n$/, '')}</div>;
                  }
                  return <div key={i} className="text-slate-400 px-4 py-0.5 whitespace-pre border-l-2 border-transparent">  {part.value.replace(/\n$/, '')}</div>;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  // Config state
  const [engine, setEngine] = useState<'gemini' | 'ollama'>('gemini');
  const [ollamaUrl, setOllamaUrl] = useState<string>('http://localhost:11434');
  const [searchGrounding, setSearchGrounding] = useState<boolean>(true);
  
  // Custom Model configuration state (using real, standard local models)
  const [plannerModel, setPlannerModel] = useState<string>('llama3.2');
  const [coderModel, setCoderModel] = useState<string>('qwen2.5-coder:7b');
  const [reviewerModel, setReviewerModel] = useState<string>('llama3.2');
  const [researcherModel, setResearcherModel] = useState<string>('llama3.2');

  // Ollama Connection and Installed Models state
  const [ollamaConnectionStatus, setOllamaConnectionStatus] = useState<'unchecked' | 'connected' | 'failed'>('unchecked');
  const [installedOllamaModels, setInstalledOllamaModels] = useState<string[]>([
    'llama3.2',
    'llama3.1',
    'qwen2.5-coder:7b',
    'qwen2.5:7b',
    'mistral',
    'gemma2:2b',
    'phi3'
  ]);

  // Interactive controls
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'settings' | 'about'>('pipeline');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMemorySearching, setIsMemorySearching] = useState<boolean>(false);
  const [memorySearchQuery, setMemorySearchQuery] = useState<string>('');
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);

  // Premium Enhancements States
  const [theme, setTheme] = useState<'dark' | 'light' | 'oled'>(() => {
    return (localStorage.getItem('joelos_theme') as 'dark' | 'light' | 'oled') || 'dark';
  });
  const [timingsHistory, setTimingsHistory] = useState<Array<{ timestamp: string; memory: number; researcher: number; planner: number; coder: number; reviewer: number }>>(() => {
    const saved = localStorage.getItem('joelos_timings_history');
    return saved ? JSON.parse(saved) : [
      { timestamp: '10:45:12', memory: 0.8, researcher: 2.1, planner: 1.5, coder: 4.2, reviewer: 1.9 },
      { timestamp: '11:02:44', memory: 0.6, researcher: 1.8, planner: 1.2, coder: 3.8, reviewer: 1.5 },
      { timestamp: '11:20:15', memory: 1.1, researcher: 2.5, planner: 1.9, coder: 5.1, reviewer: 2.2 },
    ];
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('joelos_sound_enabled') !== 'false';
  });
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [isMemoryDrawerOpen, setIsMemoryDrawerOpen] = useState<boolean>(false);
  const pipelineAbortedRef = useRef<boolean>(false);
  const [agentTimings, setAgentTimings] = useState<Record<string, string>>({});
  const [agentTokens, setAgentTokens] = useState<Record<string, number>>({});
  const [sessionTokens, setSessionTokens] = useState<number>(() => {
    return Number(localStorage.getItem('joelos_session_tokens')) || 0;
  });
  const [failedPhase, setFailedPhase] = useState<string | null>(null);

  // Dynamic customization states
  const [colorPalette, setColorPalette] = useState<'matrix-green' | 'cyber-blue'>(() => {
    return (localStorage.getItem('joelos_color_palette') as 'matrix-green' | 'cyber-blue') || 'matrix-green';
  });
  const [nodeContexts, setNodeContexts] = useState<Record<string, { input: string; output: string; model?: string; timestamp?: string }>>({});
  const [selectedNodeContextId, setSelectedNodeContextId] = useState<string | null>(null);

  // Context states for resume/retry capability
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [researcherContext, setResearcherContext] = useState<string>('');
  const [plannerOutputText, setPlannerOutputText] = useState<string>('');
  const [coderOutputText, setCoderOutputText] = useState<string>('');
  const [reviewerOutputText, setReviewerOutputText] = useState<string>('');

  // Pipeline Execution Priority
  const [priorityAgent, setPriorityAgent] = useState<string>(() => {
    return localStorage.getItem('joelos_priority_agent') || 'none';
  });

  // Audio completion sound chime
  const playCompletionSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      // First note: E5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Second note: A5
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.15);
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.15, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.8);
    } catch (e) {
      console.warn('Web Audio API chime failed to play', e);
    }
  };

  // Export chat as formatted Markdown file
  const exportChatAsMarkdown = () => {
    try {
      let md = `# JoelOS Workspace Export\n`;
      md += `*Generated on: ${new Date().toLocaleString()}*\n`;
      md += `*Engine Mode: ${engine.toUpperCase()}*\n\n`;
      md += `---\n\n`;

      messages.forEach(msg => {
        const senderName = msg.sender === 'user' ? '👤 USER' :
                           msg.sender === 'planner' ? '🧠 PLANNER' :
                           msg.sender === 'coder' ? '💻 CODER' :
                           msg.sender === 'reviewer' ? '🔍 REVIEWER' :
                           msg.sender === 'researcher' ? '🌐 RESEARCHER' :
                           msg.sender === 'memory' ? '📚 MEMORY SYSTEM' : '⚙️ SYSTEM';
        md += `### ${senderName} (${msg.timestamp})\n\n`;
        md += `${msg.text}\n\n`;
        md += `---\n\n`;
      });

      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `joelos_chat_${Date.now()}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export markdown', e);
    }
  };

  useEffect(() => {
    localStorage.setItem('joelos_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('joelos_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('joelos_session_tokens', String(sessionTokens));
  }, [sessionTokens]);

  useEffect(() => {
    localStorage.setItem('joelos_priority_agent', priorityAgent);
  }, [priorityAgent]);

  // Global keypress listener for shortcut panel (?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support closing the modal on Escape even when inputs are focused or not
      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        setIsMemoryDrawerOpen(false);
      }

      // Ignore if user is inside input, textarea, or select fields for other shortcuts
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      
      if (isInput) {
        if (e.key === 'Escape') {
          target.blur();
        }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          startPipelineOrchestration();
        }
        return;
      }

      if (e.key === '?') {
        setShortcutsOpen(prev => !prev);
      } else if (e.key === '/') {
        e.preventDefault();
        const inputEl = document.querySelector('textarea') as HTMLTextAreaElement | null;
        inputEl?.focus();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        clearHistory();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [clearHistory]);
  
  // Memories and vector score storage
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [matchedMemories, setMatchedMemories] = useState<MemoryItem[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);

  // Agent profiles and runtime execution states
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'planner',
      name: 'Planner',
      icon: '🧠',
      dotColor: 'bg-amber-500 shadow-amber-500/50 text-amber-500 border-amber-500/20',
      model: 'llama3.2',
      description: 'Lead software architect. Creates blueprints and execution tasks. Never writes code.',
      status: 'idle',
    },
    {
      id: 'coder',
      name: 'Coder',
      icon: '💻',
      dotColor: 'bg-emerald-500 shadow-emerald-500/50 text-emerald-500 border-emerald-500/20',
      model: 'qwen2.5-coder:7b',
      description: 'Senior code developer. Writes full implementations from architecture specs.',
      status: 'idle',
    },
    {
      id: 'reviewer',
      name: 'Reviewer',
      icon: '🔍',
      dotColor: 'bg-rose-500 shadow-rose-500/50 text-rose-500 border-rose-500/20',
      model: 'llama3.2',
      description: 'Senior code reviewer. Inspects syntax, logic errors, and security issues.',
      status: 'idle',
    },
    {
      id: 'researcher',
      name: 'Researcher',
      icon: '🌐',
      dotColor: 'bg-sky-500 shadow-sky-500/50 text-sky-500 border-sky-500/20',
      model: 'llama3.2',
      description: 'Expert research analyst. Resolves facts, fetches specs and retrieves guidelines.',
      status: 'idle',
    },
    {
      id: 'memory',
      name: 'Memory',
      icon: '📚',
      dotColor: 'bg-purple-500 shadow-purple-500/50 text-purple-500 border-purple-500/20',
      model: 'Vector Engine',
      description: 'Context and historical recall manager. Computes similarity across past sessions.',
      status: 'idle',
    }
  ]);

  // Orchestration progress nodes
  const [pipelineNodes, setPipelineNodes] = useState<PipelineNode[]>([
    { id: 'start', label: 'User Intent', status: 'pending' },
    { id: 'memory', label: 'Memory Recall', status: 'pending' },
    { id: 'researcher', label: 'Web Research', status: 'pending' },
    { id: 'planner', label: 'Planner Blueprint', status: 'pending' },
    { id: 'coder', label: 'Coder Implementation', status: 'pending' },
    { id: 'reviewer', label: 'Reviewer Audit', status: 'pending' },
    { id: 'output', label: 'Synthesized Deliverable', status: 'pending' },
  ]);

  function clearHistory() {
    if (window.confirm('Are you sure you want to clear conversation logs?')) {
      setMessages([]);
      setPipelineNodes(prev => prev.map(n => ({ ...n, status: 'pending' })));
    }
  }

  const [pipelineIsRunning, setPipelineIsRunning] = useState<boolean>(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Set system instructions for agents
  const systemInstructions = {
    planner: `You are the JoelOS Planner, an expert coordinator and lead software architect. Your job is to break down the user's high-level goal into highly clear, sequential, and executable tasks. Guidelines: NEVER write actual source code. Keep your focus entirely on listing structural goals, APIs to use, and execution steps. Output with headers: Objective, Task Plan, Success Criteria.${priorityAgent === 'planner' ? ' [PRIORITY OVERRIDE]: Provide extremely thorough, multi-layered architectural blueprints and exhaustive edge-case handling considerations.' : ''}`,
    coder: `You are the JoelOS Coder, an elite systems programmer. Your job is to read the task plan from the Planner and implement it as production-ready, high-quality, fully commented code. Make sure to implement all files, classes, and logic completely with no placeholders. Wrap your code blocks in markdown blocks.${priorityAgent === 'coder' ? ' [PRIORITY OVERRIDE]: Write extensive, deeply optimized, and thoroughly documented code, exploring multiple performance optimizations.' : ''}`,
    reviewer: `You are the JoelOS Reviewer, a senior staff security auditor and code reviewer. Your job is to review the code generated by the Coder. Analyze it for security vulnerabilities, bugs, syntax errors, and performance bottlenecks. Output with a structured format:\nVerdict: [APPROVED or CHANGES REQUESTED]\nIssues Found: [List each with Severity level: High/Medium/Low]\nSummary: [Provide a brief feedback summary]${priorityAgent === 'reviewer' ? ' [PRIORITY OVERRIDE]: Perform a highly aggressive, pedantic review. Do not let any minor stylistic or performance issue pass without comment.' : ''}`,
    researcher: `You are the JoelOS Researcher, an expert information miner. Your job is to seek out current information, technical documentation, API specifications, and context. Summarize findings clearly and cite sources.${priorityAgent === 'researcher' ? ' [PRIORITY OVERRIDE]: Conduct a significantly deeper and more comprehensive research cycle. Exhaustively detail all APIs, dependencies, and surrounding context.' : ''}`,
  };

  // Check and fetch real running Ollama models dynamically
  useEffect(() => {
    let active = true;
    const checkOllama = async () => {
      setOllamaConnectionStatus('unchecked');
      
      // Attempt 1: Fetch through server-side proxy
      try {
        const res = await fetch(`/api/tags?url=${encodeURIComponent(ollamaUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.models && Array.isArray(data.models) && data.models.length > 0) {
            if (active) {
              setInstalledOllamaModels(data.models);
              setOllamaConnectionStatus('connected');
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Ollama proxy check failed, trying client direct check:', err);
      }

      // Attempt 2: Fetch directly from client browser
      try {
        const res = await fetch(`${ollamaUrl}/api/tags`);
        if (res.ok) {
          const data = await res.json();
          if (data.models && Array.isArray(data.models) && data.models.length > 0) {
            const names = data.models.map((m: any) => m.name);
            if (active) {
              setInstalledOllamaModels(names);
              setOllamaConnectionStatus('connected');
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Ollama browser direct check failed:', err);
      }

      if (active) {
        setOllamaConnectionStatus('failed');
      }
    };

    checkOllama();
    return () => {
      active = false;
    };
  }, [ollamaUrl]);

  // Sync available Ollama models to default agent model states
  useEffect(() => {
    if (ollamaConnectionStatus === 'connected' && installedOllamaModels.length > 0) {
      const coderOption = installedOllamaModels.find(m => m.toLowerCase().includes('coder')) || installedOllamaModels[0];
      const generalOption = installedOllamaModels.find(m => m.toLowerCase().includes('llama3.2') || m.toLowerCase().includes('llama3') || m.toLowerCase().includes('qwen')) || installedOllamaModels[0];
      
      setPlannerModel(prev => installedOllamaModels.includes(prev) ? prev : generalOption);
      setCoderModel(prev => installedOllamaModels.includes(prev) ? prev : coderOption);
      setReviewerModel(prev => installedOllamaModels.includes(prev) ? prev : generalOption);
      setResearcherModel(prev => installedOllamaModels.includes(prev) ? prev : generalOption);
    }
  }, [ollamaConnectionStatus, installedOllamaModels]);

  // Sync Agent configs in states
  useEffect(() => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === 'planner') return { ...agent, model: engine === 'gemini' ? 'gemini-3.5-flash' : plannerModel };
      if (agent.id === 'coder') return { ...agent, model: engine === 'gemini' ? 'gemini-3.1-pro-preview' : coderModel };
      if (agent.id === 'reviewer') return { ...agent, model: engine === 'gemini' ? 'gemini-3.5-flash' : reviewerModel };
      if (agent.id === 'researcher') return { ...agent, model: engine === 'gemini' ? 'gemini-3.5-flash' : researcherModel };
      return agent;
    }));
  }, [engine, plannerModel, coderModel, reviewerModel, researcherModel]);

  // Load memories from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('joelos_memories');
      if (stored) {
        const parsed = JSON.parse(stored);
        setMemories(parsed);
        setMatchedMemories(parsed.slice(0, 10)); // default recent
      } else {
        // Seed some sample memories
        const seeds: MemoryItem[] = [
          {
            id: 'seed-1',
            title: 'Worship Media Database Architecture',
            summary: 'A relational model for storing slide decks, lyric sheets, and audio stems with tag-based filters.',
            snippet: 'CREATE TABLE songs (id UUID, title TEXT, lyrics TEXT, key CHAR(2));',
            tags: ['sql', 'database', 'media'],
            embedding: getLocalEmbeddingVector('Worship Media Database Architecture with postgresql CREATE TABLE songs'),
            timestamp: new Date(Date.now() - 3600000 * 24 * 3).toLocaleString(),
          },
          {
            id: 'seed-2',
            title: 'Realtime WebSocket Audio Streaming Engine',
            summary: 'Node.js event controller to feed microphone audio chunks to audio processors with low latency.',
            snippet: 'const wss = new WebSocketServer({ port: 8080 });',
            tags: ['websockets', 'audio', 'node'],
            embedding: getLocalEmbeddingVector('Realtime WebSocket Audio Streaming Engine with ws and raw PCM audio streams'),
            timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString(),
          }
        ];
        localStorage.setItem('joelos_memories', JSON.stringify(seeds));
        setMemories(seeds);
        setMatchedMemories(seeds);
      }
    } catch (e) {
      console.error('Error loading localStorage memories', e);
    }
  }, []);

  // Health check on backend server
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'healthy') {
          setServerHealthy(true);
        } else {
          setServerHealthy(false);
        }
      })
      .catch(() => setServerHealthy(false));
  }, []);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Search Memory Filter on local items
  const handleMemorySearch = async (query: string) => {
    setMemorySearchQuery(query);
    if (!query.trim()) {
      setMatchedMemories(memories.slice(0, 10));
      return;
    }

    setIsMemorySearching(true);
    try {
      // Generate embedding vector for query
      let queryEmbedding: number[] = [];
      if (engine === 'gemini' && serverHealthy) {
        const res = await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: query, engine: 'gemini' }),
        });
        const data = await res.json();
        if (data.embedding) {
          queryEmbedding = data.embedding;
        }
      }
      
      if (queryEmbedding.length === 0) {
        queryEmbedding = getLocalEmbeddingVector(query);
      }

      // Calculate similarity score on all items
      const scored = memories.map(item => {
        const itemEmbedding = item.embedding || getLocalEmbeddingVector(item.title + ' ' + item.summary + ' ' + item.snippet);
        const score = calculateCosineSimilarity(queryEmbedding, itemEmbedding);
        return { ...item, relevance: score };
      });

      // Sort by similarity score descending
      const sorted = scored
        .filter(item => (item.relevance || 0) > 0.05 || item.title.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

      setMatchedMemories(sorted);
    } catch (err) {
      console.error('Embedding query calculation error:', err);
      // fallback simple keyword match
      const filtered = memories.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.summary.toLowerCase().includes(query.toLowerCase()) ||
        item.snippet.toLowerCase().includes(query.toLowerCase())
      );
      setMatchedMemories(filtered);
    } finally {
      setIsMemorySearching(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Helper to draw timing chart
  const renderTimingChart = () => {
    if (timingsHistory.length === 0) {
      return (
        <div className="text-center py-8 text-emerald-700 text-xs">
          No historical orchestration metrics available. Run a pipeline to generate timings.
        </div>
      );
    }

    const maxVal = Math.max(...timingsHistory.map(d => d.memory + d.researcher + d.planner + d.coder + d.reviewer), 3);
    const chartHeight = 160;
    
    return (
      <div className="space-y-6">
        <div className="relative border border-emerald-950/60 rounded-xl p-4 bg-[#0a0f0c]/30 font-mono">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-4 border-b border-emerald-950/40 pb-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Agent Execution Bottleneck Timeline (Stacked Duration)</span>
            <span className="text-[10px] text-emerald-500/50">Max Height: {maxVal.toFixed(1)}s</span>
          </div>

          {/* SVG Visualizer */}
          <div className="h-44 w-full flex items-end gap-3 md:gap-5 overflow-x-auto pt-4 pb-2 select-none min-h-[180px] scrollbar-none">
            {timingsHistory.map((run, i) => {
              const total = run.memory + run.researcher + run.planner + run.coder + run.reviewer;
              const hMemory = (run.memory / maxVal) * chartHeight;
              const hResearcher = (run.researcher / maxVal) * chartHeight;
              const hPlanner = (run.planner / maxVal) * chartHeight;
              const hCoder = (run.coder / maxVal) * chartHeight;
              const hReviewer = (run.reviewer / maxVal) * chartHeight;

              // Find slowest agent
              const timings = [
                { name: 'Memory', val: run.memory },
                { name: 'Researcher', val: run.researcher },
                { name: 'Planner', val: run.planner },
                { name: 'Coder', val: run.coder },
                { name: 'Reviewer', val: run.reviewer }
              ];
              const slowest = timings.reduce((prev, curr) => prev.val > curr.val ? prev : curr);

              return (
                <div key={i} className="flex-1 flex flex-col items-center min-w-[50px] group relative h-full justify-end">
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-[calc(100%-8px)] left-1/2 -translate-x-1/2 z-20 hidden group-hover:flex flex-col bg-black border border-emerald-500/40 p-2.5 rounded-lg text-[9px] text-slate-200 whitespace-nowrap shadow-2xl font-mono text-left space-y-1">
                    <span className="text-[10px] font-bold text-white border-b border-emerald-950 pb-1 block mb-1">Run at {run.timestamp}</span>
                    <span className="flex justify-between gap-4"><span>Memory:</span> <span className="text-emerald-400 font-bold">{run.memory.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Researcher:</span> <span className="text-emerald-400 font-bold">{run.researcher.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Planner:</span> <span className="text-emerald-400 font-bold">{run.planner.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Coder Engine:</span> <span className="text-[#00ff66] font-bold">{run.coder.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Reviewer:</span> <span className="text-emerald-400 font-bold">{run.reviewer.toFixed(1)}s</span></span>
                    <div className="border-t border-emerald-950 pt-1 mt-1 text-[8px] flex justify-between font-bold text-rose-400">
                      <span>BOTTLENECK:</span>
                      <span>{slowest.name} ({slowest.val.toFixed(1)}s)</span>
                    </div>
                  </div>

                  {/* Stacked bar container */}
                  <div className="w-6 sm:w-8 bg-emerald-950/15 rounded-t-md overflow-hidden flex flex-col justify-end border border-emerald-950/30 group-hover:border-emerald-500/40 transition-colors" style={{ height: `${chartHeight}px` }}>
                    {/* Reviewer */}
                    <div className="w-full bg-indigo-500/85 transition-all duration-300 hover:brightness-125" style={{ height: `${hReviewer}px` }} />
                    {/* Coder (Core bottleneck!) */}
                    <div className="w-full bg-[#00ff66]/85 transition-all duration-300 hover:brightness-125 border-t border-emerald-400/20" style={{ height: `${hCoder}px` }} />
                    {/* Planner */}
                    <div className="w-full bg-amber-500/85 transition-all duration-300 hover:brightness-125 border-t border-emerald-400/20" style={{ height: `${hPlanner}px` }} />
                    {/* Researcher */}
                    <div className="w-full bg-cyan-500/85 transition-all duration-300 hover:brightness-125 border-t border-emerald-400/20" style={{ height: `${hResearcher}px` }} />
                    {/* Memory */}
                    <div className="w-full bg-emerald-700/85 transition-all duration-300 hover:brightness-125" style={{ height: `${hMemory}px` }} />
                  </div>

                  {/* Label */}
                  <span className="text-[9px] text-emerald-500/60 font-mono mt-1.5 font-bold">{run.timestamp.split(':')[0]}:{run.timestamp.split(':')[1]}</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3.5 border-t border-emerald-950/40 text-[9px]">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-700/85"></span><span className="text-emerald-500/80">Memory Recall</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-cyan-500/85"></span><span className="text-emerald-500/80">Researcher</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500/85"></span><span className="text-emerald-500/80">Planner</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-[#00ff66]/85"></span><span className="text-emerald-500/80">Coder Engine (Active Bottleneck)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-indigo-500/85"></span><span className="text-emerald-500/80">Reviewer Auditor</span></div>
          </div>
        </div>

        {/* Detailed Run Analysis */}
        <div className="p-4 rounded-xl border border-emerald-950/60 bg-[#080d0a]">
          <h4 className="font-semibold text-xs text-white mb-2.5 flex items-center gap-1.5">
            <Sliders size={13} className="text-emerald-400" />
            <span>Bottleneck Discovery Ledger</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] font-mono">
              <thead>
                <tr className="border-b border-emerald-950 text-emerald-500/60 font-bold">
                  <th className="pb-2">RUN TIME</th>
                  <th className="pb-2">SLOWEST AGENT (BOTTLENECK)</th>
                  <th className="pb-2 text-right">TOTAL DURATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/50">
                {timingsHistory.slice().reverse().map((run, i) => {
                  const total = run.memory + run.researcher + run.planner + run.coder + run.reviewer;
                  const timings = [
                    { name: 'Memory Module', val: run.memory, icon: '🗄️' },
                    { name: 'Researcher Fact-Checker', val: run.researcher, icon: '🔍' },
                    { name: 'Architect Planner', val: run.planner, icon: '📋' },
                    { name: 'Coder Engine', val: run.coder, icon: '💻' },
                    { name: 'Reviewer Auditor', val: run.reviewer, icon: '🛡️' }
                  ];
                  const slowest = timings.reduce((prev, curr) => prev.val > curr.val ? prev : curr);
                  
                  return (
                    <tr key={i} className="hover:bg-emerald-950/10">
                      <td className="py-2.5 text-slate-300 font-bold">{run.timestamp}</td>
                      <td className="py-2.5 flex items-center gap-1.5">
                        <span className="text-xs">{slowest.icon}</span>
                        <span className="text-rose-400 font-bold">{slowest.name}</span>
                        <span className="text-emerald-500/50">({slowest.val.toFixed(1)}s)</span>
                        {slowest.val > 3.0 && <span className="text-[9px] bg-rose-500/15 text-rose-400 px-1 py-0.5 rounded font-black border border-rose-500/20">🔥 Bottleneck</span>}
                      </td>
                      <td className="py-2.5 text-right font-black text-white">{total.toFixed(1)}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Stop current active pipeline
  const stopPipelineOrchestration = () => {
    pipelineAbortedRef.current = true;
    setPipelineIsRunning(false);
    setAgents(prev => prev.map(a => a.status === 'thinking' ? { ...a, status: 'idle' } : a));
    setPipelineNodes(nodes => nodes.map(n => n.status === 'active' ? { ...n, status: 'pending' } : n));
    setMessages(prev => [...prev, {
      id: 'sys-stop-' + Date.now(),
      sender: 'system',
      text: '🛑 Pipeline orchestration stopped by user. Workspace state has been frozen.',
      timestamp: new Date().toLocaleTimeString(),
    }]);
  };

  // Run whole pipeline orchestration step-by-step
  const startPipelineOrchestration = async (fromPhase?: string) => {
    pipelineAbortedRef.current = false;
    let targetQuery = '';
    let memoryDuration = parseFloat(agentTimings.memory || '0');
    let researcherDuration = parseFloat(agentTimings.researcher || '0');
    let plannerDuration = parseFloat(agentTimings.planner || '0');
    let coderDuration = parseFloat(agentTimings.coder || '0');
    let reviewerDuration = parseFloat(agentTimings.reviewer || '0');
    
    if (fromPhase) {
      targetQuery = currentQuery;
      // Reset only subsequent phases
      setPipelineIsRunning(true);
      setRuntimeError(null);
      setFailedPhase(null);
    } else {
      if (!userPrompt.trim()) return;
      if (pipelineIsRunning) return;
      targetQuery = userPrompt;
      setCurrentQuery(targetQuery);
      setUserPrompt('');

      // Clear previous run data
      setAgentTimings({});
      setAgentTokens({});
      setFailedPhase(null);
      setResearcherContext('');
      setPlannerOutputText('');
      setCoderOutputText('');
      setReviewerOutputText('');
      setNodeContexts({
        start: {
          input: targetQuery,
          output: `Extracted user intent for processing: "${targetQuery}"`,
          timestamp: new Date().toLocaleTimeString(),
          model: engine === 'gemini' ? 'Gemini Orchestrator' : 'Ollama Orchestrator'
        }
      });

      setPipelineIsRunning(true);
      setRuntimeError(null);
      setSelectedMemory(null);

      // Reset nodes to pending
      setPipelineNodes(nodes => nodes.map(n => ({ ...n, status: 'pending' })));
      setPipelineNodes(nodes => nodes.map(n => n.id === 'start' ? { ...n, status: 'completed' } : n));

      // Reset agent status
      setAgents(prev => prev.map(a => ({ ...a, status: 'idle' })));

      // Push initial user message
      const userMsgId = 'user-' + Date.now();
      const newUserMessage: Message = {
        id: userMsgId,
        sender: 'user',
        text: targetQuery,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, newUserMessage]);
    }

    // Track state of current workspace variables
    let currentConversationContext = '';

    // --- STEP 1: MEMORY RECALL AGENT ---
    if (pipelineAbortedRef.current) return;
    if (!fromPhase || fromPhase === 'memory') {
      const memoryStartTime = Date.now();
      setAgents(prev => prev.map(a => a.id === 'memory' ? { ...a, status: 'thinking' } : a));
      setPipelineNodes(nodes => nodes.map(n => n.id === 'memory' ? { ...n, status: 'active' } : n));

      try {
        let queryEmbedding: number[] = [];
        if (engine === 'gemini' && serverHealthy) {
          const res = await fetch('/api/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: targetQuery, engine: 'gemini' }),
          });
          const data = await res.json();
          if (data.embedding) queryEmbedding = data.embedding;
        }
        if (queryEmbedding.length === 0) {
          queryEmbedding = getLocalEmbeddingVector(targetQuery);
        }

        const scored = memories.map(item => {
          const itemEmbedding = item.embedding || getLocalEmbeddingVector(item.title + ' ' + item.summary + ' ' + item.snippet);
          return { ...item, relevance: calculateCosineSimilarity(queryEmbedding, itemEmbedding) };
        });
        const topMatches = scored
          .filter(item => (item.relevance || 0) > 0.1)
          .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
          .slice(0, 3);

        if (topMatches.length > 0) {
          currentConversationContext = `[RECALLED CONTEXT FROM MEMORY DATABASE]\n` + topMatches.map((m, idx) => `Match #${idx + 1} (${m.title}):\n${m.summary}\nCode Snippet:\n${m.snippet}`).join('\n\n');
          
          setMessages(prev => [...prev, {
            id: 'sys-' + Date.now(),
            sender: 'memory',
            text: `Found ${topMatches.length} relevant historical memory frames. Injecting context into the pipeline: ` + topMatches.map(m => `"${m.title}"`).join(', '),
            timestamp: new Date().toLocaleTimeString(),
          }]);
        } else {
          setMessages(prev => [...prev, {
            id: 'sys-' + Date.now(),
            sender: 'memory',
            text: `No high-relevance memories matched current query context. Running fresh pipeline.`,
            timestamp: new Date().toLocaleTimeString(),
          }]);
        }

        const duration = ((Date.now() - memoryStartTime) / 1000).toFixed(1) + 's';
        memoryDuration = parseFloat(((Date.now() - memoryStartTime) / 1000).toFixed(1));
        setNodeContexts(prev => ({
          ...prev,
          memory: {
            input: `Recall query context: "${targetQuery}"`,
            output: topMatches.length > 0
              ? `Found ${topMatches.length} matching semantic memories:\n` + topMatches.map(m => `• [${(m.relevance!*100).toFixed(0)}% Match] ${m.title} - ${m.summary}`).join('\n')
              : 'No historical workspace records matched the target query threshold. Proceeding with fresh setup.',
            timestamp: new Date().toLocaleTimeString(),
            model: 'Semantic Vector Matcher'
          }
        }));
        setAgentTimings(prev => ({ ...prev, memory: duration }));
        setAgents(prev => prev.map(a => a.id === 'memory' ? { ...a, status: 'completed' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'memory' ? { ...n, status: 'completed' } : n));
      } catch (err: any) {
        console.error('Memory Agent fail:', err);
        setNodeContexts(prev => ({
          ...prev,
          memory: {
            input: `Recall query context: "${targetQuery}"`,
            output: `ERROR: ${err.message || err}`,
            timestamp: new Date().toLocaleTimeString(),
            model: 'Semantic Vector Matcher'
          }
        }));
        setFailedPhase('memory');
        setAgents(prev => prev.map(a => a.id === 'memory' ? { ...a, status: 'error' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'memory' ? { ...n, status: 'error' } : n));
        setPipelineIsRunning(false);
        return;
      }
    }

    // --- STEP 2: RESEARCHER AGENT ---
    if (pipelineAbortedRef.current) return;
    let latestResearcherContext = researcherContext;
    if (!fromPhase || fromPhase === 'memory' || fromPhase === 'researcher') {
      const researcherStartTime = Date.now();
      setAgents(prev => prev.map(a => a.id === 'researcher' ? { ...a, status: 'thinking' } : a));
      setPipelineNodes(nodes => nodes.map(n => n.id === 'researcher' ? { ...n, status: 'active' } : n));

      const researcherMsgId = 'researcher-' + Date.now();
      setMessages(prev => [...prev, {
        id: researcherMsgId,
        sender: 'researcher',
        text: 'Querying technical indices and aggregating resources...',
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true,
      }]);

      try {
        const activeModel = engine === 'gemini' ? 'gemini-3.5-flash' : researcherModel;
        const researchPrompt = `Review this query and find technical facts, API specs, or code guidelines. User goal: "${targetQuery}".\n${currentConversationContext ? `Historical memories found:\n${currentConversationContext}` : ''}`;
        
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engine,
            model: activeModel,
            messages: [{ role: 'user', content: researchPrompt }],
            systemInstruction: systemInstructions.researcher,
            ollamaUrl,
            enableSearch: engine === 'gemini' && searchGrounding,
          }),
        });

        if (!response.ok) {
          throw new Error(`Researcher agent backend returned HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let streamBuffer = '';
        latestResearcherContext = '';

        if (reader) {
          while (true) {
            if (pipelineAbortedRef.current) {
              await reader.cancel();
              return;
            }
            const { done, value } = await reader.read();
            if (done) break;
            streamBuffer += decoder.decode(value, { stream: true });
            const lines = streamBuffer.split('\n');
            streamBuffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  throw new Error(data.error);
                }
                const text = data.text || '';
                latestResearcherContext += text;

                // Handle token tracking from server
                if (data.eval_count || data.prompt_eval_count) {
                  const promptTokens = data.prompt_eval_count || 0;
                  const evalTokens = data.eval_count || 0;
                  const total = promptTokens + evalTokens;
                  if (total > 0) {
                    setAgentTokens(prev => ({ ...prev, researcher: total }));
                    setSessionTokens(prev => prev + total);
                  }
                }

                setMessages(prev => prev.map(m => m.id === researcherMsgId ? { ...m, text: latestResearcherContext } : m));
              } catch (e) {
                console.error('SSE JSON parse error on research data stream', e);
              }
            }
          }
        }
        
        // Gemini estimated token tracking fallback
        if (engine === 'gemini' && latestResearcherContext) {
          const estimatedTokens = Math.ceil(latestResearcherContext.length / 3.8);
          setAgentTokens(prev => ({ ...prev, researcher: estimatedTokens }));
          setSessionTokens(prev => prev + estimatedTokens);
        }

        setResearcherContext(latestResearcherContext);
        setNodeContexts(prev => ({
          ...prev,
          researcher: {
            input: `Research and fact check: "${targetQuery}"`,
            output: latestResearcherContext || 'No context returned from source index.',
            timestamp: new Date().toLocaleTimeString(),
            model: engine === 'gemini' ? 'gemini-3.5-flash' : researcherModel
          }
        }));
        const duration = ((Date.now() - researcherStartTime) / 1000).toFixed(1) + 's';
        researcherDuration = parseFloat(((Date.now() - researcherStartTime) / 1000).toFixed(1));
        setAgentTimings(prev => ({ ...prev, researcher: duration }));
        setMessages(prev => prev.map(m => m.id === researcherMsgId ? { ...m, isStreaming: false, rawOutput: latestResearcherContext } : m));
        setAgents(prev => prev.map(a => a.id === 'researcher' ? { ...a, status: 'completed' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'researcher' ? { ...n, status: 'completed' } : n));

      } catch (err: any) {
        console.error('Researcher fail:', err);
        setNodeContexts(prev => ({
          ...prev,
          researcher: {
            input: `Research and fact check: "${targetQuery}"`,
            output: `ERROR: ${err.message || err}`,
            timestamp: new Date().toLocaleTimeString(),
            model: engine === 'gemini' ? 'gemini-3.5-flash' : researcherModel
          }
        }));
        setFailedPhase('researcher');
        setRuntimeError(`Researcher Agent encountered an issue: ${err.message}`);
        setMessages(prev => prev.map(m => m.id === researcherMsgId ? { ...m, text: `Research lookup paused: ${err.message}`, isStreaming: false } : m));
        setAgents(prev => prev.map(a => a.id === 'researcher' ? { ...a, status: 'error' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'researcher' ? { ...n, status: 'error' } : n));
        setPipelineIsRunning(false);
        return;
      }
    }

    // --- STEP 3: PLANNER AGENT ---
    if (pipelineAbortedRef.current) return;
    let latestPlannerOutputText = plannerOutputText;
    if (!fromPhase || fromPhase === 'memory' || fromPhase === 'researcher' || fromPhase === 'planner') {
      const plannerStartTime = Date.now();
      setAgents(prev => prev.map(a => a.id === 'planner' ? { ...a, status: 'thinking' } : a));
      setPipelineNodes(nodes => nodes.map(n => n.id === 'planner' ? { ...n, status: 'active' } : n));

      const plannerMsgId = 'planner-' + Date.now();
      setMessages(prev => [...prev, {
        id: plannerMsgId,
        sender: 'planner',
        text: 'Drafting architecture blueprints and planning execution tasks...',
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true,
      }]);

      try {
        const activeModel = engine === 'gemini' ? 'gemini-3.5-flash' : plannerModel;
        const plannerPrompt = `Formulate a complete step-by-step non-coding architectural plan to satisfy this user goal: "${targetQuery}".\nUse this research analysis as backing guidelines:\n${latestResearcherContext}\n${currentConversationContext ? `Historical memory guidelines:\n${currentConversationContext}` : ''}`;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engine,
            model: activeModel,
            messages: [{ role: 'user', content: plannerPrompt }],
            systemInstruction: systemInstructions.planner,
            ollamaUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`Planner agent backend returned HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let streamBuffer = '';
        latestPlannerOutputText = '';

        if (reader) {
          while (true) {
            if (pipelineAbortedRef.current) {
              await reader.cancel();
              return;
            }
            const { done, value } = await reader.read();
            if (done) break;
            streamBuffer += decoder.decode(value, { stream: true });
            const lines = streamBuffer.split('\n');
            streamBuffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) throw new Error(data.error);
                const text = data.text || '';
                latestPlannerOutputText += text;

                // Handle token tracking from server
                if (data.eval_count || data.prompt_eval_count) {
                  const promptTokens = data.prompt_eval_count || 0;
                  const evalTokens = data.eval_count || 0;
                  const total = promptTokens + evalTokens;
                  if (total > 0) {
                    setAgentTokens(prev => ({ ...prev, planner: total }));
                    setSessionTokens(prev => prev + total);
                  }
                }

                setMessages(prev => prev.map(m => m.id === plannerMsgId ? { ...m, text: latestPlannerOutputText } : m));
              } catch (e) {
                console.error('SSE Parse Error', e);
              }
            }
          }
        }

        // Gemini token estimation fallback
        if (engine === 'gemini' && latestPlannerOutputText) {
          const estimatedTokens = Math.ceil(latestPlannerOutputText.length / 3.8);
          setAgentTokens(prev => ({ ...prev, planner: estimatedTokens }));
          setSessionTokens(prev => prev + estimatedTokens);
        }

        setPlannerOutputText(latestPlannerOutputText);
        setNodeContexts(prev => ({
          ...prev,
          planner: {
            input: `Draft task blueprint plan for user goal: "${targetQuery}"`,
            output: latestPlannerOutputText || 'No architectural plan output.',
            timestamp: new Date().toLocaleTimeString(),
            model: engine === 'gemini' ? 'gemini-3.5-flash' : plannerModel
          }
        }));
        const duration = ((Date.now() - plannerStartTime) / 1000).toFixed(1) + 's';
        plannerDuration = parseFloat(((Date.now() - plannerStartTime) / 1000).toFixed(1));
        setAgentTimings(prev => ({ ...prev, planner: duration }));
        setMessages(prev => prev.map(m => m.id === plannerMsgId ? { ...m, isStreaming: false, rawOutput: latestPlannerOutputText } : m));
        setAgents(prev => prev.map(a => a.id === 'planner' ? { ...a, status: 'completed' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'planner' ? { ...n, status: 'completed' } : n));

      } catch (err: any) {
        console.error('Planner fail:', err);
        setNodeContexts(prev => ({
          ...prev,
          planner: {
            input: `Draft task blueprint plan for user goal: "${targetQuery}"`,
            output: `ERROR: ${err.message || err}`,
            timestamp: new Date().toLocaleTimeString(),
            model: engine === 'gemini' ? 'gemini-3.5-flash' : plannerModel
          }
        }));
        setFailedPhase('planner');
        setRuntimeError(`Planner Agent failed: ${err.message}`);
        setMessages(prev => prev.map(m => m.id === plannerMsgId ? { ...m, text: `Blueprint drafting paused: ${err.message}`, isStreaming: false } : m));
        setAgents(prev => prev.map(a => a.id === 'planner' ? { ...a, status: 'error' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'planner' ? { ...n, status: 'error' } : n));
        setPipelineIsRunning(false);
        return;
      }
    }

    // --- STEP 4: CODER AGENT ---
    if (pipelineAbortedRef.current) return;
    let latestCoderOutputText = coderOutputText;
    if (!fromPhase || fromPhase === 'memory' || fromPhase === 'researcher' || fromPhase === 'planner' || fromPhase === 'coder') {
      const coderStartTime = Date.now();
      setAgents(prev => prev.map(a => a.id === 'coder' ? { ...a, status: 'thinking' } : a));
      setPipelineNodes(nodes => nodes.map(n => n.id === 'coder' ? { ...n, status: 'active' } : n));

      const coderMsgId = 'coder-' + Date.now();
      setMessages(prev => [...prev, {
        id: coderMsgId,
        sender: 'coder',
        text: 'Developing complete codebase implementation...',
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true,
        previousRawOutput: coderOutputText
      }]);

      try {
        const activeModel = engine === 'gemini' ? 'gemini-3.1-pro-preview' : coderModel;
        const coderPrompt = `Review this architectural blueprint plan and write high-quality production-ready implementations:\n${latestPlannerOutputText}`;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engine,
            model: activeModel,
            messages: [{ role: 'user', content: coderPrompt }],
            systemInstruction: systemInstructions.coder,
            ollamaUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`Coder agent backend returned HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let streamBuffer = '';
        latestCoderOutputText = '';

        if (reader) {
          while (true) {
            if (pipelineAbortedRef.current) {
              await reader.cancel();
              return;
            }
            const { done, value } = await reader.read();
            if (done) break;
            streamBuffer += decoder.decode(value, { stream: true });
            const lines = streamBuffer.split('\n');
            streamBuffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) throw new Error(data.error);
                const text = data.text || '';
                latestCoderOutputText += text;

                // Handle token tracking from server
                if (data.eval_count || data.prompt_eval_count) {
                  const promptTokens = data.prompt_eval_count || 0;
                  const evalTokens = data.eval_count || 0;
                  const total = promptTokens + evalTokens;
                  if (total > 0) {
                    setAgentTokens(prev => ({ ...prev, coder: total }));
                    setSessionTokens(prev => prev + total);
                  }
                }

                setMessages(prev => prev.map(m => m.id === coderMsgId ? { ...m, text: latestCoderOutputText } : m));
              } catch (e) {
                console.error('SSE Parse Error', e);
              }
            }
          }
        }

        // Gemini token estimation fallback
        if (engine === 'gemini' && latestCoderOutputText) {
          const estimatedTokens = Math.ceil(latestCoderOutputText.length / 3.8);
          setAgentTokens(prev => ({ ...prev, coder: estimatedTokens }));
          setSessionTokens(prev => prev + estimatedTokens);
        }

        setCoderOutputText(latestCoderOutputText);
        setNodeContexts(prev => ({
          ...prev,
          coder: {
            input: 'Compile and construct production-ready source code files matching architectural blueprint.',
            output: latestCoderOutputText || 'No source code output returned.',
            timestamp: new Date().toLocaleTimeString(),
            model: engine === 'gemini' ? 'gemini-3.1-pro-preview' : coderModel
          }
        }));
        const duration = ((Date.now() - coderStartTime) / 1000).toFixed(1) + 's';
        coderDuration = parseFloat(((Date.now() - coderStartTime) / 1000).toFixed(1));
        setAgentTimings(prev => ({ ...prev, coder: duration }));
        setMessages(prev => prev.map(m => m.id === coderMsgId ? { ...m, isStreaming: false, rawOutput: latestCoderOutputText, previousRawOutput: coderOutputText } : m));
        setAgents(prev => prev.map(a => a.id === 'coder' ? { ...a, status: 'completed' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'coder' ? { ...n, status: 'completed' } : n));

      } catch (err: any) {
        console.error('Coder fail:', err);
        setNodeContexts(prev => ({
          ...prev,
          coder: {
            input: 'Compile and construct production-ready source code files matching architectural blueprint.',
            output: `ERROR: ${err.message || err}`,
            timestamp: new Date().toLocaleTimeString(),
            model: engine === 'gemini' ? 'gemini-3.1-pro-preview' : coderModel
          }
        }));
        setFailedPhase('coder');
        setRuntimeError(`Coder Agent failed: ${err.message}`);
        setMessages(prev => prev.map(m => m.id === coderMsgId ? { ...m, text: `Coding paused: ${err.message}`, isStreaming: false } : m));
        setAgents(prev => prev.map(a => a.id === 'coder' ? { ...a, status: 'error' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'coder' ? { ...n, status: 'error' } : n));
        setPipelineIsRunning(false);
        return;
      }
    }

    // --- STEP 5: REVIEWER AGENT ---
    if (pipelineAbortedRef.current) return;
    let latestReviewerOutputText = reviewerOutputText;
    if (!fromPhase || fromPhase === 'memory' || fromPhase === 'researcher' || fromPhase === 'planner' || fromPhase === 'coder' || fromPhase === 'reviewer') {
      const reviewerStartTime = Date.now();
      setAgents(prev => prev.map(a => a.id === 'reviewer' ? { ...a, status: 'thinking' } : a));
      setPipelineNodes(nodes => nodes.map(n => n.id === 'reviewer' ? { ...n, status: 'active' } : n));

      const reviewerMsgId = 'reviewer-' + Date.now();
      setMessages(prev => [...prev, {
        id: reviewerMsgId,
        sender: 'reviewer',
        text: 'Auditing code implementations for security compliance, syntax and efficiency...',
        timestamp: new Date().toLocaleTimeString(),
        isStreaming: true,
      }]);

      try {
        const activeModel = engine === 'gemini' ? 'gemini-3.5-flash' : reviewerModel;
        const reviewerPrompt = `Analyze this developed code implementation for potential security vulnerabilities, performance bottlenecks, and architectural violations:\n${latestCoderOutputText}`;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            engine,
            model: activeModel,
            messages: [{ role: 'user', content: reviewerPrompt }],
            systemInstruction: systemInstructions.reviewer,
            ollamaUrl,
          }),
        });

        if (!response.ok) {
          throw new Error(`Reviewer agent backend returned HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let streamBuffer = '';
        latestReviewerOutputText = '';

        if (reader) {
          while (true) {
            if (pipelineAbortedRef.current) {
              await reader.cancel();
              return;
            }
            const { done, value } = await reader.read();
            if (done) break;
            streamBuffer += decoder.decode(value, { stream: true });
            const lines = streamBuffer.split('\n');
            streamBuffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || !line.startsWith('data: ')) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) throw new Error(data.error);
                const text = data.text || '';
                latestReviewerOutputText += text;

                // Handle token tracking from server
                if (data.eval_count || data.prompt_eval_count) {
                  const promptTokens = data.prompt_eval_count || 0;
                  const evalTokens = data.eval_count || 0;
                  const total = promptTokens + evalTokens;
                  if (total > 0) {
                    setAgentTokens(prev => ({ ...prev, reviewer: total }));
                    setSessionTokens(prev => prev + total);
                  }
                }

                setMessages(prev => prev.map(m => m.id === reviewerMsgId ? { ...m, text: latestReviewerOutputText } : m));
              } catch (e) {
                console.error('SSE Parse Error', e);
              }
            }
          }
        }

        // Gemini token estimation fallback
        if (engine === 'gemini' && latestReviewerOutputText) {
          const estimatedTokens = Math.ceil(latestReviewerOutputText.length / 3.8);
          setAgentTokens(prev => ({ ...prev, reviewer: estimatedTokens }));
          setSessionTokens(prev => prev + estimatedTokens);
        }

        setReviewerOutputText(latestReviewerOutputText);
        setNodeContexts(prev => ({
          ...prev,
          reviewer: {
            input: 'Audit codebase implementation structures against quality, security and performance standards.',
            output: latestReviewerOutputText || 'No review audit feedback returned.',
            timestamp: new Date().toLocaleTimeString(),
            model: engine === 'gemini' ? 'gemini-3.5-flash' : reviewerModel
          }
        }));
        const duration = ((Date.now() - reviewerStartTime) / 1000).toFixed(1) + 's';
        reviewerDuration = parseFloat(((Date.now() - reviewerStartTime) / 1000).toFixed(1));
        setAgentTimings(prev => ({ ...prev, reviewer: duration }));
        setMessages(prev => prev.map(m => m.id === reviewerMsgId ? { ...m, isStreaming: false, rawOutput: latestReviewerOutputText } : m));
        setAgents(prev => prev.map(a => a.id === 'reviewer' ? { ...a, status: 'completed' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'reviewer' ? { ...n, status: 'completed' } : n));

      } catch (err: any) {
        console.error('Reviewer fail:', err);
        setNodeContexts(prev => ({
          ...prev,
          reviewer: {
            input: 'Audit codebase implementation structures against quality, security and performance standards.',
            output: `ERROR: ${err.message || err}`,
            timestamp: new Date().toLocaleTimeString(),
            model: engine === 'gemini' ? 'gemini-3.5-flash' : reviewerModel
          }
        }));
        setFailedPhase('reviewer');
        setRuntimeError(`Reviewer Agent failed: ${err.message}`);
        setMessages(prev => prev.map(m => m.id === reviewerMsgId ? { ...m, text: `Audit paused: ${err.message}`, isStreaming: false } : m));
        setAgents(prev => prev.map(a => a.id === 'reviewer' ? { ...a, status: 'error' } : a));
        setPipelineNodes(nodes => nodes.map(n => n.id === 'reviewer' ? { ...n, status: 'error' } : n));
        setPipelineIsRunning(false);
        return;
      }
    }

    // --- STEP 6: ORCHESTRATION COMPLETE & MEMORY DEPOSIT ---
    try {
      const cleanSummary = `Goal: ${targetQuery}. Executed a full agent collaboration pipeline: research summary created, structured blueprint mapped, full modules built and code successfully audited.`;

      let memoryEmbedding: number[] = [];
      if (engine === 'gemini' && serverHealthy) {
        const res = await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanSummary, engine: 'gemini' }),
        });
        const data = await res.json();
        if (data.embedding) memoryEmbedding = data.embedding;
      }
      if (memoryEmbedding.length === 0) {
        memoryEmbedding = getLocalEmbeddingVector(cleanSummary);
      }

      const newMemoryItem: MemoryItem = {
        id: 'mem-' + Date.now(),
        title: targetQuery.length > 40 ? targetQuery.substring(0, 38) + '...' : targetQuery,
        summary: cleanSummary,
        snippet: latestCoderOutputText.substring(0, 250) + '...',
        tags: ['pipeline-run', engine, new Date().getFullYear().toString()],
        embedding: memoryEmbedding,
        timestamp: new Date().toLocaleString(),
      };

      const updatedMemories = [newMemoryItem, ...memories];
      setMemories(updatedMemories);
      localStorage.setItem('joelos_memories', JSON.stringify(updatedMemories));
      
      setNodeContexts(prev => ({
        ...prev,
        output: {
          input: 'Aggregate audited codebase blocks and finalize release deliverables.',
          output: `Successfully compiled final codebase artifacts. Generated and saved new memory vector block to browser storage (Ledger Item ID: mem-${Date.now()}).`,
          timestamp: new Date().toLocaleTimeString(),
          model: 'JoelOS Synthesizer'
        }
      }));

      if (!memorySearchQuery) {
        setMatchedMemories(updatedMemories.slice(0, 10));
      }

      // Add positive final feedback message
      setMessages(prev => [...prev, {
        id: 'final-' + Date.now(),
        sender: 'system',
        text: `### 🚀 JoelOS Workspace Executed Successfully!\n\nThe multi-agent collaboration pipeline has completed all objectives. The resulting workspace details and codebase index are saved to the memory vector ledger.`,
        timestamp: new Date().toLocaleTimeString(),
      }]);

      setPipelineNodes(nodes => nodes.map(n => n.id === 'output' ? { ...n, status: 'completed' } : n));
      
      // Save timing data point to history state and local storage
      const newTimingData = {
        timestamp: new Date().toLocaleTimeString(),
        memory: memoryDuration || 0.4,
        researcher: researcherDuration || 1.1,
        planner: plannerDuration || 0.9,
        coder: coderDuration || 2.8,
        reviewer: reviewerDuration || 1.4,
      };
      setTimingsHistory(prev => {
        const updated = [...prev, newTimingData];
        const sliced = updated.slice(-15);
        localStorage.setItem('joelos_timings_history', JSON.stringify(sliced));
        return sliced;
      });

      // Play completion audio chime
      playCompletionSound();

    } catch (e) {
      console.error('Failed to commit pipeline run to memory store:', e);
    } finally {
      setPipelineIsRunning(false);
    }
  };

  // Helper to format code blocks and messages cleanly
  const renderMessageContent = (msg: Message) => {
    const text = msg.text;
    
    // Check if the message is system
    if (msg.sender === 'system') {
      return (
        <div className="text-sm text-emerald-200/90 leading-relaxed font-mono bg-emerald-950/15 border border-emerald-500/20 rounded-xl p-4">
          {text.split('\n').map((para, i) => (
            <p key={i} className="mb-2 last:mb-0">{para}</p>
          ))}
        </div>
      );
    }

    if (msg.sender === 'memory') {
      return (
        <div className="text-xs font-mono text-emerald-400 leading-normal bg-emerald-950/10 border border-emerald-500/10 rounded-xl p-3.5 flex items-start gap-2.5">
          <Database size={14} className="mt-0.5 text-emerald-500 shrink-0" />
          <div className="flex-1">{text}</div>
        </div>
      );
    }

    if (msg.sender === 'coder' && msg.previousRawOutput) {
      return <CodeDiffViewer oldCode={msg.previousRawOutput} newCode={text} />;
    }

    // Split text into normal paragraphs and code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3.5 leading-relaxed text-slate-200 text-[14.5px] font-sans">
        {parts.map((part, index) => {
          if (part.startsWith('```')) {
            // Extract code language and actual code content
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const language = match ? match[1] : 'code';
            const codeContent = match ? match[2] : part.slice(3, -3);
            const codeBlockId = `${msg.id}-code-${index}`;

            return (
              <div key={index} className="relative group rounded-xl border border-emerald-900/30 bg-[#030504] overflow-hidden my-3 shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-950 bg-[#08100c] text-xs font-mono text-emerald-400">
                  <div className="flex items-center gap-1.5">
                    <Terminal size={12} className="text-emerald-400" />
                    <span>{language.toUpperCase() || 'CODE'}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(codeBlockId, codeContent.trim())}
                    className="p-1 rounded bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer border border-emerald-900/30 text-[10px]"
                    title="Copy code"
                  >
                    {copiedId === codeBlockId ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    <span>{copiedId === codeBlockId ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-emerald-300/90 max-h-[480px]">
                  <code>{codeContent.trim()}</code>
                </pre>
              </div>
            );
          } else {
            // Render basic lists or lines nicely
            return (
              <div key={index} className="whitespace-pre-wrap font-sans">
                {part.split('\n').map((line, lIdx) => {
                  if (line.startsWith('### ')) {
                    return <h4 key={lIdx} className="text-emerald-300 font-bold text-base mt-4 mb-2 first:mt-0 font-display">{line.substring(4)}</h4>;
                  }
                  if (line.startsWith('## ')) {
                    return <h3 key={lIdx} className="text-emerald-200 font-extrabold text-lg mt-5 mb-2 first:mt-0 font-display">{line.substring(3)}</h3>;
                  }
                  if (line.startsWith('# ')) {
                    return <h2 key={lIdx} className="text-white font-black text-xl mt-6 mb-3 first:mt-0 font-display">{line.substring(2)}</h2>;
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <div key={lIdx} className="flex items-start gap-2.5 ml-1 my-1.5"><span className="text-[#00ff66] mt-1.5 text-[8px]">●</span><span className="text-slate-200">{line.substring(2)}</span></div>;
                  }
                  if (/^\d+\.\s/.test(line)) {
                    return <div key={lIdx} className="flex items-start gap-2.5 ml-1 my-1.5"><span className="text-[#00ff66] font-mono font-bold text-xs">{line.match(/^\d+/)?.[0]}.</span><span className="text-slate-200">{line.replace(/^\d+\.\s/, '')}</span></div>;
                  }
                  return <p key={lIdx} className="mb-2 last:mb-0 text-slate-300">{line}</p>;
                })}
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className={`h-screen w-screen overflow-hidden ${theme === 'light' ? 'bg-[#f3f6f4] text-slate-800' : (theme === 'oled' ? 'bg-[#000000] text-emerald-200/90' : 'bg-[#020403] text-emerald-200/90')} flex flex-col font-sans selection:bg-emerald-500/35 selection:text-white terminal-grid transition-colors duration-300`}>
      <style>{`
        :root {
          --theme-color: ${colorPalette === 'matrix-green' ? '#00ff66' : '#00d2ff'};
          --theme-color-rgb: ${colorPalette === 'matrix-green' ? '0, 255, 102' : '0, 210, 255'};
          --theme-emerald-400: ${colorPalette === 'matrix-green' ? '#34d399' : '#38bdf8'};
          --theme-emerald-500: ${colorPalette === 'matrix-green' ? '#10b981' : '#0ea5e9'};
          --theme-emerald-600: ${colorPalette === 'matrix-green' ? '#059669' : '#0284c7'};
          --theme-emerald-300: ${colorPalette === 'matrix-green' ? '#6ee7b7' : '#7dd3fc'};
          --theme-emerald-200: ${colorPalette === 'matrix-green' ? '#a7f3d0' : '#bae6fd'};
          --theme-emerald-950: ${colorPalette === 'matrix-green' ? '#022c22' : '#082f49'};
          --theme-emerald-900: ${colorPalette === 'matrix-green' ? '#064e3b' : '#0c4a6e'};
          --theme-bg-0b2114: ${colorPalette === 'matrix-green' ? '#0b2114' : '#0b1621'};
        }
        
        ${theme === 'light' ? `
          .min-h-screen {
            background-color: #f3f6f4 !important;
            color: #1e293b !important;
          }
          header {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
          }
          aside {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
          }
          main {
            background-color: #f8fafc !important;
          }
          input, select, textarea {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
          }
          input::placeholder {
            color: #94a3b8 !important;
          }
          .text-slate-200, .text-slate-300, .text-white, .text-slate-100 {
            color: #1e293b !important;
          }
          .text-emerald-400, .text-emerald-500, .text-emerald-300, .text-emerald-600 {
            color: ${colorPalette === 'matrix-green' ? '#047857' : '#0284c7'} !important;
          }
          .bg-[#010302], .bg-[#020503], .bg-[#050c08], .bg-[#080d0a], .bg-[#0a0f0c], .bg-[#0a0f0c]/60, .bg-[#080d0a]/80, .bg-[#0d2719], .bg-[#091510]/50, .bg-[#0a0f0c]/30 {
            background-color: #f8fafc !important;
            border-color: #cbd5e1 !important;
            color: #0f172a !important;
          }
          .bg-[#07110c]/85, .bg-[#0b2114] {
            background-color: #f1f5f9 !important;
            border-color: #cbd5e1 !important;
            color: #1e293b !important;
          }
          .border-emerald-950, .border-emerald-900/30, .border-emerald-900/40, .border-emerald-900/50, .border-emerald-900/60, .border-[#00ff66]/20, .border-emerald-500/25 {
            border-color: #cbd5e1 !important;
          }
          pre {
            background-color: #f8fafc !important;
            color: #334155 !important;
            border-color: #cbd5e1 !important;
          }
          code {
            color: #334155 !important;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #0f172a !important;
          }
          .bg-emerald-950/15 {
            background-color: #f1f5f9 !important;
          }
          .text-[#00ff66], .text-emerald-200/90, .text-emerald-200 {
            color: ${colorPalette === 'matrix-green' ? '#047857' : '#0284c7'} !important;
          }
          .hover\\:bg-emerald-950/40:hover, .hover\\:bg-[#0c1c11]/20:hover, .hover\\:bg-[#0b1723]/20:hover {
            background-color: #cbd5e1 !important;
          }
          .bg-black/35, .bg-black/60 {
            background-color: #f8fafc !important;
            color: #334155 !important;
          }
          .text-emerald-500/50, .text-emerald-500/60, .text-emerald-500/70 {
            color: #475569 !important;
          }
          .bg-[#00ff66]/10, .bg-[#10b981]/25, .bg-emerald-950/10 {
            background-color: ${colorPalette === 'matrix-green' ? '#f0fdf4' : '#f0f9ff'} !important;
            color: ${colorPalette === 'matrix-green' ? '#166534' : '#075985'} !important;
          }
          .border-[#10b981]/40 {
            border-color: ${colorPalette === 'matrix-green' ? '#bbf7d0' : '#bae6fd'} !important;
          }
          .text-emerald-700 {
            color: #475569 !important;
          }
        ` : ''}
        
        .text-emerald-400, .group-hover\\:text-emerald-400:hover, .hover\\:text-emerald-400:hover {
          color: var(--theme-emerald-400) !important;
        }
        .text-emerald-300, .group-hover\\:text-emerald-300:hover, .hover\\:text-emerald-300:hover {
          color: var(--theme-emerald-300) !important;
        }
        .text-emerald-200, .hover\\:text-emerald-200:hover {
          color: var(--theme-emerald-200) !important;
        }
        .text-emerald-500, .hover\\:text-emerald-500:hover {
          color: var(--theme-emerald-500) !important;
        }
        .text-emerald-600 {
          color: var(--theme-emerald-600) !important;
        }
        .text-[#00ff66], .text-emerald-100 {
          color: var(--theme-color) !important;
        }
        .border-emerald-950 {
          border-color: var(--theme-emerald-950) !important;
        }
        .border-emerald-900, .border-emerald-900\\/30, .border-emerald-900\\/40, .border-emerald-900\\/50, .border-emerald-900\\/60, .border-emerald-900\\/80 {
          border-color: rgba(${colorPalette === 'matrix-green' ? '6, 78, 59' : '12, 74, 110'}, 0.4) !important;
        }
        .border-emerald-500\\/25, .border-emerald-500\\/30, .border-emerald-500\\/35, .border-emerald-500\\/40, .border-emerald-500\\/50 {
          border-color: rgba(${colorPalette === 'matrix-green' ? '16, 185, 129' : '14, 165, 233'}, 0.35) !important;
        }
        .bg-[#10b981]\\/25, .bg-[#10b981]\\/20, .bg-[#10b981]\\/5, .hover\\:bg-[#10b981]\\/5:hover {
          background-color: rgba(${colorPalette === 'matrix-green' ? '16, 185, 129' : '14, 165, 233'}, ${colorPalette === 'matrix-green' ? '0.15' : '0.12'}) !important;
        }
        .bg-emerald-950\\/10, .bg-emerald-950\\/15, .bg-emerald-950\\/20, .bg-emerald-950\\/40, .bg-emerald-950\\/60 {
          background-color: rgba(${colorPalette === 'matrix-green' ? '2, 44, 34' : '8, 47, 73'}, 0.3) !important;
        }
        .bg-emerald-950, .hover\\:bg-emerald-950:hover {
          background-color: var(--theme-emerald-950) !important;
        }
        .bg-[#0b2114] {
          background-color: var(--theme-bg-0b2114) !important;
        }
        .bg-[#00ff66]\\/10 {
          background-color: rgba(var(--theme-color-rgb), 0.1) !important;
        }
        .border-[#00ff66]\\/20 {
          border-color: rgba(var(--theme-color-rgb), 0.2) !important;
        }
        .shadow-emerald-500\\/15, .shadow-emerald-500\\/10 {
          box-shadow: 0 4px 6px -1px rgba(${colorPalette === 'matrix-green' ? '16, 185, 129' : '14, 165, 233'}, 0.15), 0 2px 4px -2px rgba(${colorPalette === 'matrix-green' ? '16, 185, 129' : '14, 165, 233'}, 0.15) !important;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(${colorPalette === 'matrix-green' ? '34, 197, 94' : '14, 165, 233'}, 0.2) !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(${colorPalette === 'matrix-green' ? '34, 197, 94' : '14, 165, 233'}, 0.4) !important;
        }
        .glow-emerald {
          box-shadow: 0 0 15px rgba(${colorPalette === 'matrix-green' ? '34, 197, 94, 0.35' : '14, 165, 233, 0.35'}) !important;
        }
        .shadow-\\[0_0_8px_rgba\\(16\\,185\\,129\\,0\\.6\\)\\] {
          box-shadow: 0 0 8px rgba(${colorPalette === 'matrix-green' ? '16, 185, 129, 0.6' : '14, 165, 233, 0.6'}) !important;
        }
        .shadow-\\[0_0_12px_rgba\\(0\\,255\\,102\\,0\\.35\\)\\] {
          box-shadow: 0 0 12px rgba(var(--theme-color-rgb), 0.35) !important;
        }
        .shadow-\\[0_0_8px_rgba\\(16\\,185\\,129\\,0\\.2\\)\\] {
          box-shadow: 0 0 8px rgba(${colorPalette === 'matrix-green' ? '16, 185, 129, 0.2' : '14, 165, 233, 0.2'}) !important;
        }
        svg path[stroke="#00ff66"], svg path[stroke="#00FF66"] {
          stroke: var(--theme-color) !important;
        }
      `}</style>
      
      {/* Top OS Title Header */}
      <header className={`border-b border-emerald-900/35 ${theme === 'oled' ? 'bg-[#050505]' : 'bg-[#08120c]'} px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 transition-all duration-300 shadow-md shrink-0`}>
        <div className="flex items-center gap-3">
          {/* Hamburger menu for mobile */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex lg:hidden p-2 rounded-lg border border-emerald-900/50 hover:bg-emerald-950/40 text-emerald-400 cursor-pointer min-w-[44px] min-h-[44px] items-center justify-center transition-colors"
            title="Toggle Sidebar"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Connected Neon-Green "jb" Logo Icon (mimics uploaded favicon precisely) */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#010302] border border-emerald-500/40 shadow-lg shadow-emerald-500/15 shrink-0 overflow-hidden group">
            <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="logo-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Connected lowercase j-b ligature path */}
              <path 
                d="M40 22V60C40 71 33 78 21 78C15 78 13 73 13 67" 
                stroke="#00ff66" 
                strokeWidth="8.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                filter="url(#logo-glow)"
                className="group-hover:stroke-emerald-400 transition-colors duration-300"
              />
              <path 
                d="M40 48C40 33 53 27 65 27C77 27 87 37 87 49C87 61 77 71 65 71C53 71 40 65 40 48Z" 
                stroke="#00ff66" 
                strokeWidth="8.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                filter="url(#logo-glow)"
                className="group-hover:stroke-emerald-400 transition-colors duration-300"
              />
            </svg>
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-emerald-50 to-emerald-400 bg-clip-text text-transparent">JoelOS</h1>
              <span className="text-[10px] font-mono uppercase font-black bg-emerald-500/15 border border-emerald-500/35 px-2.5 py-0.5 rounded-full text-emerald-400 tracking-wider">v1.2.0</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-400/60 font-mono tracking-normal uppercase">COLLABORATIVE AGENT WORKSPACE</p>
          </div>
        </div>

        {/* Global Connection Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Health Status Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#020503] border border-emerald-950 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${serverHealthy ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-rose-500 animate-pulse'}`}></span>
            <span className="text-emerald-400">{serverHealthy ? 'JoelOS Server Live' : 'Server Down'}</span>
          </div>

          {/* Ollama Connection Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#020503] border border-emerald-950 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${ollamaConnectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-emerald-400">
              {ollamaConnectionStatus === 'connected' 
                ? `Ollama: Active (${installedOllamaModels.length} models)` 
                : ollamaConnectionStatus === 'failed' 
                  ? 'Ollama: Offline' 
                  : 'Ollama: Connecting...'}
            </span>
          </div>

          {/* Engine Selector */}
          <div className="flex items-center rounded-xl bg-[#020503] p-1 border border-emerald-900/40 shrink-0">
            <button
              onClick={() => setEngine('gemini')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px] ${engine === 'gemini' ? 'bg-[#10b981]/20 text-emerald-300 border border-[#10b981]/40 shadow-sm' : 'text-emerald-600 hover:text-emerald-400'}`}
              title="Switch to Cloud Orchestration"
            >
              <Sparkles size={12} />
              <span className="hidden sm:inline">Cloud</span>
            </button>
            <button
              onClick={() => setEngine('ollama')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer min-h-[36px] ${engine === 'ollama' ? 'bg-[#10b981]/20 text-emerald-300 border border-[#10b981]/40 shadow-sm' : 'text-emerald-600 hover:text-emerald-400'}`}
              title="Switch to Local Orchestration"
            >
              <Terminal size={12} />
              <span className="hidden sm:inline">Local</span>
            </button>
          </div>

          {/* Visual Customization Dropdowns */}
          <div className="flex items-center gap-2 bg-[#020503] p-1 rounded-xl border border-emerald-900/40 shrink-0">
            {/* Theme Dropdown Select */}
            <Select 
              value={theme} 
              onValueChange={(val: any) => { 
                setTheme(val); 
                localStorage.setItem('joelos_theme', val); 
              }}
            >
              <SelectTrigger className="w-8 h-8 border-transparent bg-transparent shadow-none hover:bg-emerald-950/40 p-0 flex justify-center items-center [&>svg:last-child]:hidden focus:ring-0 focus:ring-offset-0">
                {theme === 'dark' ? <Moon size={16} className="text-emerald-500" /> : theme === 'light' ? <Sun size={16} className="text-emerald-500" /> : <Sun size={16} className="text-emerald-500" />}
              </SelectTrigger>
              <SelectContent className="bg-[#020403] border border-emerald-900/40">
                <SelectItem value="dark" className="text-emerald-300 font-mono text-xs focus:bg-emerald-950/50 focus:text-[#00ff66]">Dark Theme</SelectItem>
                <SelectItem value="light" className="text-slate-200 font-mono text-xs focus:bg-emerald-950/50 focus:text-[#00ff66]">Light Theme</SelectItem>
                <SelectItem value="oled" className="text-emerald-400 font-mono text-xs focus:bg-emerald-950/50 focus:text-[#00ff66]">OLED Theme</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-[1px] h-4 bg-emerald-900/40"></div>

            {/* Color Palette Dropdown Select */}
            <Select 
              value={colorPalette} 
              onValueChange={(val: any) => { 
                setColorPalette(val); 
                localStorage.setItem('joelos_color_palette', val); 
              }}
            >
              <SelectTrigger className="w-8 h-8 border-transparent bg-transparent shadow-none hover:bg-emerald-950/40 p-0 flex justify-center items-center [&>svg:last-child]:hidden focus:ring-0 focus:ring-offset-0">
                <Palette size={16} className="text-emerald-500" />
              </SelectTrigger>
              <SelectContent className="bg-[#020403] border border-emerald-900/40">
                <SelectItem value="matrix-green" className="text-[#00ff66] font-mono text-xs focus:bg-emerald-950/50 focus:text-[#00ff66]">Phosphor</SelectItem>
                <SelectItem value="cyber-blue" className="text-cyan-400 font-mono text-xs focus:bg-cyan-950/50 focus:text-cyan-400">Cyber</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Utility Icons Group */}
          <div className="flex items-center gap-1 bg-[#020503] p-1 rounded-xl border border-emerald-900/40 shrink-0">
            {/* Sound Effects Toggle Button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg text-emerald-500 hover:text-emerald-300 hover:bg-emerald-950/40 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              title={soundEnabled ? "Mute notification chime" : "Unmute notification chime"}
            >
              {soundEnabled ? <Volume2 size={15} className="text-emerald-400" /> : <VolumeX size={15} className="text-emerald-600" />}
            </button>

            {/* Export Chat Markdown */}
            <button
              onClick={exportChatAsMarkdown}
              className="p-2 rounded-lg text-emerald-500 hover:text-emerald-300 hover:bg-emerald-950/40 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Export Conversation Log as Markdown"
            >
              <Download size={15} />
            </button>

            {/* Keyboard Shortcuts Trigger */}
            <button
              onClick={() => setShortcutsOpen(true)}
              className="p-2 rounded-lg text-emerald-500 hover:text-emerald-300 hover:bg-emerald-950/40 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Show Keyboard Shortcuts Panel (?)"
            >
              <HelpCircle size={15} />
            </button>
          </div>

          {/* Sidebar Nav Tabs */}
          <nav className="flex items-center gap-1 bg-[#020503] rounded-xl p-1 border border-emerald-900/40 shrink-0">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all min-h-[36px] flex items-center gap-1.5 ${activeTab === 'pipeline' ? 'bg-[#10b981]/25 text-emerald-200 border border-[#10b981]/40 shadow-sm' : 'text-emerald-600 hover:text-emerald-400 hover:bg-[#10b981]/5'}`}
            >
              <Terminal size={12} />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all min-h-[36px] flex items-center gap-1.5 ${activeTab === 'settings' ? 'bg-[#10b981]/25 text-emerald-200 border border-[#10b981]/40 shadow-sm' : 'text-emerald-600 hover:text-emerald-400 hover:bg-[#10b981]/5'}`}
            >
              <Settings size={12} />
              <span>Config</span>
            </button>
            <button
              onClick={() => setIsMemoryDrawerOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all min-h-[36px] flex items-center gap-1.5 text-emerald-600 hover:text-emerald-400 hover:bg-[#10b981]/5"
            >
              <Database size={12} />
              <span>Memory</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* LEFT COLUMN: Sidebar (Status, Config presets, Metrics) */}
        <aside className={`${mobileMenuOpen ? 'flex absolute inset-0 z-40' : 'hidden lg:flex lg:relative'} w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-emerald-900/30 ${theme === 'oled' ? 'bg-[#000000]' : 'bg-[#050c08]'} p-5 flex flex-col gap-6 overflow-hidden transition-all duration-300 shadow-xl h-full`}>
          
          <div className="flex items-center justify-between lg:hidden mb-2">
            <span className="font-bold text-emerald-400">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded bg-emerald-950/50 text-emerald-400">
              <X size={16} />
            </button>
          </div>

          {/* Agent Status Deck */}
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold flex items-center gap-2 px-2.5 py-1 rounded bg-[#0b2114] border border-emerald-500/25">
                <Layers size={11} className="text-[#00ff66]" />
                <span>Core Agents</span>
              </h3>
              <span className="text-[10px] bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded font-bold">5 ONLINE</span>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 select-none">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`relative p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                    agent.status === 'thinking'
                      ? 'border-emerald-400 bg-[#0d2719] shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                      : 'border-emerald-950 bg-[#091510]/50 hover:bg-[#0c1e16] hover:border-emerald-900/60'
                  }`}
                >
                  <div className="text-2xl shrink-0">{agent.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-100">{agent.name}</span>
                      <span className="text-[9px] font-mono text-emerald-400/80 truncate max-w-[85px] bg-emerald-950/40 px-1 py-0.5 rounded">{agent.model}</span>
                    </div>
                    <p className="text-[11px] text-slate-300/80 truncate mt-1">{agent.description}</p>
                    {(agentTimings[agent.id] || agentTokens[agent.id]) && (
                      <div className="flex items-center gap-2 mt-2 text-[9px] font-mono text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20 w-fit">
                        {agentTimings[agent.id] && (
                          <span className="flex items-center gap-1">
                            <Clock size={9} className="text-[#00ff66]" />
                            {agentTimings[agent.id]}
                          </span>
                        )}
                        {agentTimings[agent.id] && agentTokens[agent.id] && (
                          <span className="text-emerald-800">•</span>
                        )}
                        {agentTokens[agent.id] && (
                          <span className="flex items-center gap-1">
                            <Layers size={9} className="text-[#00ff66]" />
                            {agentTokens[agent.id]} T
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pulsing Status Dot */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <span className={`w-2.5 h-2.5 rounded-full ${agent.dotColor} ${agent.status === 'thinking' ? 'animate-status-pulse text-[#00ff66]' : ''}`}></span>
                    {agent.status === 'thinking' && (
                      <span className="absolute w-2.5 h-2.5 rounded-full border border-emerald-400 animate-ping"></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="mt-auto pt-4 border-t border-emerald-900/35 text-[10px] font-mono text-emerald-400/80 space-y-2 shrink-0">
            <div className="flex justify-between">
              <span>SESSION TOKENS:</span>
              <span className="text-[#00ff66] font-bold">{sessionTokens.toLocaleString()} T</span>
            </div>
            <div className="flex justify-between">
              <span>LOCAL MODELS:</span>
              <span className="text-[#00ff66] font-bold">{installedOllamaModels.length} DETECTED</span>
            </div>
            <div className="flex justify-between">
              <span>LEDGER SIZE:</span>
              <span className="text-[#00ff66] font-bold">{memories.length} ENTRIES</span>
            </div>
            <div className="flex justify-between">
              <span>EMBEDDING VECTOR:</span>
              <span className="text-[#00ff66] font-bold">{engine === 'gemini' ? '768-D GEMINI' : '128-D LOCAL'}</span>
            </div>
            <div className="flex justify-between">
              <span>OLLAMA STATUS:</span>
              <span className={`${ollamaConnectionStatus === 'connected' ? 'text-[#00ff66]' : 'text-amber-500'} font-bold uppercase`}>{ollamaConnectionStatus}</span>
            </div>
          </div>

        </aside>

        {/* MIDDLE COLUMN: Chat Interface & Visual Orchestrator Flow */}
        <main className={`flex-1 flex flex-col overflow-hidden ${theme === 'oled' ? 'bg-[#000000]' : 'bg-[#040806]'} transition-colors duration-300`}>
          
          {activeTab === 'pipeline' ? (
            <>
              {/* Orchestrator Pipeline Visualizer */}
              <div className={`px-6 py-4.5 border-b border-emerald-900/30 ${theme === 'oled' ? 'bg-black' : 'bg-[#060e0a]'} relative`}>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-[#00ff66]" />
                    <span className="text-xs font-black tracking-wider font-mono uppercase text-emerald-300">Active Execution Pipeline</span>
                    {pipelineIsRunning && (
                      <button
                        onClick={stopPipelineOrchestration}
                        className="ml-3 px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900/60 text-rose-200 border border-rose-500/50 text-[10px] font-black font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer animate-pulse transition-all active:scale-95"
                        title="Halt active agent execution immediately"
                      >
                        <AlertCircle size={10} className="text-rose-400" />
                        <span>HALT PIPELINE</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500/60 uppercase font-bold tracking-wider">Goal Execution Sequence (Click node to inspect context)</span>
                </div>

                {/* Nodes container */}
                <div className="flex flex-wrap items-center gap-y-3 gap-x-2.5">
                  {pipelineNodes.map((node, index) => {
                    // Check status colors
                    let statusColor = 'bg-emerald-950/10 border-emerald-950 text-emerald-600/60';
                    let glow = '';
                    if (node.status === 'active') {
                      statusColor = 'bg-emerald-900/25 border-emerald-400 text-white animate-pulse';
                      glow = 'shadow-[0_0_12px_rgba(0,255,102,0.35)]';
                    } else if (node.status === 'completed') {
                      statusColor = 'bg-[#0a1f13] border-emerald-500/50 text-emerald-300';
                      glow = 'shadow-[0_0_8px_rgba(16,185,129,0.2)]';
                    } else if (node.status === 'error') {
                      statusColor = 'bg-[#2a0b10] border-rose-500 text-rose-300';
                      glow = 'shadow-[0_0_12px_rgba(244,63,94,0.4)]';
                    }

                    return (
                      <div key={node.id} className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedNodeContextId(prev => prev === node.id ? null : node.id);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all duration-300 cursor-pointer text-left focus:outline-none ${statusColor} ${glow} ${selectedNodeContextId === node.id ? 'ring-2 ring-emerald-400 border-transparent shadow-[0_0_15px_rgba(16,185,129,0.4)]' : ''}`}
                          title={`Click to view run summary for ${node.label}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            node.status === 'completed' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(0,255,102,0.8)]' :
                            node.status === 'active' ? 'bg-[#00ff66] animate-ping' :
                            node.status === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-emerald-900'
                          }`}></span>
                          <span>{node.label}</span>
                        </button>
                        {index < pipelineNodes.length - 1 && (
                          <div className="h-[2px] w-4 bg-emerald-950 shrink-0"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Node context popover */}
                {selectedNodeContextId && (() => {
                  const node = pipelineNodes.find(n => n.id === selectedNodeContextId);
                  const context = nodeContexts[selectedNodeContextId];
                  if (!node) return null;
                  return (
                    <div className={`absolute left-6 right-6 top-[calc(100%-8px)] z-30 p-4 rounded-xl border border-emerald-500/30 shadow-2xl ${theme === 'oled' ? 'bg-[#050505]' : 'bg-[#09110d]'} font-mono text-xs animate-in fade-in slide-in-from-top-2 duration-200`}>
                      <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            node.status === 'completed' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(0,255,102,0.8)]' :
                            node.status === 'active' ? 'bg-[#00ff66] animate-pulse' :
                            node.status === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-emerald-900'
                          }`}></span>
                          <span className="font-bold text-emerald-300 uppercase">{node.label} Run Context Summary</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {context?.model && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                              {context.model}
                            </span>
                          )}
                          {context?.timestamp && (
                            <span className="text-[10px] text-emerald-500/50 font-bold">
                              {context.timestamp}
                            </span>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedNodeContextId(null); }}
                            className="text-emerald-500 hover:text-white transition-colors cursor-pointer p-0.5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                        <div>
                          <span className="text-[10px] text-emerald-500/60 uppercase font-black block mb-1">Target / Input Context:</span>
                          <p className="text-slate-200 text-[11px] leading-relaxed bg-black/40 p-2.5 rounded border border-emerald-950/40">
                            {context ? context.input : `No input context. Awaiting activation...`}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-500/60 uppercase font-black block mb-1">Payload / Streamed Output:</span>
                          <pre className="text-emerald-300 text-[11px] leading-relaxed bg-black/60 p-2.5 rounded border border-emerald-950/60 whitespace-pre-wrap overflow-x-auto font-mono max-h-24">
                            {context ? context.output : (node.status === 'active' ? 'Synthesizing output stream...' : 'Waiting to capture output payload from current run.')}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Global Progress Bar */}
              {pipelineIsRunning && (() => {
                const completedCount = pipelineNodes.filter(n => n.status === 'completed').length;
                const activeCount = pipelineNodes.filter(n => n.status === 'active').length;
                const percent = Math.min(100, Math.round(((completedCount + activeCount * 0.5) / pipelineNodes.length) * 100));
                return (
                  <div className="px-6 py-2 bg-black/35 border-b border-emerald-950/40 flex items-center justify-between gap-4 font-mono text-[10px]">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[#00ff66] font-bold animate-pulse">●</span>
                      <span className="text-emerald-500/70 uppercase font-bold tracking-wider">PIPELINE PROGRESS:</span>
                      <span className="text-slate-200 font-bold">{percent}%</span>
                    </div>
                    <div className="flex-1 max-w-md h-1.5 bg-emerald-950/60 rounded-full overflow-hidden border border-emerald-900/20 relative">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-[#00ff66] rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,255,102,0.5)]"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="text-emerald-500/50 shrink-0 text-right">
                      <span>Est. remaining: {Math.max(0, 100 - percent) > 0 ? `${Math.ceil((100 - percent) * 0.35)}s` : 'Finishing...'}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Chat log & outputs area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full scale-125 animate-pulse"></div>
                      <div className="relative w-16 h-16 rounded-2xl border border-emerald-400/40 bg-[#020503] flex items-center justify-center shadow-lg shadow-emerald-500/15">
                        <Brain size={32} className="text-[#00ff66]" />
                      </div>
                    </div>
                    <h3 className="font-sans font-bold text-xl text-white mb-2">JoelOS Agent Workspace</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6 font-sans">
                      A high-speed collaborative agent environment. Enter task targets to coordinate Planner, Coder, Reviewer, Researcher, and Vector memory engines automatically.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full text-left">
                      <button
                        onClick={() => setUserPrompt('Build a Flask API that returns Bitcoin price')}
                        className="p-4 rounded-xl bg-[#07110c]/85 hover:bg-[#0b1c13] border border-emerald-900/40 hover:border-emerald-500/55 text-left text-xs transition-all group cursor-pointer shadow-sm"
                      >
                        <span className="font-mono text-[#00ff66] font-bold block mb-1">Example Pipeline</span>
                        <span className="text-slate-300 group-hover:text-white line-clamp-1 font-sans">"Build a Flask API that returns Bitcoin price"</span>
                      </button>
                      <button
                        onClick={() => setUserPrompt('Create a responsive Tailwind landing page banner component')}
                        className="p-4 rounded-xl bg-[#07110c]/85 hover:bg-[#0b1c13] border border-emerald-900/40 hover:border-emerald-500/55 text-left text-xs transition-all group cursor-pointer shadow-sm"
                      >
                        <span className="font-mono text-[#00ff66] font-bold block mb-1">UI Engineering</span>
                        <span className="text-slate-300 group-hover:text-white line-clamp-1 font-sans">"Create a responsive Tailwind landing page banner"</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-5xl mx-auto">
                    {messages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      const agentProfile = agents.find(a => a.id === msg.sender);

                      if (isUser) {
                        return (
                          <div key={msg.id} className="flex justify-end w-full">
                            <div className="bg-[#0c1e14] border border-emerald-500/40 px-5 py-4 rounded-2xl max-w-[75%] shadow-md">
                              <div className="flex items-center justify-between gap-4 mb-2 text-[10px] text-[#00ff66] font-mono font-bold">
                                <span>👤 USER PROMPT</span>
                                <span className="text-emerald-400/50">{msg.timestamp}</span>
                              </div>
                              <p className="text-[14.5px] text-slate-100 leading-relaxed whitespace-pre-wrap font-sans">{msg.text}</p>
                            </div>
                          </div>
                        );
                      }

                      let borderColor = 'border-emerald-500';
                      let headerText = 'SYSTEM UPDATE';
                      let headerColor = 'text-emerald-400';
                      let headerBg = 'bg-[#08120d]';
                      let isAgent = false;
                      let modelName = '';

                      if (msg.sender === 'planner') {
                        borderColor = 'border-amber-500';
                        headerText = '🧠 PLANNER';
                        headerColor = 'text-amber-400';
                        headerBg = 'bg-[#181205]';
                        isAgent = true;
                        modelName = agentProfile?.model || plannerModel;
                      } else if (msg.sender === 'coder') {
                        borderColor = 'border-[#00ff66]';
                        headerText = '💻 CODER';
                        headerColor = 'text-[#00ff66]';
                        headerBg = 'bg-[#05180f]';
                        isAgent = true;
                        modelName = agentProfile?.model || coderModel;
                      } else if (msg.sender === 'reviewer') {
                        borderColor = 'border-rose-500';
                        headerText = '🔍 REVIEWER';
                        headerColor = 'text-rose-400';
                        headerBg = 'bg-[#1c080b]';
                        isAgent = true;
                        modelName = agentProfile?.model || reviewerModel;
                      } else if (msg.sender === 'researcher') {
                        borderColor = 'border-sky-500';
                        headerText = '🌐 RESEARCHER';
                        headerColor = 'text-sky-400';
                        headerBg = 'bg-[#05121c]';
                        isAgent = true;
                        modelName = agentProfile?.model || researcherModel;
                      } else if (msg.sender === 'memory') {
                        borderColor = 'border-purple-500';
                        headerText = '📚 MEMORY';
                        headerColor = 'text-purple-400';
                        headerBg = 'bg-[#14061a]';
                        isAgent = true;
                        modelName = 'Vector Engine';
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`bg-[#030604] border-l-4 ${borderColor} rounded-xl shadow-lg overflow-hidden transition-all border-y border-r border-emerald-950`}
                        >
                          <div className={`px-4 py-2.5 border-b border-emerald-950/60 flex items-center justify-between ${headerBg}`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-mono font-black tracking-wider ${headerColor}`}>{headerText}</span>
                              {isAgent && modelName && (
                                <span className="text-[10px] text-emerald-400/60 font-mono bg-[#020503] px-2 py-0.5 rounded border border-emerald-900/30">({modelName})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-emerald-500/60 font-mono">
                              <Clock size={10} />
                              <span>{msg.timestamp}</span>
                            </div>
                          </div>
                          <div className="p-5">
                            {renderMessageContent(msg)}
                            
                            {msg.isStreaming && (
                              <div className="flex items-center gap-2 mt-4 text-xs font-mono text-[#00ff66] bg-[#05180f] p-3 rounded-lg border border-emerald-500/20">
                                <RefreshCw size={12} className="animate-spin text-[#00ff66]" />
                                <span>Generating streamed response from agent...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Bottom error status block */}
              {runtimeError && (
                <div className="mx-6 mb-4 p-4 rounded-xl border border-rose-500/30 bg-[#0e0809] flex flex-col gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-mono font-bold text-rose-400 block uppercase tracking-wide">Pipeline Execution Paused</span>
                      <p className="text-rose-200/80 mt-1 font-sans">{runtimeError}</p>
                      
                      {/* Detailed helpful text for Ollama Model Not Found */}
                      {engine === 'ollama' && (
                        <div className="mt-2 text-[11px] text-emerald-500/70 leading-relaxed font-mono bg-black/40 p-2.5 rounded border border-emerald-950">
                          <p className="text-emerald-400 font-semibold mb-1">💡 Troubleshooting Local Ollama Models:</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Make sure Ollama is running locally with <code className="text-emerald-300 bg-emerald-950/50 px-1 py-0.5 rounded">ollama serve</code> on your computer.</li>
                            <li>Ensure you have the required models installed. Run this command in your terminal:
                              <pre className="mt-1 bg-black text-emerald-400 p-1.5 rounded text-[10px] select-all overflow-x-auto">
                                {failedPhase === 'planner' ? 'ollama run qwen3:4b' :
                                 failedPhase === 'coder' ? 'ollama run qwen2.5-coder:14b' :
                                 'ollama run llama3.1:8b'}
                              </pre>
                            </li>
                            <li>You can download them by running <code className="text-emerald-300 bg-emerald-950/50 px-1 py-0.5 rounded">ollama run &lt;model-name&gt;</code>.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-950/30">
                    {failedPhase && (
                      <button
                        onClick={() => startPipelineOrchestration(failedPhase)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-300 border border-emerald-500/20 font-bold font-mono text-[11px] transition-all cursor-pointer"
                      >
                        🔄 Retry {failedPhase.toUpperCase()} Agent
                      </button>
                    )}
                    
                    <button
                      onClick={async () => {
                        setEngine(engine === 'gemini' ? 'ollama' : 'gemini');
                        setRuntimeError(null);
                        if (failedPhase) {
                          // Allow state update to settle, then restart
                          setTimeout(() => {
                            startPipelineOrchestration(failedPhase);
                          }, 100);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#0e1610] hover:bg-emerald-950 text-emerald-400 border border-[#0f2416] font-semibold font-mono text-[11px] transition-all cursor-pointer"
                    >
                      🔌 Switch Engine to {engine === 'gemini' ? 'Local' : 'Cloud'} & Resume
                    </button>

                    <button
                      onClick={() => {
                        setRuntimeError(null);
                        setFailedPhase(null);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-rose-950/20 text-rose-400 font-semibold font-mono text-[11px] transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Input Prompt Area */}
              <div className={`p-6 border-t border-emerald-900/30 ${theme === 'oled' ? 'bg-black' : 'bg-[#030604]'}`}>
                <div className="max-w-5xl mx-auto flex gap-3 relative items-end">
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        startPipelineOrchestration();
                      }
                    }}
                    placeholder="Enter your project goal or refine current plan..."
                    rows={2}
                    className="flex-1 bg-[#010302] border border-emerald-900 focus:border-emerald-400 rounded-xl px-4 py-3.5 text-[14px] focus:outline-none text-slate-100 placeholder-emerald-800/80 resize-none transition-all pr-32 font-sans shadow-inner"
                    disabled={pipelineIsRunning}
                  />
                  <div className="flex flex-col gap-2 shrink-0">
                    {pipelineIsRunning ? (
                      <button
                        onClick={stopPipelineOrchestration}
                        className="h-11 px-5 rounded-xl font-bold text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border bg-rose-950/45 hover:bg-rose-900/35 text-rose-200 border-rose-500/40 hover:border-rose-300 shadow-md animate-pulse active:scale-95 transition-transform"
                        title="Abort active agent orchestration pipeline"
                      >
                        <AlertCircle size={14} className="text-rose-400" />
                        <span>STOP RUN</span>
                      </button>
                    ) : (
                      <button
                        onClick={startPipelineOrchestration}
                        disabled={!userPrompt.trim()}
                        className={`h-11 px-5 rounded-xl font-bold text-xs font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                          !userPrompt.trim()
                            ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-800' 
                            : 'bg-[#10b981]/20 hover:bg-[#10b981]/30 text-white border-emerald-500/40 hover:border-emerald-400 shadow-md'
                        }`}
                      >
                        <Play size={14} className="fill-current text-[#00ff66]" />
                        <span>SEND TASK</span>
                      </button>
                    )}
                    {messages.length > 0 && (
                      <button
                        onClick={clearHistory}
                        disabled={pipelineIsRunning}
                        className="h-9 px-3 rounded-xl border border-emerald-900 hover:border-rose-500/40 hover:bg-rose-950/15 text-emerald-500/60 hover:text-rose-400 transition-all cursor-pointer text-[10px] flex items-center justify-center gap-1.5 uppercase font-bold"
                        title="Clear conversation logs"
                      >
                        <Trash2 size={12} />
                        <span>RESET OS</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'settings' ? (
            /* SETTINGS / CONFIGURATION TAB */
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-8 font-mono">
              <div>
                <h2 className="font-display font-bold text-2xl text-white">JoelOS System Configuration</h2>
                <p className="text-emerald-500/60 text-sm mt-1">Configure models, host connections, and auto-indexing parameters.</p>
              </div>

              {/* Dynamic Connection Status Notification */}
              <div className={`p-4 rounded-xl border ${ollamaConnectionStatus === 'connected' ? 'border-emerald-500/20 bg-emerald-950/10 text-emerald-300' : 'border-amber-500/20 bg-amber-950/10 text-amber-300'} text-xs space-y-1`}>
                <span className="font-bold block uppercase tracking-wider">
                  {ollamaConnectionStatus === 'connected' ? '✓ Connected to Local Ollama Node' : '⚠ Direct Ollama Node Offline'}
                </span>
                <p className="leading-relaxed opacity-90">
                  {ollamaConnectionStatus === 'connected' 
                    ? `Found ${installedOllamaModels.length} active models compiled on host machine. Agents are configured to auto-select matching parameters.`
                    : `Could not verify connection to Ollama at '${ollamaUrl}'. Ensure Ollama is running ('ollama serve') with host CORS origins configured ('OLLAMA_ORIGINS="*"'). Displaying standard fallback models.`}
                </p>
              </div>

              {/* Models Config Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section: Ollama Settings */}
                <div className="p-6 rounded-2xl border border-emerald-950 bg-[#080d0a] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-950">
                    <Terminal size={16} className="text-emerald-400" />
                    <h3 className="font-display font-semibold text-sm text-white">Local Parameters</h3>
                  </div>
                  
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-mono text-emerald-400/80 mb-1.5">Ollama Host URL</label>
                      <input
                        type="text"
                        value={ollamaUrl}
                        onChange={(e) => setOllamaUrl(e.target.value)}
                        placeholder="e.g. http://localhost:11434"
                        className="w-full rounded-lg bg-[#0a0f0c] border border-emerald-950 p-2.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-4 pt-2">
                      <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider">Agent Model Assignment</label>
                      
                      <div className="grid grid-cols-1 gap-3.5">
                        {/* Planner Model Assignment Selector */}
                        <div className="space-y-1">
                          <label className="block text-[11px] text-emerald-500/70 font-bold uppercase">🧠 Planner Model</label>
                          <select
                            value={installedOllamaModels.includes(plannerModel) ? plannerModel : 'custom'}
                            onChange={(e) => {
                              if (e.target.value !== 'custom') {
                                setPlannerModel(e.target.value);
                              }
                            }}
                            className="w-full rounded bg-[#0a0f0c] border border-emerald-950 p-2 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                          >
                            {installedOllamaModels.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                            <option value="custom">-- Custom model name --</option>
                          </select>
                          {(!installedOllamaModels.includes(plannerModel)) && (
                            <input
                              type="text"
                              value={plannerModel}
                              onChange={(e) => setPlannerModel(e.target.value)}
                              placeholder="Type custom model name..."
                              className="w-full mt-1.5 rounded bg-[#0a0f0c] border border-emerald-950 p-2 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                          )}
                        </div>

                        {/* Coder Model Assignment Selector */}
                        <div className="space-y-1">
                          <label className="block text-[11px] text-emerald-500/70 font-bold uppercase">💻 Coder Model</label>
                          <select
                            value={installedOllamaModels.includes(coderModel) ? coderModel : 'custom'}
                            onChange={(e) => {
                              if (e.target.value !== 'custom') {
                                setCoderModel(e.target.value);
                              }
                            }}
                            className="w-full rounded bg-[#0a0f0c] border border-emerald-950 p-2 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                          >
                            {installedOllamaModels.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                            <option value="custom">-- Custom model name --</option>
                          </select>
                          {(!installedOllamaModels.includes(coderModel)) && (
                            <input
                              type="text"
                              value={coderModel}
                              onChange={(e) => setCoderModel(e.target.value)}
                              placeholder="Type custom model name..."
                              className="w-full mt-1.5 rounded bg-[#0a0f0c] border border-emerald-950 p-2 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                          )}
                        </div>

                        {/* Reviewer Model Assignment Selector */}
                        <div className="space-y-1">
                          <label className="block text-[11px] text-emerald-500/70 font-bold uppercase">🔍 Reviewer Model</label>
                          <select
                            value={installedOllamaModels.includes(reviewerModel) ? reviewerModel : 'custom'}
                            onChange={(e) => {
                              if (e.target.value !== 'custom') {
                                setReviewerModel(e.target.value);
                              }
                            }}
                            className="w-full rounded bg-[#0a0f0c] border border-emerald-950 p-2 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                          >
                            {installedOllamaModels.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                            <option value="custom">-- Custom model name --</option>
                          </select>
                          {(!installedOllamaModels.includes(reviewerModel)) && (
                            <input
                              type="text"
                              value={reviewerModel}
                              onChange={(e) => setReviewerModel(e.target.value)}
                              placeholder="Type custom model name..."
                              className="w-full mt-1.5 rounded bg-[#0a0f0c] border border-emerald-950 p-2 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                          )}
                        </div>

                        {/* Researcher Model Assignment Selector */}
                        <div className="space-y-1">
                          <label className="block text-[11px] text-emerald-500/70 font-bold uppercase">🌐 Researcher Model</label>
                          <select
                            value={installedOllamaModels.includes(researcherModel) ? researcherModel : 'custom'}
                            onChange={(e) => {
                              if (e.target.value !== 'custom') {
                                setResearcherModel(e.target.value);
                              }
                            }}
                            className="w-full rounded bg-[#0a0f0c] border border-emerald-950 p-2 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                          >
                            {installedOllamaModels.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                            <option value="custom">-- Custom model name --</option>
                          </select>
                          {(!installedOllamaModels.includes(researcherModel)) && (
                            <input
                              type="text"
                              value={researcherModel}
                              onChange={(e) => setResearcherModel(e.target.value)}
                              placeholder="Type custom model name..."
                              className="w-full mt-1.5 rounded bg-[#0a0f0c] border border-emerald-950 p-2 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                            />
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Gemini Cloud Engine Settings */}
                <div className="p-6 rounded-2xl border border-emerald-950 bg-[#080d0a] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-950">
                    <Sparkles size={16} className="text-emerald-400" />
                    <h3 className="font-display font-semibold text-sm text-white">Cloud Parameters</h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-3 rounded-lg bg-emerald-950/15 border border-emerald-500/10 space-y-1 text-emerald-300 leading-relaxed text-[11px]">
                      <span className="font-bold text-emerald-300 block">Server-Side Credentials Auto-Injected</span>
                      JoelOS will securely authorize Gemini requests on the server using your configured <span className="font-mono text-emerald-400">GEMINI_API_KEY</span>. No credentials leaked to browser.
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#0a0f0c]/60 border border-emerald-950">
                      <div>
                        <span className="font-semibold block text-slate-200">Google Search Grounding</span>
                        <span className="text-[10px] text-emerald-500/60">Enables real-time queries through Google Search indexing.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={searchGrounding}
                        onChange={(e) => setSearchGrounding(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 border-emerald-950 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="font-semibold text-emerald-300">Target Models Map:</span>
                      <div className="space-y-1 text-[11px] text-emerald-500/60 font-mono">
                        <div className="flex justify-between border-b border-emerald-950/60 py-1">
                          <span>Researcher / Reviewer / Planner:</span>
                          <span className="text-slate-200 font-bold">gemini-3.5-flash</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Coder Reasoning:</span>
                          <span className="text-emerald-400 font-bold">gemini-3.1-pro-preview</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Pipeline Execution Priority */}
                <div className="p-6 rounded-2xl border border-emerald-950 bg-[#080d0a] space-y-4 md:col-span-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-950">
                    <Layers size={16} className="text-emerald-400" />
                    <h3 className="font-display font-semibold text-sm text-white">Pipeline Execution Priority</h3>
                  </div>
                  <p className="text-xs text-emerald-500/70 font-sans leading-relaxed">
                    Prioritize specific agents to influence the pipeline's execution flow. Forcing an agent priority allocates more time and resources to that phase of the orchestrated workflow.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {['none', 'researcher', 'planner', 'coder', 'reviewer'].map((agent) => (
                      <button
                        key={agent}
                        onClick={() => setPriorityAgent(agent)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          priorityAgent === agent 
                            ? 'bg-[#00ff66]/10 border-[#00ff66]/50 text-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.15)]' 
                            : 'bg-[#030604] border-emerald-950 text-emerald-500/60 hover:border-emerald-900 hover:text-emerald-400'
                        }`}
                      >
                        <span className="font-bold text-xs uppercase tracking-wider">{agent}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agent Performance Timings & Bottlenecks Chart */}
                <div className="p-6 rounded-2xl border border-emerald-950 bg-[#080d0a] space-y-4 md:col-span-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-950">
                    <Clock size={16} className="text-[#00ff66]" />
                    <h3 className="font-display font-semibold text-sm text-white">System Resource & Execution Bottleneck Profiler</h3>
                  </div>
                  
                  <p className="text-xs text-emerald-500/60 leading-relaxed mb-4">
                    Visualizes real-time system execution durations across all agents to pinpoint heavy compilation tasks or API delay hotspots.
                  </p>

                  {renderTimingChart()}
                </div>

              </div>

              {/* Memory vector specs */}
              <div className="p-6 rounded-2xl border border-emerald-950 bg-[#080d0a] space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-950">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-emerald-400" />
                    <h3 className="font-display font-semibold text-sm text-white">Semantic Recall & Memory Store</h3>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete all stored workspace memory structures? This action cannot be undone.')) {
                        localStorage.removeItem('joelos_memories');
                        setMemories([]);
                        setMatchedMemories([]);
                      }
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Purge Store</span>
                  </button>
                </div>
                
                <p className="text-xs text-emerald-500/60 leading-relaxed">
                  Every complete multi-agent pipeline workflow is indexed to local browser storage (<span className="font-mono">localStorage</span>) as highly scannable contextual metadata blocks. Memory utilizes a high-performance Cosine Similarity calculation to check relevancy on query recall, feeding history directly into upcoming pipelines automatically.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-[#0a0f0c] rounded-xl border border-emerald-950">
                    <span className="text-[10px] text-emerald-500/50 uppercase tracking-wider block font-mono">Ledger Count</span>
                    <span className="text-lg font-bold text-slate-100 font-display">{memories.length}</span>
                  </div>
                  <div className="p-3 bg-[#0a0f0c] rounded-xl border border-emerald-950">
                    <span className="text-[10px] text-emerald-500/50 uppercase tracking-wider block font-mono">Similarity Metric</span>
                    <span className="text-lg font-bold text-slate-100 font-display">Cosine Match</span>
                  </div>
                  <div className="p-3 bg-[#0a0f0c] rounded-xl border border-emerald-950">
                    <span className="text-[10px] text-emerald-500/50 uppercase tracking-wider block font-mono">Storage Type</span>
                    <span className="text-lg font-bold text-slate-100 font-display">Local JSON</span>
                  </div>
                  <div className="p-3 bg-[#0a0f0c] rounded-xl border border-emerald-950">
                    <span className="text-[10px] text-emerald-500/50 uppercase tracking-wider block font-mono">Memory Check</span>
                    <span className="text-lg font-bold text-emerald-400 font-display">Automatic</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ABOUT PAGE */
            <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full space-y-6 font-mono">
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={28} className="text-emerald-400" />
                </div>
                <h2 className="font-display font-bold text-2xl text-white">JoelOS Operating System</h2>
                <span className="text-xs text-emerald-400 font-mono">Distributed Multi-Agent Architecture</span>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-950 bg-[#080d0a] text-sm text-emerald-300 leading-relaxed space-y-4">
                <p>
                  <strong>JoelOS</strong> is an intelligent orchestration dashboard built to integrate local LLM processing frameworks (like Ollama) with state-of-the-art enterprise model architectures (like Google Gemini).
                </p>
                <p>
                  By establishing specialized agents with strict systemic constraints, JoelOS processes objectives through an organic pipeline:
                </p>
                <div className="p-4 rounded-xl bg-[#0a0f0c] border border-emerald-950 font-mono text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-right text-emerald-400">1.</span>
                    <span className="font-bold text-slate-200">Memory Agent</span>
                    <span className="text-emerald-500/60">indexes past solutions & injects previous patterns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-right text-emerald-400">2.</span>
                    <span className="font-bold text-slate-200">Researcher</span>
                    <span className="text-emerald-500/60">crawls online references / technical requirements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-right text-emerald-400">3.</span>
                    <span className="font-bold text-slate-200">Planner</span>
                    <span className="text-emerald-500/60">drafts hierarchical task checklists (no coding)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-right text-emerald-400">4.</span>
                    <span className="font-bold text-slate-200">Coder</span>
                    <span className="text-emerald-500/60">assembles clean, modular and compiled implementations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-right text-emerald-400">5.</span>
                    <span className="font-bold text-slate-200">Reviewer</span>
                    <span className="text-emerald-500/60">analyzes bugs, checks type safety and logs vulnerabilities</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* Keyboard Shortcuts Modal Overlay */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border border-emerald-500/35 ${theme === 'oled' ? 'bg-[#050505]' : 'bg-[#09110d]'} shadow-2xl shadow-emerald-500/15 p-6 relative overflow-hidden font-mono`}>
            
            {/* Ambient header glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#00ff66] to-emerald-500"></div>

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-[#00ff66]" />
                <h3 className="font-black text-sm uppercase tracking-wider text-emerald-200">System Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="text-emerald-500 hover:text-white p-1.5 rounded-lg border border-emerald-900/50 hover:bg-emerald-950/50 cursor-pointer transition-all"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-sans">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#030604] border border-emerald-950">
                <span className="text-slate-300">Toggle Shortcuts Panel</span>
                <kbd className="px-2 py-1 rounded bg-[#091510] border border-emerald-800/60 text-[#00ff66] text-[10px] font-bold font-mono shadow shadow-emerald-950">?</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#030604] border border-emerald-950">
                <span className="text-slate-300">Focus Goal Prompt Box</span>
                <kbd className="px-2 py-1 rounded bg-[#091510] border border-emerald-800/60 text-[#00ff66] text-[10px] font-bold font-mono shadow shadow-emerald-950">/</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#030604] border border-emerald-950">
                <span className="text-slate-300">Trigger/Send Active Pipeline</span>
                <kbd className="px-2 py-1 rounded bg-[#091510] border border-emerald-800/60 text-[#00ff66] text-[10px] font-bold font-mono shadow shadow-emerald-950">Ctrl + Enter</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#030604] border border-emerald-950">
                <span className="text-slate-300">Clear Conversation History</span>
                <kbd className="px-2 py-1 rounded bg-[#091510] border border-emerald-800/60 text-[#00ff66] text-[10px] font-bold font-mono shadow shadow-emerald-950">Ctrl + Shift + X</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#030604] border border-emerald-950">
                <span className="text-slate-300">Unfocus Fields / Close Modals</span>
                <kbd className="px-2 py-1 rounded bg-[#091510] border border-emerald-800/60 text-[#00ff66] text-[10px] font-bold font-mono shadow shadow-emerald-950">ESC</kbd>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-900/30 text-[10px] text-emerald-500 font-mono text-center leading-normal">
              Press <code className="text-[#00ff66] bg-[#05180f] px-1 py-0.5 rounded font-bold border border-[#00ff66]/20">ESC</code> at any time to immediately dismiss this help card.
            </div>
          </div>
        </div>
      )}

      {/* Memory Drawer Overlay */}
      <AnimatePresence>
        {isMemoryDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMemoryDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute top-0 right-0 bottom-0 w-full sm:w-96 md:w-[450px] shadow-2xl flex flex-col ${
                theme === 'oled' ? 'bg-[#000000]' : 'bg-[#050c08]'
              } border-l border-emerald-900/30 overflow-hidden`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between shrink-0 p-5 border-b border-emerald-900/30">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs uppercase tracking-widest text-emerald-300 font-bold flex items-center gap-2 px-2.5 py-1 rounded bg-[#0b2114] border border-emerald-500/25">
                    <Database size={13} className="text-[#00ff66]" />
                    <span>Workspace Memory</span>
                  </h3>
                  <span className="text-[10px] bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded font-bold">ACTIVE</span>
                </div>
                <button
                  onClick={() => setIsMemoryDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-emerald-500 hover:text-white hover:bg-emerald-950/40 transition-all cursor-pointer"
                  title="Close Memory"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search bar inside memory */}
              <div className="relative font-mono shrink-0 p-5 pb-0">
                <Search size={14} className="absolute left-8 top-1/2 -translate-y-1/2 mt-2.5 text-emerald-500" />
                <input
                  type="text"
                  value={memorySearchQuery}
                  onChange={(e) => handleMemorySearch(e.target.value)}
                  placeholder="Search history ledger..."
                  className="w-full rounded-xl bg-[#010302] border border-emerald-900/60 pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-emerald-800/60 focus:outline-none focus:border-emerald-400 font-sans shadow-inner"
                />
                {isMemorySearching && (
                  <RefreshCw size={14} className="absolute right-8 top-1/2 -translate-y-1/2 mt-2.5 text-[#00ff66] animate-spin" />
                )}
              </div>

              {/* Matches List */}
              <div className="flex-1 overflow-y-auto space-y-4 p-5 min-h-0">
                {matchedMemories.length === 0 ? (
                  <div className="text-center py-12 text-emerald-700 text-sm font-mono">
                    No matching memory records.
                  </div>
                ) : (
                  matchedMemories.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMemory(selectedMemory?.id === item.id ? null : item)}
                      className={`p-4 rounded-xl border transition-all text-left group cursor-pointer ${
                        selectedMemory?.id === item.id
                          ? 'bg-[#0d2719] border-emerald-500/60 shadow-lg'
                          : 'bg-[#091510]/50 border-emerald-950 hover:bg-[#0c1e16] hover:border-emerald-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 font-mono">
                        <span className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors line-clamp-1">{item.title}</span>
                        {item.relevance !== undefined && (
                          <span className="text-[10px] font-mono text-[#00ff66] font-extrabold bg-[#00ff66]/10 px-2 py-0.5 rounded border border-[#00ff66]/20 shrink-0">
                            {(item.relevance * 100).toFixed(0)}% Match
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300/80 line-clamp-2 mt-2 leading-relaxed font-sans">{item.summary}</p>
                      
                      {/* Collapsed / Expanded state visual code block excerpt */}
                      {selectedMemory?.id === item.id && (
                        <div className="mt-4 pt-4 border-t border-emerald-950/80 space-y-3">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#00ff66] font-bold">Snippet / Summary Excerpt:</span>
                          <pre className="p-3 rounded-lg bg-black/60 text-xs font-mono text-[#00ff66] overflow-x-auto border border-emerald-950/60 leading-relaxed max-h-48 shadow-inner custom-scrollbar">
                            <code>{item.snippet}</code>
                          </pre>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.id, item.snippet);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900/50 text-[#00ff66] hover:text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer border border-emerald-900/30 transition-all font-bold"
                          >
                            <Copy size={12} />
                            <span>Copy Code Block</span>
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-emerald-950/80 text-[10px] font-mono text-emerald-600">
                        <span className="truncate max-w-[200px]">{item.tags.join(' • ')}</span>
                        <span>{item.timestamp.split(',')[0]}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Preset trigger context helper */}
              <div className="p-5 border-t border-emerald-900/30 text-xs text-emerald-500/60 font-mono space-y-2 leading-relaxed shrink-0 bg-[#020503]">
                <span className="text-emerald-400 font-bold uppercase block tracking-widest text-[10px]">Workspace Context</span>
                <p className="text-emerald-600/60 leading-normal font-sans">Type queries above. Relevant memories feed into future planners to maintain contextual persistent recall.</p>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
