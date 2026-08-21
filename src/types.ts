export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
}

export type OperationalActionType = 'create_task' | 'create_expense' | 'generate_document';
export type DocumentType = 'curriculum' | 'contact' | 'second_copy' | 'research' | 'report' | 'proposal';

export interface TaskActionPayload {
  title: string;
  priority: 'low' | 'medium' | 'high';
  description?: string;
}

export interface ExpenseActionPayload {
  description: string;
  amount: number;
  category: 'fixed' | 'variable' | 'other';
  status: 'pending' | 'paid' | 'cancelled';
  expenseDate?: string;
}

export interface DocumentActionPayload {
  type: DocumentType;
  format: 'docx';
  data: Record<string, unknown>;
}

export type SuggestedOperationalAction =
  | {
      id: string;
      type: 'create_task';
      label: string;
      description: string;
      payload: TaskActionPayload;
      requiresConfirmation: boolean;
    }
  | {
      id: string;
      type: 'create_expense';
      label: string;
      description: string;
      payload: ExpenseActionPayload;
      requiresConfirmation: boolean;
    }
  | {
      id: string;
      type: 'generate_document';
      label: string;
      description: string;
      payload: DocumentActionPayload;
      requiresConfirmation: boolean;
    };

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
