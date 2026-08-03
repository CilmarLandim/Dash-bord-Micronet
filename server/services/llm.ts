import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { AIResponse } from '../../src/types';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateChatResponse(
  userMessage: string,
  history: any[],
  _context?: any
): Promise<AIResponse> {
  try {
    // Se a chave não estiver configurada, avisamos mas mantemos o fallback
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        message: "A chave da API do Claude não está configurada. Por favor, adicione ANTHROPIC_API_KEY ao seu arquivo .env.",
        action: 'provide_info'
      };
    }

    const messages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Adiciona a mensagem atual se não estiver no histórico
    if (messages.length === 0 || messages[messages.length - 1].content !== userMessage) {
      messages.push({ role: 'user', content: userMessage });
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: "Você é o assistente virtual da Micronet Solutions. Seja profissional, prestativo e direto. Você pode ajudar com currículos, propostas, relatórios e informações da empresa.",
      messages: messages,
    });

    const content = response.content[0];
    const text = content.type === 'text' ? content.text : 'Desculpe, não consegui processar sua mensagem.';

    return {
      message: text,
      action: 'ask_question'
    };
  } catch (error) {
    console.error('Erro ao chamar Anthropic:', error);
    return {
      message: "Desculpe, ocorreu um erro ao processar sua mensagem com a IA.",
      action: 'provide_info'
    };
  }
}

// Manteve a função de geração de documentos integrada ao llm service por enquanto
export async function generateDocument(
  type: string,
  data: any
): Promise<{ id: string; filePath: string; url: string }> {
  // Import dinâmico para evitar dependência circular se necessário
  const { generatePDF } = await import('./documentService');
  return await generatePDF(type, data);
}
