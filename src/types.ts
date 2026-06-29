export type AgentId = 'cortana' | 'jarvis' | 'aura' | 'boss' | 'cash' | 'forge' | 'titan' | 'memory' | 'researcher' | 'planner' | 'coder' | 'reviewer';

export interface Agent {
  id: AgentId;
  name: string;
  icon: string;
  dotColor: string;
  model: string;
  description: string;
  status: 'idle' | 'thinking' | 'active' | 'completed' | 'error';
  enabled?: boolean;
  taskCount?: number;
  color?: string;
}

export interface PipelineNode {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error' | 'skipped';
}

export interface Message {
  id: string;
  sender: 'user' | AgentId | 'system';
  text: string;
  timestamp: string;
  rawOutput?: string;
  previousRawOutput?: string;
  isStreaming?: boolean;
}

export interface MemoryItem {
  id: string;
  title: string;
  summary: string;
  snippet: string;
  tags: string[];
  embedding?: number[];
  relevance?: number;
  timestamp: string;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}
