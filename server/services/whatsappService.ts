import twilio from 'twilio';
import dotenv from 'dotenv';
import { dbService } from './db';
import { generateChatResponse } from './llm';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Sandbox default

const client = twilio(accountSid, authToken);

export const whatsappService = {
  /**
   * Processa uma mensagem recebida do WhatsApp via Twilio Webhook.
   * Identifica a sessão pelo número de telefone (From).
   */
  processIncomingMessage: async (from: string, body: string) => {
    // 1. Identificar ou criar sessão baseada no telefone
    // Usamos um prefixo 'wa_' para diferenciar sessões de WhatsApp das de Web
    const sessionId = `wa_${from.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    let session = dbService.getSession(sessionId);
    if (!session) {
      dbService.createSession(sessionId);
    }

    // 2. Salvar mensagem do usuário
    dbService.addMessage(sessionId, 'user', body);

    // 3. Recuperar histórico para contexto da IA
    const history = dbService.getHistory(sessionId);

    // 4. Gerar resposta inteligente (usando o motor Claude já configurado)
    const aiResponse = await generateChatResponse(body, history);

    // 5. Salvar resposta da IA
    dbService.addMessage(sessionId, 'assistant', aiResponse.message);

    // 6. Verificar se a resposta da IA indica a conclusão de um fluxo ou necessidade de documento
    // Nota: Em uma implementação futura, a IA pode retornar uma 'action'.
    // Por enquanto, o whatsappService apenas envia o texto.
    
    // 7. Enviar resposta de volta pelo WhatsApp
    await whatsappService.sendMessage(from, aiResponse.message);

    return { sessionId, response: aiResponse.message };
  },

  /**
   * Envia uma mensagem via WhatsApp para um destinatário específico.
   */
  sendMessage: async (to: string, body: string) => {
    try {
      const message = await client.messages.create({
        from: whatsappNumber,
        to,
        body,
      });
      return { success: true, sid: message.sid };
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      throw new Error('Falha no envio da mensagem via Twilio');
    }
  },

  /**
   * Middleware de validação do Twilio (Opcional, para segurança em produção)
   */
  validateRequest: (req: any) => {
    const signature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const params = req.body;
    return twilio.validateRequest(authToken!, signature, url, params);
  }
};

