// Tipos de mensagens do chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'voice' | 'document';
}

// Tipos de documentos
export type DocumentType = 'curriculum' | 'contact' | 'second_copy' | 'research' | 'report' | 'proposal';

export interface Document {
  id: string;
  type: DocumentType;
  title: string;
  content: string;
  createdAt: Date;
  filePath?: string;
  status: 'draft' | 'generated' | 'printed';
}

// Tipos de fluxos de atendimento
export interface AttendanceFlow {
  id: DocumentType;
  name: string;
  description: string;
  icon: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type: 'text' | 'select' | 'number' | 'date';
  required: boolean;
  options?: string[];
}

// Dados de sessão
export interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  messages: ChatMessage[];
  documents: Document[];
  currentFlow?: DocumentType;
  flowData: Record<string, any>;
  totalTimeSeconds: number;
}

// Resposta da IA
export interface AIResponse {
  message: string;
  action?: 'ask_question' | 'generate_document' | 'provide_info' | 'end_flow';
  nextQuestion?: Question;
  documentData?: Partial<Document>;
}

// Configuração de impressão
export interface PrintConfig {
  printerName?: string;
  copies?: number;
  colorMode?: 'color' | 'bw';
  paperSize?: 'A4' | 'A3';
}

// Informações sobre Micronet
export interface MicronetInfo {
  name: string;
  description: string;
  services: string[];
  contact: {
    phone: string;
    email: string;
    address: string;
  };
  hours: {
    weekday: string;
    weekend: string;
  };
}

// Configuração de servidor LAN
export interface LANConfig {
  serverUrl: string;
  sharedFolder: string;
  printerAddress?: string;
  credentials?: {
    username: string;
    password: string;
  };
}

// Estatísticas de uso
export interface UsageStats {
  totalSessions: number;
  totalTimeMinutes: number;
  documentsGenerated: number;
  documentsPrinted: number;
  averageSessionDuration: number;
}
