export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentName?: string; // Which agent generated this
  timestamp: number;
  type?: 'text' | 'image' | 'map_result';
  imageUrl?: string;
  mapData?: any; // For grounding results
}

export type AgentType = 
  | 'ORCHESTRATOR'
  | 'CLASSIFIER'
  | 'REUSE_SPECIALIST'
  | 'COMPOST_EXPERT'
  | 'LOCAL_RESOURCE'
  | 'IMPACT_ANALYST';

export interface AgentStatus {
  id: AgentType;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  color: string;
}

export interface WasteItem {
  name: string;
  category: 'organic' | 'recyclable' | 'hazardous' | 'landfill' | 'unknown';
  confidence: number;
  dateAdded: number;
}

export interface CompostData {
  carbon: number; // Brown
  nitrogen: number; // Green
  moisture: number;
}