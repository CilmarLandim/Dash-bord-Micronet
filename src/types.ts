export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
}

export interface AIResponse {
  message: string;
  action?: 'provide_info' | 'ask_question' | 'generate_document';
  documentData?: {
    id: string;
    type: string;
  };
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
