export type AgentId = 'planner' | 'coder' | 'reviewer' | 'researcher' | 'memory';

export interface Agent {
  id: AgentId;
  name: string;
  icon: string;
  dotColor: string;
  model: string;
  description: string;
  status: 'idle' | 'thinking' | 'active' | 'completed' | 'error';
}

export interface PipelineNode {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
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
