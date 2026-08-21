export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
}

export type OperationalActionType = 'create_task';

export interface SuggestedOperationalAction {
  id: string;
  type: OperationalActionType;
  label: string;
  description: string;
  payload: {
    title: string;
    priority: 'low' | 'medium' | 'high';
    description?: string;
  };
  requiresConfirmation: boolean;
}

export interface OperationalSnapshotView {
  generatedAt: string;
  sessions: { total: number; totalSeconds: number };
  messages: { total: number };
  documents: { total: number; recent: Array<{ id: string; title: string | null; type: string; created_at: string }> };
  tasks: { todo: number; inProgress: number; done: number; total: number };
  expenses: { pendingCount: number; pendingTotal: number; activeTotal: number };
}

export interface AIResponse {
  message: string;
  action?: 'provide_info' | 'ask_question' | 'generate_document' | 'operational_briefing' | 'propose_action';
  documentData?: {
    id: string;
    type: string;
  };
  reasoning?: string[];
  suggestedActions?: SuggestedOperationalAction[];
  operationalSnapshot?: OperationalSnapshotView;
}

export interface MicronetInfo {
  name: string;
  description: string;
  version: string;
  features: string[];
  contact: {
    email: string;
    phone: string;
    website: string;
  };
}
