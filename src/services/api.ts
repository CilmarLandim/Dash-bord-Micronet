import axios from 'axios';
import { ChatMessage, Document, AIResponse, UsageStats } from '../types';

const API_BASE_URL = (import.meta.env as any).VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat API
export const chatAPI = {
  sendMessage: async (sessionId: string, message: string, context?: any): Promise<AIResponse> => {
    const response = await api.post('/chat/message', {
      sessionId,
      message,
      context,
    });
    return response.data;
  },

  startSession: async (): Promise<{ sessionId: string }> => {
    const response = await api.post('/chat/session/start', {});
    return response.data;
  },

  endSession: async (sessionId: string): Promise<{ success: boolean }> => {
    const response = await api.post('/chat/session/end', { sessionId });
    return response.data;
  },

  getHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/history/${sessionId}`);
    return response.data;
  },
};

// Document API
export const documentAPI = {
  generateDocument: async (
    sessionId: string,
    type: string,
    data: any
  ): Promise<Document> => {
    const response = await api.post('/documents/generate', {
      sessionId,
      type,
      data,
    });
    return response.data;
  },

  getDocument: async (documentId: string): Promise<Document> => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },

  printDocument: async (documentId: string, printerName?: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/documents/${documentId}/print`, {
      printerName,
    });
    return response.data;
  },

  downloadDocument: async (documentId: string): Promise<Blob> => {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Time Tracking API
export const timeAPI = {
  recordTime: async (sessionId: string, seconds: number): Promise<{ success: boolean }> => {
    const response = await api.post('/time/record', {
      sessionId,
      seconds,
    });
    return response.data;
  },

  getSessionTime: async (sessionId: string): Promise<{ totalSeconds: number }> => {
    const response = await api.get(`/time/session/${sessionId}`);
    return response.data;
  },
};

// Info API
export const infoAPI = {
  getMicronetInfo: async () => {
    const response = await api.get('/info/micronet');
    return response.data;
  },

  getFlows: async () => {
    const response = await api.get('/info/flows');
    return response.data;
  },

  getUsageStats: async (): Promise<UsageStats> => {
    const response = await api.get('/info/stats');
    return response.data;
  },
};

// Voice API
export const voiceAPI = {
  transcribeAudio: async (audioBlob: Blob): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await api.post('/voice/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  synthesizeText: async (text: string): Promise<Blob> => {
    const response = await api.post(
      '/voice/synthesize',
      { text },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

export default api;
