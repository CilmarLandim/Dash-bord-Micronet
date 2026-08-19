import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './context';
import { whatsappService } from './services/whatsappService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve documentos estáticos
app.use('/documents', express.static(path.join(process.cwd(), 'public/documents')));

// Webhook do WhatsApp (Twilio)
app.post('/api/whatsapp/webhook', async (req, res) => {
  const { From, Body } = req.body;
  
  if (!From || !Body) {
    return res.status(400).send('Dados incompletos');
  }

  try {
    // Processamento assíncrono para responder ao Twilio rapidamente (TwiML)
    // Nota: O WhatsApp exige resposta em 15s. A IA Claude costuma responder em 2-5s.
    await whatsappService.processIncomingMessage(From, Body);
    
    // Responde com TwiML vazio (já enviamos a resposta via API)
    res.set('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    console.error('Erro no webhook do WhatsApp:', error);
    res.status(500).send('Erro interno');
  }
});

// tRPC middleware
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota raiz
app.get('/', (_req, res) => {
  res.json({
    name: 'Micronet Agent API',
    version: '1.0.0',
    status: 'running',
  });
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📡 tRPC disponível em http://localhost:${PORT}/api/trpc`);
});

export default app;
