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
  Palette,
  Server,
  Mail
} from 'lucide-react';
import { ModelHub } from './components/ModelHub';
import { MailIntegration } from './components/MailIntegration';
import { Agent, AgentId, PipelineNode, Message, MemoryItem, OllamaModelInfo } from './types';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [ollamaModelDetails, setOllamaModelDetails] = useState<OllamaModelInfo[]>([]);
  const [showModelHub, setShowModelHub] = useState<boolean>(false);
  const [ollamaRefreshTrigger, setOllamaRefreshTrigger] = useState<number>(0);

  // Interactive controls
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'settings' | 'about' | 'mail'>('pipeline');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMemorySearching, setIsMemorySearching] = useState<boolean>(false);
  const [memorySearchQuery, setMemorySearchQuery] = useState<string>('');
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);

  // Premium Enhancements States
  const [theme, setTheme] = useState<'dark' | 'light' | 'oled'>(() => {
    return (localStorage.getItem('joelos_theme') as 'dark' | 'light' | 'oled') || 'dark';
  });
  const [geminiInputTokens, setGeminiInputTokens] = useState<number>(() => {
    return Number(localStorage.getItem('joelos_gemini_input_tokens')) || 0;
  });
  const [geminiOutputTokens, setGeminiOutputTokens] = useState<number>(() => {
    return Number(localStorage.getItem('joelos_gemini_output_tokens')) || 0;
  });
  const [chatTab, setChatTab] = useState<'global' | 'private'>('global');
  const [privateAgentId, setPrivateAgentId] = useState<AgentId>('cortana');
  const [uptime, setUptime] = useState('00h 00m 00s');

  useEffect(() => {
    localStorage.setItem('joelos_gemini_input_tokens', geminiInputTokens.toString());
  }, [geminiInputTokens]);

  useEffect(() => {
    localStorage.setItem('joelos_gemini_output_tokens', geminiOutputTokens.toString());
  }, [geminiOutputTokens]);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - startTime;
      const hrs = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${hrs}h ${mins}m ${secs}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const [timingsHistory, setTimingsHistory] = useState<Array<{ timestamp: string; cortana: number; jarvis: number; aura: number; boss: number; cash: number; forge: number; titan: number }>>(() => {
    const saved = localStorage.getItem('joelos_timings_history_v2');
    return saved ? JSON.parse(saved) : [
      { timestamp: '10:45:12', cortana: 0.8, jarvis: 1.1, aura: 1.5, boss: 0.9, cash: 1.2, forge: 2.1, titan: 1.4 },
      { timestamp: '11:02:44', cortana: 0.6, jarvis: 0.9, aura: 1.2, boss: 0.7, cash: 1.0, forge: 1.8, titan: 1.1 },
      { timestamp: '11:20:15', cortana: 1.1, jarvis: 1.4, aura: 1.9, boss: 1.2, cash: 1.5, forge: 2.8, titan: 1.6 },
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
  const [agents, setAgents] = useState<Agent[]>(() => {
    const savedEnabled = localStorage.getItem('joelos_enabled_agents_v2');
    const enabledMap = savedEnabled ? JSON.parse(savedEnabled) : {
      cortana: true,
      jarvis: true,
      aura: true,
      boss: true,
      cash: true,
      forge: true,
      titan: true,
      memory: true
    };
    const savedTaskCounts = localStorage.getItem('joelos_agent_task_counts');
    const taskCountsMap = savedTaskCounts ? JSON.parse(savedTaskCounts) : {};
    return [
      {
        id: 'cortana',
        name: 'Cortana',
        icon: '👑',
        dotColor: 'bg-purple-500 shadow-purple-500/50 text-purple-400 border-purple-500/20',
        model: 'gemini-2.5-flash',
        description: 'Chief of Staff. Receives directives, plans agent pipelines, and synthesizes outputs.',
        status: 'idle',
        enabled: enabledMap.cortana !== false,
        taskCount: taskCountsMap.cortana || 0,
        color: '#7c3aed',
      },
      {
        id: 'jarvis',
        name: 'Jarvis',
        icon: '💬',
        dotColor: 'bg-blue-500 shadow-blue-500/50 text-blue-400 border-blue-500/20',
        model: 'gemini-2.5-flash',
        description: 'Communications Agent. Handles email triage, scheduling, and client templates.',
        status: 'idle',
        enabled: enabledMap.jarvis !== false,
        taskCount: taskCountsMap.jarvis || 0,
        color: '#2563eb',
      },
      {
        id: 'aura',
        name: 'Aura',
        icon: '📢',
        dotColor: 'bg-pink-500 shadow-pink-500/50 text-pink-400 border-pink-500/20',
        model: 'gemini-2.5-flash',
        description: 'Content & Brand. Drafts campaigns, social copy, and tracks audience engagement.',
        status: 'idle',
        enabled: enabledMap.aura !== false,
        taskCount: taskCountsMap.aura || 0,
        color: '#ec4899',
      },
      {
        id: 'boss',
        name: 'Boss',
        icon: '📊',
        dotColor: 'bg-amber-500 shadow-amber-500/50 text-amber-400 border-amber-500/20',
        model: 'gemini-2.5-flash',
        description: 'Operations Manager. Compiles summaries, tracks task deadlines, and organizes daily briefs.',
        status: 'idle',
        enabled: enabledMap.boss !== false,
        taskCount: taskCountsMap.boss || 0,
        color: '#f59e0b',
      },
      {
        id: 'cash',
        name: 'Cash',
        icon: '💵',
        dotColor: 'bg-emerald-500 shadow-emerald-500/50 text-emerald-400 border-emerald-500/20',
        model: 'gemini-2.5-flash',
        description: 'Finance Intelligence. Computes ROI on campaigns, manages spend, flags anomalies.',
        status: 'idle',
        enabled: enabledMap.cash !== false,
        taskCount: taskCountsMap.cash || 0,
        color: '#10b981',
      },
      {
        id: 'forge',
        name: 'Forge',
        icon: '🛠️',
        dotColor: 'bg-slate-400 shadow-slate-400/50 text-slate-300 border-slate-500/20',
        model: 'gemini-2.5-flash',
        description: 'Build & Dev. Engineers codebase structures, refactors systems, and writes code.',
        status: 'idle',
        enabled: enabledMap.forge !== false,
        taskCount: taskCountsMap.forge || 0,
        color: '#6b7280',
      },
      {
        id: 'titan',
        name: 'Titan',
        icon: '🎯',
        dotColor: 'bg-violet-500 shadow-violet-500/50 text-violet-400 border-violet-500/20',
        model: 'gemini-2.5-flash',
        description: 'Strategic Analyst. Conducts market research, evaluates pricing, tracks trends.',
        status: 'idle',
        enabled: enabledMap.titan !== false,
        taskCount: taskCountsMap.titan || 0,
        color: '#8b5cf6',
      },
      {
        id: 'memory',
        name: 'Memory',
        icon: '📚',
        dotColor: 'bg-purple-500 shadow-purple-500/50 text-purple-400 border-purple-500/20',
        model: 'Vector Engine',
        description: 'Semantic vector memory store. Recalls relevant patterns from history.',
        status: 'idle',
        enabled: enabledMap.memory !== false,
        taskCount: taskCountsMap.memory || 0,
        color: '#a78bfa',
      }
    ];
  });

  // Orchestration progress nodes
  const [pipelineNodes, setPipelineNodes] = useState<PipelineNode[]>([
    { id: 'start', label: 'User Intent', status: 'pending' },
    { id: 'memory', label: 'Memory Recall', status: 'pending' },
    { id: 'cortana', label: 'Cortana Orchestrator', status: 'pending' },
    { id: 'jarvis', label: 'Jarvis (Communications)', status: 'pending' },
    { id: 'aura', label: 'Aura (Content)', status: 'pending' },
    { id: 'boss', label: 'Boss (Operations)', status: 'pending' },
    { id: 'cash', label: 'Cash (Finance)', status: 'pending' },
    { id: 'forge', label: 'Forge (Build)', status: 'pending' },
    { id: 'titan', label: 'Titan (Strategy)', status: 'pending' },
    { id: 'synthesis', label: 'Final deliverable', status: 'pending' },
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
    cortana: `You are CORTANA, Chief of Staff of the 7-Agent Mission Control system. Your job is to read user goals, identify which agents among [JARVIS, AURA, BOSS, CASH, FORGE, TITAN] should execute, delegate specific tasks, and coordinate work. Be authoritative and highly structured.${priorityAgent === 'cortana' ? ' [PRIORITY OVERRIDE]: Provide extremely thorough orchestration directives and exhaustive edge-case handling considerations.' : ''}`,
    jarvis: `You are JARVIS, communications and organization agent. You specialize in drafting emails, calendar scheduling, lead follow-ups, and inbox organization. Provide polished copy and specific timing plans.${priorityAgent === 'jarvis' ? ' [PRIORITY OVERRIDE]: Provide highly comprehensive and multi-layered communication templates.' : ''}`,
    aura: `You are AURA, brand and content copywriter. You specialize in campaigns, high-engagement social media posts, launch calendars, and outreach ideas.${priorityAgent === 'aura' ? ' [PRIORITY OVERRIDE]: Write extensive, deeply optimized, and engaging content copy.' : ''}`,
    boss: `You are BOSS, operations manager. You specialize in breaking down goals into tasks, organizing lists, summarizing briefs, and workflow management.${priorityAgent === 'boss' ? ' [PRIORITY OVERRIDE]: Perform deep operational breakdowns.' : ''}`,
    cash: `You are CASH, financial intelligence analyst. You track ROI, budgets, ad campaign performance, and find budget anomalies. Be highly mathematical and precise.${priorityAgent === 'cash' ? ' [PRIORITY OVERRIDE]: Run deep, thorough budget calculations.' : ''}`,
    forge: `You are FORGE, developer and builder. You generate production-ready code, plan database structures, design systems, and solve technical bugs. Wrap code in markdown. ${priorityAgent === 'forge' ? ' [PRIORITY OVERRIDE]: Generate deeply optimized codebases with comments.' : ''}`,
    titan: `You are TITAN, strategic planner. You specialize in competitor research, market trends, competitive pricing models, and identifying opportunities.${priorityAgent === 'titan' ? ' [PRIORITY OVERRIDE]: Execute a comprehensive strategic competitive intelligence sweep.' : ''}`,
    researcher: `You are the RESEARCHER agent. Conduct highly rigorous technical and background research. Find specific libraries, API signatures, architectural structures, and design guidelines that will help build the requested product. Deliver clear, factual documentation with references.`,
    planner: `You are the PLANNER agent. Receive user goals and technical research. Formulate a comprehensive step-by-step architectural plan. Break down the engineering task into modular units, specifying clear layout options, component partitions, states, and data schemas without writing actual code.`,
    coder: `You are the CODER agent. Receive research guidelines and step-by-step blueprint plans. Generate robust, production-quality, and complete code blocks in React, TypeScript, and Tailwind CSS. Ensure that all requested components are fully functional and cleanly modularized. Do not use placeholding comments.`,
    reviewer: `You are the REVIEWER agent. Audit generated codebase packages, styles, and logic blocks. Scan carefully for syntax errors, React rendering performance issues, anti-patterns, responsive design defects, and incomplete features. Deliver a final, objective code audit checklist.`,
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
              const names = data.models.map((m: any) => typeof m === 'string' ? m : m.name);
              setInstalledOllamaModels(names);
              setOllamaModelDetails(data.models.filter((m: any) => typeof m !== 'string'));
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
              setOllamaModelDetails(data.models);
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
  }, [ollamaUrl, ollamaRefreshTrigger]);

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
      if (agent.id === 'planner') return { ...agent, model: engine === 'gemini' ? 'gemini-2.5-flash' : plannerModel };
      if (agent.id === 'coder') return { ...agent, model: engine === 'gemini' ? 'gemini-2.5-pro' : coderModel };
      if (agent.id === 'reviewer') return { ...agent, model: engine === 'gemini' ? 'gemini-2.5-flash' : reviewerModel };
      if (agent.id === 'researcher') return { ...agent, model: engine === 'gemini' ? 'gemini-2.5-flash' : researcherModel };
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
        <div className="text-center py-8 text-emerald-700 text-xs font-mono">
          No historical orchestration metrics available. Run a pipeline to generate timings.
        </div>
      );
    }

    const maxVal = Math.max(...timingsHistory.map(d => d.cortana + d.jarvis + d.aura + d.boss + d.cash + d.forge + d.titan), 3);
    const chartHeight = 160;
    
    return (
      <div className="space-y-6 font-sans">
        <div className="relative border border-emerald-950/60 rounded-xl p-4 bg-[#0a0f0c]/30 font-mono">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-4 border-b border-emerald-950/40 pb-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Agent Execution Bottleneck Timeline (Stacked Duration)</span>
            <span className="text-[10px] text-emerald-500/50">Max Height: {maxVal.toFixed(1)}s</span>
          </div>

          {/* SVG Visualizer */}
          <div className="h-44 w-full flex items-end gap-3 md:gap-5 overflow-x-auto pt-4 pb-2 select-none min-h-[180px] scrollbar-none">
            {timingsHistory.map((run, i) => {
              const total = run.cortana + run.jarvis + run.aura + run.boss + run.cash + run.forge + run.titan;
              const hCortana = (run.cortana / maxVal) * chartHeight;
              const hJarvis = (run.jarvis / maxVal) * chartHeight;
              const hAura = (run.aura / maxVal) * chartHeight;
              const hBoss = (run.boss / maxVal) * chartHeight;
              const hCash = (run.cash / maxVal) * chartHeight;
              const hForge = (run.forge / maxVal) * chartHeight;
              const hTitan = (run.titan / maxVal) * chartHeight;

              // Find slowest agent
              const timings = [
                { name: 'Cortana', val: run.cortana },
                { name: 'Jarvis', val: run.jarvis },
                { name: 'Aura', val: run.aura },
                { name: 'Boss', val: run.boss },
                { name: 'Cash', val: run.cash },
                { name: 'Forge', val: run.forge },
                { name: 'Titan', val: run.titan }
              ];
              const slowest = timings.reduce((prev, curr) => prev.val > curr.val ? prev : curr);

              return (
                <div key={i} className="flex-1 flex flex-col items-center min-w-[50px] group relative h-full justify-end">
                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-[calc(100%-8px)] left-1/2 -translate-x-1/2 z-20 hidden group-hover:flex flex-col bg-black border border-emerald-500/40 p-2.5 rounded-lg text-[9px] text-slate-200 whitespace-nowrap shadow-2xl font-mono text-left space-y-1">
                    <span className="text-[10px] font-bold text-white border-b border-emerald-950 pb-1 block mb-1">Run at {run.timestamp}</span>
                    <span className="flex justify-between gap-4"><span>Cortana:</span> <span className="text-purple-400 font-bold">{run.cortana.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Jarvis:</span> <span className="text-blue-400 font-bold">{run.jarvis.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Aura:</span> <span className="text-pink-400 font-bold">{run.aura.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Boss:</span> <span className="text-amber-400 font-bold">{run.boss.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Cash:</span> <span className="text-emerald-400 font-bold">{run.cash.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Forge:</span> <span className="text-slate-400 font-bold">{run.forge.toFixed(1)}s</span></span>
                    <span className="flex justify-between gap-4"><span>Titan:</span> <span className="text-violet-400 font-bold">{run.titan.toFixed(1)}s</span></span>
                    <div className="border-t border-emerald-950 pt-1 mt-1 text-[8px] flex justify-between font-bold text-rose-400">
                      <span>BOTTLENECK:</span>
                      <span>{slowest.name} ({slowest.val.toFixed(1)}s)</span>
                    </div>
                  </div>

                  {/* Stacked bar container */}
                  <div className="w-6 sm:w-8 bg-emerald-950/15 rounded-t-md overflow-hidden flex flex-col justify-end border border-emerald-950/30 group-hover:border-emerald-500/40 transition-colors" style={{ height: `${chartHeight}px` }}>
                    <div className="w-full bg-[#8b5cf6]/85" style={{ height: `${hTitan}px` }} />
                    <div className="w-full bg-slate-500/85" style={{ height: `${hForge}px` }} />
                    <div className="w-full bg-[#10b981]/85" style={{ height: `${hCash}px` }} />
                    <div className="w-full bg-[#f59e0b]/85" style={{ height: `${hBoss}px` }} />
                    <div className="w-full bg-[#ec4899]/85" style={{ height: `${hAura}px` }} />
                    <div className="w-full bg-[#2563eb]/85" style={{ height: `${hJarvis}px` }} />
                    <div className="w-full bg-[#7c3aed]/85 animate-pulse" style={{ height: `${hCortana}px` }} />
                  </div>

                  {/* Label */}
                  <span className="text-[9px] text-emerald-500/60 font-mono mt-1.5 font-bold">{run.timestamp.split(':')[0]}:{run.timestamp.split(':')[1]}</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3.5 border-t border-emerald-950/40 text-[9px]">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-purple-500"></span><span className="text-emerald-500/80">Cortana</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500"></span><span className="text-emerald-500/80">Jarvis</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-pink-500"></span><span className="text-emerald-500/80">Aura</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-500"></span><span className="text-emerald-500/80">Boss</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500"></span><span className="text-emerald-500/80">Cash</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-slate-400"></span><span className="text-emerald-500/80">Forge</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-violet-500"></span><span className="text-emerald-500/80">Titan</span></div>
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
                  const total = run.cortana + run.jarvis + run.aura + run.boss + run.cash + run.forge + run.titan;
                  const timings = [
                    { name: 'Cortana (Orchestrator)', val: run.cortana, icon: '👑' },
                    { name: 'Jarvis (Comms)', val: run.jarvis, icon: '💬' },
                    { name: 'Aura (Brand)', val: run.aura, icon: '📢' },
                    { name: 'Boss (Ops)', val: run.boss, icon: '📊' },
                    { name: 'Cash (Finance)', val: run.cash, icon: '💵' },
                    { name: 'Forge (Build)', val: run.forge, icon: '🛠️' },
                    { name: 'Titan (Strategy)', val: run.titan, icon: '🎯' }
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

  // Run whole 7-agent pipeline orchestration step-by-step
  const startPipelineOrchestration = async (fromPhase?: string) => {
    const isEnabled = (id: AgentId) => {
      // Use latest agent status for delegation checks
      const agent = agents.find(a => a.id === id);
      return agent ? agent.enabled !== false : true;
    };

    pipelineAbortedRef.current = false;
    let targetQuery = '';
    
    if (fromPhase) {
      targetQuery = currentQuery;
      setPipelineIsRunning(true);
      setRuntimeError(null);
      setFailedPhase(null);
    } else {
      if (!userPrompt.trim()) return;
      if (pipelineIsRunning) return;
      targetQuery = userPrompt;
      setCurrentQuery(targetQuery);
      setUserPrompt('');

      setAgentTimings({});
      setAgentTokens({});
      setFailedPhase(null);
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

    // Accumulators for run reports
    const agentReports: Record<string, string> = {};
    const individualTimings: Record<string, number> = {
      cortana: 0,
      jarvis: 0,
      aura: 0,
      boss: 0,
      cash: 0,
      forge: 0,
      titan: 0,
    };

    // Track state of current workspace variables
    let currentConversationContext = '';
    let memoryDuration = 0;
    let researcherDuration = 0;
    let plannerDuration = 0;
    let coderDuration = 0;
    let reviewerDuration = 0;

    // --- STEP 1: SEMANTIC MEMORY RECALL ---
    if (pipelineAbortedRef.current) return;
    if (isEnabled('memory')) {
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
          setSelectedMemory(topMatches[0]);
          setMatchedMemories(topMatches);
          
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
              ? `Found ${topMatches.length} matching semantic memories:\n` + topMatches.map(m => `• [${((m.relevance || 0)*100).toFixed(0)}% Match] ${m.title} - ${m.summary}`).join('\n')
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
    } else {
      setPipelineNodes(nodes => nodes.map(n => n.id === 'memory' ? { ...n, status: 'skipped' } : n));
    }

    // --- STEP 2: RESEARCHER AGENT ---
    if (pipelineAbortedRef.current) return;
    let latestResearcherContext = researcherContext;
    if (!fromPhase || fromPhase === 'memory' || fromPhase === 'researcher') {
      if (isEnabled('researcher')) {
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
        const activeModel = engine === 'gemini' ? 'gemini-2.5-flash' : researcherModel;
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
              
              let data: any;
              try {
                data = JSON.parse(line.slice(6));
              } catch (e) {
                console.error('SSE Parse Error', e);
                continue;
              }

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
            model: engine === 'gemini' ? 'gemini-2.5-flash' : researcherModel
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
            model: engine === 'gemini' ? 'gemini-2.5-flash' : researcherModel
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
      } else {
        setPipelineNodes(nodes => nodes.map(n => n.id === 'researcher' ? { ...n, status: 'skipped' } : n));
      }
    }

    // --- STEP 3: PLANNER AGENT ---
    if (pipelineAbortedRef.current) return;
    let latestPlannerOutputText = plannerOutputText;
    if (!fromPhase || fromPhase === 'memory' || fromPhase === 'researcher' || fromPhase === 'planner') {
      if (isEnabled('planner')) {
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
        const activeModel = engine === 'gemini' ? 'gemini-2.5-flash' : plannerModel;
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
              
              let data: any;
              try {
                data = JSON.parse(line.slice(6));
              } catch (e) {
                console.error('SSE Parse Error', e);
                continue;
              }

              if (data.error) {
                throw new Error(data.error);
              }

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
            model: engine === 'gemini' ? 'gemini-2.5-flash' : plannerModel
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
            model: engine === 'gemini' ? 'gemini-2.5-flash' : plannerModel
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
      } else {
        setPipelineNodes(nodes => nodes.map(n => n.id === 'planner' ? { ...n, status: 'skipped' } : n));
      }
    }

    // --- STEP 4: CODER AGENT ---
    if (pipelineAbortedRef.current) return;
    let latestCoderOutputText = coderOutputText;
    if (!fromPhase || fromPhase === 'memory' || fromPhase === 'researcher' || fromPhase === 'planner' || fromPhase === 'coder') {
      if (isEnabled('coder')) {
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
        const activeModel = engine === 'gemini' ? 'gemini-2.5-pro' : coderModel;
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
              
              let data: any;
              try {
                data = JSON.parse(line.slice(6));
              } catch (e) {
                console.error('SSE Parse Error', e);
                continue;
              }

              if (data.error) {
                throw new Error(data.error);
              }

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
            model: engine === 'gemini' ? 'gemini-2.5-pro' : coderModel
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
            model: engine === 'gemini' ? 'gemini-2.5-pro' : coderModel
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
      } else {
        setPipelineNodes(nodes => nodes.map(n => n.id === 'coder' ? { ...n, status: 'skipped' } : n));
      }
    }

    // --- STEP 5: REVIEWER AGENT ---
    if (pipelineAbortedRef.current) return;
    let latestReviewerOutputText = reviewerOutputText;
    if (!fromPhase || fromPhase === 'memory' || fromPhase === 'researcher' || fromPhase === 'planner' || fromPhase === 'coder' || fromPhase === 'reviewer') {
      if (isEnabled('reviewer')) {
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
        const activeModel = engine === 'gemini' ? 'gemini-2.5-flash' : reviewerModel;
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
              
              let data: any;
              try {
                data = JSON.parse(line.slice(6));
              } catch (e) {
                console.error('SSE Parse Error', e);
                continue;
              }

              if (data.error) {
                throw new Error(data.error);
              }

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
            model: engine === 'gemini' ? 'gemini-2.5-flash' : reviewerModel
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
            model: engine === 'gemini' ? 'gemini-2.5-flash' : reviewerModel
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
      } else {
        setPipelineNodes(nodes => nodes.map(n => n.id === 'reviewer' ? { ...n, status: 'skipped' } : n));
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
        cortana: memoryDuration || 0.4,
        jarvis: researcherDuration * 0.4 || 0.5,
        aura: plannerDuration * 0.5 || 0.6,
        boss: plannerDuration * 0.5 || 0.7,
        cash: reviewerDuration * 0.3 || 0.5,
        forge: coderDuration || 2.8,
        titan: researcherDuration * 0.6 || 0.9,
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

    return (
      <div className="space-y-3.5 leading-relaxed text-slate-200 text-[14.5px] font-sans">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h2 className="text-white font-black text-xl mt-6 mb-3 first:mt-0 font-display" {...props} />,
            h2: ({node, ...props}) => <h3 className="text-emerald-200 font-extrabold text-lg mt-5 mb-2 first:mt-0 font-display" {...props} />,
            h3: ({node, ...props}) => <h4 className="text-emerald-300 font-bold text-base mt-4 mb-2 first:mt-0 font-display" {...props} />,
            h4: ({node, ...props}) => <h5 className="text-emerald-400 font-bold text-sm mt-3 mb-1 first:mt-0 font-display" {...props} />,
            p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-slate-300" {...props} />,
            ul: ({node, ...props}) => <ul className="my-2 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="my-2 space-y-1 list-decimal list-outside ml-4" {...props} />,
            li: ({node, ...props}) => <li className="text-slate-200 marker:text-[#00ff66]" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
            code: ({node, inline, className, children, ...props}: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : 'code';
              const codeContent = String(children).replace(/\n$/, '');
              
              if (!inline && match) {
                const codeBlockId = `${msg.id}-code-${codeContent.substring(0, 10)}`;
                return (
                  <div className="relative group rounded-xl border border-emerald-900/30 bg-[#030504] overflow-hidden my-3 shadow-inner">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-emerald-950 bg-[#08100c] text-xs font-mono text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <Terminal size={12} className="text-emerald-400" />
                        <span>{language.toUpperCase()}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(codeBlockId, codeContent)}
                        className="p-1 rounded bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer border border-emerald-900/30 text-[10px]"
                        title="Copy code"
                      >
                        {copiedId === codeBlockId ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        <span>{copiedId === codeBlockId ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-emerald-300/90 max-h-[480px]">
                      <code className={className} {...props}>{codeContent}</code>
                    </pre>
                  </div>
                );
              }
              return (
                <code className="bg-emerald-950/30 text-emerald-300 px-1 py-0.5 rounded font-mono text-[0.85em]" {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {text}
        </Markdown>
      </div>
    );
  };

  return (
    <div className={`h-screen w-screen overflow-hidden ${theme === 'light' ? 'bg-[#f3f6f4] text-slate-800' : (theme === 'oled' ? 'bg-[#000000] text-emerald-200/90' : 'bg-[#020403] text-emerald-200/90')} flex flex-col font-sans selection:bg-emerald-500/35 selection:text-white terminal-grid transition-colors duration-300`}>
      <style>{`
        :root {
          --theme-color: ${colorPalette === 'matrix-green' ? '#00ff66' : '#00d2ff'};
          --theme-color-rgb: ${colorPalette === 'matrix-green' ? '0, 255, 102' : '0, 210, 255'};
          
          --theme-emerald-100-rgb: ${colorPalette === 'matrix-green' ? '209, 250, 229' : '224, 242, 254'};
          --theme-emerald-200-rgb: ${colorPalette === 'matrix-green' ? '167, 243, 208' : '186, 230, 253'};
          --theme-emerald-300-rgb: ${colorPalette === 'matrix-green' ? '110, 231, 183' : '125, 211, 252'};
          --theme-emerald-400-rgb: ${colorPalette === 'matrix-green' ? '52, 211, 153' : '56, 189, 248'};
          --theme-emerald-500-rgb: ${colorPalette === 'matrix-green' ? '16, 185, 129' : '14, 165, 233'};
          --theme-emerald-600-rgb: ${colorPalette === 'matrix-green' ? '5, 150, 105' : '2, 132, 199'};
          --theme-emerald-700-rgb: ${colorPalette === 'matrix-green' ? '4, 120, 87' : '3, 105, 161'};
          --theme-emerald-800-rgb: ${colorPalette === 'matrix-green' ? '6, 95, 70' : '7, 89, 133'};
          --theme-emerald-900-rgb: ${colorPalette === 'matrix-green' ? '6, 78, 59' : '12, 74, 110'};
          --theme-emerald-950-rgb: ${colorPalette === 'matrix-green' ? '2, 44, 34' : '8, 47, 73'};

          --theme-emerald-400: ${colorPalette === 'matrix-green' ? '#34d399' : '#38bdf8'};
          --theme-emerald-500: ${colorPalette === 'matrix-green' ? '#10b981' : '#0ea5e9'};
          --theme-emerald-600: ${colorPalette === 'matrix-green' ? '#059669' : '#0284c7'};
          --theme-emerald-300: ${colorPalette === 'matrix-green' ? '#6ee7b7' : '#7dd3fc'};
          --theme-emerald-200: ${colorPalette === 'matrix-green' ? '#a7f3d0' : '#bae6fd'};
          --theme-emerald-950: ${colorPalette === 'matrix-green' ? '#022c22' : '#082f49'};
          --theme-emerald-900: ${colorPalette === 'matrix-green' ? '#064e3b' : '#0c4a6e'};
          --theme-bg-0b2114: ${colorPalette === 'matrix-green' ? '#0b2114' : '#0b1621'};
        }
        
        /* Auto-generated precise theme overrides */

        .border-emerald-900\\/30 { border-color: rgba(var(--theme-emerald-900-rgb), 0.3) !important; }
        .border-emerald-950 { border-color: rgb(var(--theme-emerald-950-rgb)) !important; }
        .text-emerald-400 { color: rgb(var(--theme-emerald-400-rgb)) !important; }
        .bg-emerald-900\\/60 { background-color: rgba(var(--theme-emerald-900-rgb), 0.6) !important; }
        .text-emerald-300 { color: rgb(var(--theme-emerald-300-rgb)) !important; }
        .hover\\:bg-emerald-950\\/40:hover { background-color: rgba(var(--theme-emerald-950-rgb), 0.4) !important; }
        .bg-emerald-900\\/20 { background-color: rgba(var(--theme-emerald-900-rgb), 0.2) !important; }
        .text-\\[\\#00ff66\\] { color: rgb(var(--theme-color-rgb)) !important; }
        .border-\\[\\#00ff66\\] { border-color: rgb(var(--theme-color-rgb)) !important; }
        .bg-emerald-900\\/10 { background-color: rgba(var(--theme-emerald-900-rgb), 0.1) !important; }
        .bg-emerald-500 { background-color: rgb(var(--theme-emerald-500-rgb)) !important; }
        .text-emerald-500 { color: rgb(var(--theme-emerald-500-rgb)) !important; }
        .border-emerald-500\\/20 { border-color: rgba(var(--theme-emerald-500-rgb), 0.2) !important; }
        .text-emerald-700 { color: rgb(var(--theme-emerald-700-rgb)) !important; }
        .border-emerald-950\\/60 { border-color: rgba(var(--theme-emerald-950-rgb), 0.6) !important; }
        .border-emerald-950\\/40 { border-color: rgba(var(--theme-emerald-950-rgb), 0.4) !important; }
        .text-emerald-500\\/50 { color: rgba(var(--theme-emerald-500-rgb), 0.5) !important; }
        .border-emerald-500\\/40 { border-color: rgba(var(--theme-emerald-500-rgb), 0.4) !important; }
        .bg-emerald-950\\/15 { background-color: rgba(var(--theme-emerald-950-rgb), 0.15) !important; }
        .border-emerald-950\\/30 { border-color: rgba(var(--theme-emerald-950-rgb), 0.3) !important; }
        .group-hover\\:border-emerald-500\\/40:hover { border-color: rgba(var(--theme-emerald-500-rgb), 0.4) !important; }
        .bg-\\[\\#00ff66\\]\\/85 { background-color: rgba(var(--theme-color-rgb), 0.85) !important; }
        .border-emerald-400\\/20 { border-color: rgba(var(--theme-emerald-400-rgb), 0.2) !important; }
        .bg-emerald-700\\/85 { background-color: rgba(var(--theme-emerald-700-rgb), 0.85) !important; }
        .text-emerald-500\\/60 { color: rgba(var(--theme-emerald-500-rgb), 0.6) !important; }
        .text-emerald-500\\/80 { color: rgba(var(--theme-emerald-500-rgb), 0.8) !important; }
        .hover\\:bg-emerald-950\\/10:hover { background-color: rgba(var(--theme-emerald-950-rgb), 0.1) !important; }
        .text-emerald-200\\/90 { color: rgba(var(--theme-emerald-200-rgb), 0.9) !important; }
        .bg-emerald-950\\/10 { background-color: rgba(var(--theme-emerald-950-rgb), 0.1) !important; }
        .border-emerald-500\\/10 { border-color: rgba(var(--theme-emerald-500-rgb), 0.1) !important; }
        .text-emerald-200 { color: rgb(var(--theme-emerald-200-rgb)) !important; }
        .bg-emerald-950\\/40 { background-color: rgba(var(--theme-emerald-950-rgb), 0.4) !important; }
        .hover\\:bg-emerald-900\\/40:hover { background-color: rgba(var(--theme-emerald-900-rgb), 0.4) !important; }
        .text-emerald-300\\/90 { color: rgba(var(--theme-emerald-300-rgb), 0.9) !important; }
        .bg-emerald-950\\/30 { background-color: rgba(var(--theme-emerald-950-rgb), 0.3) !important; }
        .bg-emerald-500\\/35 { background-color: rgba(var(--theme-emerald-500-rgb), 0.35) !important; }
        .hover\\:text-\\[\\#00ff66\\]:hover { color: rgb(var(--theme-color-rgb)) !important; }
        .hover\\:text-emerald-400:hover { color: rgb(var(--theme-emerald-400-rgb)) !important; }
        .hover\\:text-emerald-500:hover { color: rgb(var(--theme-emerald-500-rgb)) !important; }
        .hover\\:text-emerald-300:hover { color: rgb(var(--theme-emerald-300-rgb)) !important; }
        .text-emerald-600 { color: rgb(var(--theme-emerald-600-rgb)) !important; }
        .hover\\:text-emerald-600:hover { color: rgb(var(--theme-emerald-600-rgb)) !important; }
        .bg-\\[\\#00ff66\\] { background-color: rgb(var(--theme-color-rgb)) !important; }
        .ring-\\[\\#00ff66\\] { --tw-ring-color: rgb(var(--theme-color-rgb)) !important; }
        .bg-emerald-400 { background-color: rgb(var(--theme-emerald-400-rgb)) !important; }
        .bg-emerald-900 { background-color: rgb(var(--theme-emerald-900-rgb)) !important; }
        .bg-emerald-950 { background-color: rgb(var(--theme-emerald-950-rgb)) !important; }
        .bg-\\[\\#10b981\\] { background-color: rgb(var(--theme-emerald-500-rgb)) !important; }
        .border-emerald-400 { border-color: rgb(var(--theme-emerald-400-rgb)) !important; }
        .border-emerald-500 { border-color: rgb(var(--theme-emerald-500-rgb)) !important; }
        .border-emerald-900 { border-color: rgb(var(--theme-emerald-900-rgb)) !important; }
        .border-\\[\\#10b981\\] { border-color: rgb(var(--theme-emerald-500-rgb)) !important; }
        .text-emerald-100 { color: rgb(var(--theme-emerald-100-rgb)) !important; }
        .bg-emerald-9 { background-color: rgb(var(--theme-emerald-9-rgb)) !important; }
        .border-emerald-9 { border-color: rgb(var(--theme-emerald-9-rgb)) !important; }
        .text-emerald-2 { color: rgb(var(--theme-emerald-2-rgb)) !important; }
        .text-emerald-3 { color: rgb(var(--theme-emerald-3-rgb)) !important; }
        .text-emerald-4 { color: rgb(var(--theme-emerald-4-rgb)) !important; }
        .text-emerald-6 { color: rgb(var(--theme-emerald-6-rgb)) !important; }
        .hover\\:bg-emerald-9:hover { background-color: rgb(var(--theme-emerald-9-rgb)) !important; }
        .hover\\:bg-\\[\\#00ff66\\]:hover { background-color: rgb(var(--theme-color-rgb)) !important; }
        .text-emerald-5 { color: rgb(var(--theme-emerald-5-rgb)) !important; }
        .text-emerald-7 { color: rgb(var(--theme-emerald-7-rgb)) !important; }
        .bg-\\[\\#00ff66\\]\\/1 { background-color: rgba(var(--theme-color-rgb), 0.01) !important; }
        .bg-\\[\\#10b981\\]\\/2 { background-color: rgba(var(--theme-emerald-500-rgb), 0.02) !important; }
        .bg-emerald-950\\/1 { background-color: rgba(var(--theme-emerald-950-rgb), 0.01) !important; }
        .border-emerald-900\\/35 { border-color: rgba(var(--theme-emerald-900-rgb), 0.35) !important; }
        .border-emerald-900\\/50 { border-color: rgba(var(--theme-emerald-900-rgb), 0.5) !important; }
        .bg-emerald-500\\/5 { background-color: rgba(var(--theme-emerald-500-rgb), 0.05) !important; }
        .bg-emerald-500\\/15 { background-color: rgba(var(--theme-emerald-500-rgb), 0.15) !important; }
        .border-emerald-500\\/35 { border-color: rgba(var(--theme-emerald-500-rgb), 0.35) !important; }
        .text-emerald-400\\/60 { color: rgba(var(--theme-emerald-400-rgb), 0.6) !important; }
        .border-emerald-900\\/40 { border-color: rgba(var(--theme-emerald-900-rgb), 0.4) !important; }
        .bg-\\[\\#10b981\\]\\/20 { background-color: rgba(var(--theme-emerald-500-rgb), 0.2) !important; }
        .border-\\[\\#10b981\\]\\/40 { border-color: rgba(var(--theme-emerald-500-rgb), 0.4) !important; }
        .hover\\:bg-emerald-950\\/80:hover { background-color: rgba(var(--theme-emerald-950-rgb), 0.8) !important; }
        .hover\\:border-emerald-500\\/30:hover { border-color: rgba(var(--theme-emerald-500-rgb), 0.3) !important; }
        .bg-emerald-900\\/40 { background-color: rgba(var(--theme-emerald-900-rgb), 0.4) !important; }
        .border-emerald-500\\/50 { border-color: rgba(var(--theme-emerald-500-rgb), 0.5) !important; }
        .bg-\\[\\#10b981\\]\\/25 { background-color: rgba(var(--theme-emerald-500-rgb), 0.25) !important; }
        .hover\\:bg-\\[\\#10b981\\]\\/5:hover { background-color: rgba(var(--theme-emerald-500-rgb), 0.05) !important; }
        .bg-emerald-950\\/50 { background-color: rgba(var(--theme-emerald-950-rgb), 0.5) !important; }
        .border-emerald-500\\/25 { border-color: rgba(var(--theme-emerald-500-rgb), 0.25) !important; }
        .bg-\\[\\#00ff66\\]\\/10 { background-color: rgba(var(--theme-color-rgb), 0.1) !important; }
        .border-\\[\\#00ff66\\]\\/20 { border-color: rgba(var(--theme-color-rgb), 0.2) !important; }
        .hover\\:border-emerald-900\\/60:hover { border-color: rgba(var(--theme-emerald-900-rgb), 0.6) !important; }
        .hover\\:bg-emerald-800\\/80:hover { background-color: rgba(var(--theme-emerald-800-rgb), 0.8) !important; }
        .text-emerald-400\\/80 { color: rgba(var(--theme-emerald-400-rgb), 0.8) !important; }
        .bg-emerald-950\\/60 { background-color: rgba(var(--theme-emerald-950-rgb), 0.6) !important; }
        .text-emerald-800 { color: rgb(var(--theme-emerald-800-rgb)) !important; }
        .text-emerald-600\\/60 { color: rgba(var(--theme-emerald-600-rgb), 0.6) !important; }
        .bg-emerald-900\\/25 { background-color: rgba(var(--theme-emerald-900-rgb), 0.25) !important; }
        .ring-emerald-400 { --tw-ring-color: rgb(var(--theme-emerald-400-rgb)) !important; }
        .border-emerald-500\\/30 { border-color: rgba(var(--theme-emerald-500-rgb), 0.3) !important; }
        .bg-emerald-500\\/10 { background-color: rgba(var(--theme-emerald-500-rgb), 0.1) !important; }
        .text-emerald-500\\/70 { color: rgba(var(--theme-emerald-500-rgb), 0.7) !important; }
        .border-emerald-900\\/20 { border-color: rgba(var(--theme-emerald-900-rgb), 0.2) !important; }
        .border-emerald-400\\/40 { border-color: rgba(var(--theme-emerald-400-rgb), 0.4) !important; }
        .hover\\:border-emerald-500\\/55:hover { border-color: rgba(var(--theme-emerald-500-rgb), 0.55) !important; }
        .text-emerald-400\\/50 { color: rgba(var(--theme-emerald-400-rgb), 0.5) !important; }
        .bg-emerald-900\\/30 { background-color: rgba(var(--theme-emerald-900-rgb), 0.3) !important; }
        .hover\\:bg-emerald-800\\/40:hover { background-color: rgba(var(--theme-emerald-800-rgb), 0.4) !important; }
        .hover\\:bg-emerald-950:hover { background-color: rgb(var(--theme-emerald-950-rgb)) !important; }
        .bg-emerald-950\\/20 { background-color: rgba(var(--theme-emerald-950-rgb), 0.2) !important; }
        .border-emerald-900\\/60 { border-color: rgba(var(--theme-emerald-900-rgb), 0.6) !important; }
        .hover\\:bg-\\[\\#10b981\\]\\/30:hover { background-color: rgba(var(--theme-emerald-500-rgb), 0.3) !important; }
        .hover\\:border-emerald-400:hover { border-color: rgb(var(--theme-emerald-400-rgb)) !important; }
        .ring-emerald-500 { --tw-ring-color: rgb(var(--theme-emerald-500-rgb)) !important; }
        .border-\\[\\#00ff66\\]\\/50 { border-color: rgba(var(--theme-color-rgb), 0.5) !important; }
        .hover\\:border-emerald-900:hover { border-color: rgb(var(--theme-emerald-900-rgb)) !important; }
        .hover\\:bg-emerald-950\\/50:hover { background-color: rgba(var(--theme-emerald-950-rgb), 0.5) !important; }
        .border-emerald-800\\/60 { border-color: rgba(var(--theme-emerald-800-rgb), 0.6) !important; }
        .border-emerald-500\\/60 { border-color: rgba(var(--theme-emerald-500-rgb), 0.6) !important; }
        .group-hover\\:text-emerald-300:hover { color: rgb(var(--theme-emerald-300-rgb)) !important; }
        .border-emerald-950\\/80 { border-color: rgba(var(--theme-emerald-950-rgb), 0.8) !important; }
        .hover\\:bg-emerald-900\\/50:hover { background-color: rgba(var(--theme-emerald-900-rgb), 0.5) !important; }


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
        
        ${theme === 'light' ? `
          .min-h-screen {
            background-color: #f3f6f4 !important;
            color: #1e293b !important;
          }
          header, aside, main, pre {
            background-color: #ffffff !important;
            border-color: #cbd5e1 !important;
          }
          main {
            background-color: #f8fafc !important;
          }
          input, select, textarea {
            background-color: #ffffff !important;
            border-color: ${colorPalette === 'matrix-green' ? '#10b981' : '#0ea5e9'} !important;
            color: #0f172a !important;
          }
          input::placeholder, textarea::placeholder {
            color: #94a3b8 !important;
          }
          
          /* Generic dark background overrides */
          [class*="bg-[#0"]:not([class*="bg-[#00ff66]"]):not([class*="bg-[#000000]"]) {
            background-color: #ffffff !important;
            border-color: ${colorPalette === 'matrix-green' ? '#10b981' : '#0ea5e9'} !important;
          }
          
          [class*="bg-emerald-9"] {
            background-color: #f1f5f9 !important;
          }
          
          [class*="border-[#0"]:not([class*="border-[#00ff66]"]):not([class*="border-[#000000]"]),
          [class*="border-emerald-9"] {
            border-color: ${colorPalette === 'matrix-green' ? '#10b981' : '#0ea5e9'} !important;
          }
          
          /* Generic text overrides - placed after backgrounds to ensure they win */
          h1, h2, h3, h4, h5, h6, 
          [class*="text-slate-1"], [class*="text-slate-2"], [class*="text-slate-3"], [class*="text-white"] {
            color: #1e293b !important;
          }
          
          [class*="text-[#00ff66]"], [class*="text-emerald-2"], [class*="text-emerald-3"], [class*="text-emerald-4"], [class*="text-emerald-6"] {
            color: ${colorPalette === 'matrix-green' ? '#047857' : '#0284c7'} !important;
          }
          
          code {
            color: #334155 !important;
          }
          
          [class*="hover:bg-emerald-9"]:hover, [class*="hover:bg-[#0"]:not([class*="hover:bg-[#00ff66]"]):not([class*="hover:bg-[#000000]"]):hover {
            background-color: #cbd5e1 !important;
          }
          
          .bg-black\\/35, .bg-black\\/60 {
            background-color: #f8fafc !important;
            color: #334155 !important;
          }
          
          [class*="text-emerald-5"], [class*="text-emerald-7"] {
            color: #475569 !important;
          }
          
          [class*="bg-[#00ff66]/1"], [class*="bg-[#10b981]/2"], [class*="bg-emerald-950/1"] {
            background-color: ${colorPalette === 'matrix-green' ? '#f0fdf4' : '#f0f9ff'} !important;
            color: ${colorPalette === 'matrix-green' ? '#166534' : '#075985'} !important;
          }
        ` : ''}
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

          {/* Visual Customization Buttons */}
          <div className="flex items-center gap-2 bg-[#020503] p-1 rounded-xl border border-emerald-900/40 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                const themes = ['dark', 'light', 'oled'];
                const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length] as 'dark' | 'light' | 'oled';
                setTheme(nextTheme);
                localStorage.setItem('joelos_theme', nextTheme);
              }}
              className="w-8 h-8 rounded-lg border border-transparent bg-transparent hover:bg-emerald-950/80 hover:border-emerald-500/30 flex justify-center items-center transition-all focus:outline-none focus:ring-0 focus:ring-offset-0"
              title={`Switch Theme (Current: ${theme})`}
            >
              {theme === 'dark' ? <Moon size={16} className="text-emerald-500" /> : theme === 'light' ? <Sun size={16} className="text-emerald-500" /> : <Sun size={16} className="text-emerald-500 opacity-60" />}
            </button>

            <div className="w-[1px] h-4 bg-emerald-900/40"></div>

            {/* Color Palette Dropdown Select */}
            <Select 
              value={colorPalette} 
              onValueChange={(val: any) => { 
                setColorPalette(val); 
                localStorage.setItem('joelos_color_palette', val); 
              }}
            >
              <SelectTrigger className="w-8 h-8 rounded-lg border border-transparent bg-transparent shadow-none hover:bg-emerald-950/80 hover:border-emerald-500/30 p-0 flex justify-center items-center [&>svg:last-child]:hidden focus:ring-0 focus:ring-offset-0 transition-all">
                <Palette size={16} className="text-emerald-500" />
              </SelectTrigger>
              <SelectContent className="bg-[#020403] border border-emerald-500/50 shadow-xl shadow-emerald-900/20">
                <SelectItem value="matrix-green" className="text-[#00ff66] font-mono text-xs focus:bg-emerald-900 focus:text-[#00ff66] cursor-pointer">Phosphor</SelectItem>
                <SelectItem value="cyber-blue" className="text-cyan-400 font-mono text-xs focus:bg-cyan-900 focus:text-cyan-400 cursor-pointer">Cyber</SelectItem>
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

          <div className="flex sm:hidden flex-wrap gap-2 pb-4 border-b border-emerald-900/30">
            <button
              onClick={() => { setActiveTab('pipeline'); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === 'pipeline' ? 'bg-[#10b981]/25 text-emerald-200 border border-[#10b981]/40' : 'text-emerald-600 border border-transparent'}`}
            >
              <Terminal size={12} /> Pipeline
            </button>
            <button
              onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === 'settings' ? 'bg-[#10b981]/25 text-emerald-200 border border-[#10b981]/40' : 'text-emerald-600 border border-transparent'}`}
            >
              <Settings size={12} /> Config
            </button>
            <button
              onClick={() => { setActiveTab('mail'); setMobileMenuOpen(false); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${activeTab === 'mail' ? 'bg-[#10b981]/25 text-emerald-200 border border-[#10b981]/40' : 'text-emerald-600 border border-transparent'}`}
            >
              <Mail size={12} /> Mail
            </button>
            <button
              onClick={() => { setIsMemoryDrawerOpen(true); setMobileMenuOpen(false); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 text-emerald-600 border border-transparent"
            >
              <Database size={12} /> Memory
            </button>
            <button
              onClick={() => { setShowModelHub(true); setMobileMenuOpen(false); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 text-emerald-600 border border-transparent"
            >
              <Server size={12} /> Model Hub
            </button>
          </div>

          {/* Agent Status Deck */}
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold flex items-center gap-2 px-2.5 py-1 rounded bg-[#0b2114] border border-emerald-500/25">
                <Layers size={11} className="text-[#00ff66]" />
                <span>Core Agents</span>
              </h3>
              <span className="text-[10px] bg-[#00ff66]/10 text-[#00ff66] border border-[#00ff66]/20 px-2 py-0.5 rounded font-bold">
                {agents.filter(a => a.enabled !== false).length} ONLINE
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 select-none">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`relative p-3.5 rounded-xl border transition-all flex items-center gap-3.5 ${
                    agent.enabled === false
                      ? 'border-emerald-950/30 bg-[#050a08]/50 opacity-50'
                      : agent.status === 'thinking'
                        ? 'border-emerald-400 bg-[#0d2719] shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                        : 'border-emerald-950 bg-[#091510]/50 hover:bg-[#0c1e16] hover:border-emerald-900/60'
                  }`}
                >
                  <div className="text-2xl shrink-0 filter grayscale-0 opacity-100 transition-all">{agent.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-100">{agent.name}</span>
                        <button
                          onClick={() => {
                            if (pipelineIsRunning) return;
                            setAgents(prev => {
                              const next = prev.map(a => a.id === agent.id ? { ...a, enabled: a.enabled === false ? true : false } : a);
                              const enabledMap = next.reduce((acc, a) => ({ ...acc, [a.id]: a.enabled }), {});
                              localStorage.setItem('joelos_enabled_agents', JSON.stringify(enabledMap));
                              return next;
                            });
                          }}
                          disabled={pipelineIsRunning}
                          className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase transition-colors ${
                            agent.enabled === false 
                              ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 cursor-pointer' 
                              : 'bg-emerald-900/60 text-[#00ff66] hover:bg-emerald-800/80 cursor-pointer'
                          }`}
                        >
                          {agent.enabled === false ? 'OFF' : 'ON'}
                        </button>
                      </div>
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
                    } else if (node.status === 'skipped') {
                      statusColor = 'bg-slate-900/50 border-slate-700/50 text-slate-500';
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
                            node.status === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' :
                            node.status === 'skipped' ? 'bg-slate-700' : 'bg-emerald-900'
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
                            node.status === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' :
                            node.status === 'skipped' ? 'bg-slate-700' : 'bg-emerald-900'
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
                        onClick={() => startPipelineOrchestration()}
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
                          <span className="text-slate-200 font-bold">gemini-2.5-flash</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Coder Reasoning:</span>
                          <span className="text-emerald-400 font-bold">gemini-2.5-pro</span>
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
          ) : activeTab === 'mail' ? (
            /* MAIL INTEGRATION TAB */
            <div className="flex-1 overflow-hidden">
              <MailIntegration 
                onSuggestReply={(content) => {
                  setUserPrompt(content);
                  setActiveTab('pipeline');
                }}
                isAiThinking={pipelineIsRunning}
              />
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

        {/* RIGHT COLUMN: Navigation Sidebar */}
        <aside className={`w-16 shrink-0 border-l border-emerald-900/30 ${theme === 'oled' ? 'bg-[#000000]' : 'bg-[#020503]'} hidden sm:flex flex-col items-center py-4 gap-4 z-10 shadow-[-4px_0_15px_-5px_rgba(0,0,0,0.5)]`}>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`w-10 h-10 rounded-lg flex flex-col justify-center items-center transition-all ${activeTab === 'pipeline' ? 'bg-[#10b981]/25 text-emerald-200 border border-[#10b981]/40 shadow-sm' : 'text-emerald-600 hover:text-emerald-400 hover:bg-[#10b981]/5'}`}
            title="Pipeline"
          >
            <Terminal size={18} />
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-10 h-10 rounded-lg flex flex-col justify-center items-center transition-all ${activeTab === 'settings' ? 'bg-[#10b981]/25 text-emerald-200 border border-[#10b981]/40 shadow-sm' : 'text-emerald-600 hover:text-emerald-400 hover:bg-[#10b981]/5'}`}
            title="Config"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => setActiveTab('mail')}
            className={`w-10 h-10 rounded-lg flex flex-col justify-center items-center transition-all ${activeTab === 'mail' ? 'bg-[#10b981]/25 text-emerald-200 border border-[#10b981]/40 shadow-sm' : 'text-emerald-600 hover:text-emerald-400 hover:bg-[#10b981]/5'}`}
            title="Mail"
          >
            <Mail size={18} />
          </button>
          <div className="w-8 h-[1px] bg-emerald-900/40 my-1"></div>
          <button
            onClick={() => setIsMemoryDrawerOpen(true)}
            className="w-10 h-10 rounded-lg flex flex-col justify-center items-center text-emerald-600 hover:text-emerald-400 hover:bg-[#10b981]/5 transition-all"
            title="Memory"
          >
            <Database size={18} />
          </button>
          <button
            onClick={() => setShowModelHub(true)}
            className="w-10 h-10 rounded-lg flex flex-col justify-center items-center text-emerald-600 hover:text-emerald-400 hover:bg-[#10b981]/5 transition-all"
            title="Model Hub"
          >
            <Server size={18} />
          </button>
        </aside>

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

      {showModelHub && (
        <ModelHub 
          models={ollamaModelDetails}
          ollamaUrl={ollamaUrl}
          onClose={() => setShowModelHub(false)}
          onRefresh={() => {
            setOllamaRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}
