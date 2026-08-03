import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Loader, X } from 'lucide-react';
import { ChatMessage } from '../types';
import { trpc } from '../services/trpc';
import { voiceService } from '../services/voiceService';
import { flowService, FlowType } from '../services/flowService';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  sessionId: string;
  onDocumentGenerated?: (documentId: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId,
  onDocumentGenerated,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeFlow, setActiveFlow] = useState<FlowType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // tRPC Mutation para gerar documento
  const generateDocMutation = trpc.chat.generateDocument.useMutation({
    onSuccess: (doc) => {
      toast.success('Documento gerado com sucesso!');
      onDocumentGenerated?.(doc.id);
      
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📄 Seu documento foi gerado com sucesso! Você pode encontrá-lo em: ${doc.filePath}`,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, assistantMessage]);
      voiceService.speak('Seu documento foi gerado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao gerar documento');
    }
  });

  // tRPC Mutation para enviar mensagem
  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (response) => {
      // Adiciona resposta da IA
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        type: 'text',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Fala a resposta
      setIsSpeaking(true);
      voiceService.speak(response.message, () => {
        setIsSpeaking(false);
      });

      // Se gerou documento, notifica (ajustado para a estrutura do tRPC)
      // Nota: No tRPC router atual, o retorno não inclui 'action' explicitamente como no Axios,
      // mas podemos inferir ou ajustar o router depois. Por enquanto mantemos a lógica.
      if ((response as any).action === 'generate_document' && (response as any).documentData?.id) {
        onDocumentGenerated?.((response as any).documentData.id);
      }
    },
    onError: (error) => {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao processar sua mensagem');
    }
  });

  // Auto-scroll para o final das mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensagem inicial
  useEffect(() => {
    const initialMessage: ChatMessage = {
      id: '0',
      role: 'assistant',
      content: 'Olá! Bem-vindo ao atendimento virtual da Micronet. Como posso ajudá-lo hoje?',
      timestamp: new Date(),
      type: 'text',
    };
    setMessages([initialMessage]);

    // Fala a mensagem inicial
    voiceService.speak(initialMessage.content);
  }, []);

  const handleSendMessage = async () => {
    const textToSend = inputValue.trim();
    if (!textToSend) return;

    // Adiciona mensagem do usuário
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    try {
      // Se há fluxo ativo, processa como resposta do fluxo (Lógica local por enquanto)
      if (activeFlow) {
        const result = flowService.processAnswer(textToSend);
        
        if (!result.valid) {
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `❌ ${result.error || 'Resposta inválida'}. Por favor, tente novamente.`,
            timestamp: new Date(),
            type: 'text',
          };
          setMessages((prev) => [...prev, errorMessage]);
          toast.error(result.error);
        } else if (flowService.isFlowCompleted()) {
          const flowData = flowService.getCollectedData();
          const currentFlowType = activeFlow;
          
          // Gera documento via tRPC
          generateDocMutation.mutate({
            sessionId,
            type: currentFlowType as any,
            data: flowData
          });

          const completedMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '✅ Fluxo concluído! Gerando seu documento...',
            timestamp: new Date(),
            type: 'text',
          };
          setMessages((prev) => [...prev, completedMessage]);
          setActiveFlow(null);
          flowService.resetFlow();
          
          voiceService.speak(completedMessage.content);
        } else {
          const nextQuestion = flowService.getNextQuestion();
          const nextMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: nextQuestion,
            timestamp: new Date(),
            type: 'text',
          };
          setMessages((prev) => [...prev, nextMessage]);
          
          setIsSpeaking(true);
          voiceService.speak(nextQuestion, () => {
            setIsSpeaking(false);
          });
        }
      } else {
        // Envia para o backend via tRPC
        sendMessageMutation.mutate({
          sessionId,
          message: textToSend,
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao processar sua mensagem');
    } finally {
      inputRef.current?.focus();
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setIsListening(true);

    voiceService.startListening(
      (transcript, isFinal) => {
        setInputValue(transcript);

        if (isFinal) {
          setIsListening(false);
          setTimeout(() => {
            if (transcript.trim()) {
              setInputValue(transcript);
              handleSendMessage();
            }
          }, 500);
        }
      },
      (error) => {
        toast.error(`Erro de voz: ${error}`);
        setIsListening(false);
      }
    );
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    }
  };

  const startFlow = (flowType: FlowType) => {
    flowService.initFlow(flowType);
    setActiveFlow(flowType);
    const question = flowService.getNextQuestion();
    
    const flowMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Iniciando fluxo de ${flowType}. ${question}`,
      timestamp: new Date(),
      type: 'text',
    };
    
    setMessages((prev) => [...prev, flowMessage]);
    voiceService.speak(flowMessage.content);
  };

  const cancelFlow = () => {
    setActiveFlow(null);
    flowService.resetFlow();
    
    const cancelMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Fluxo cancelado. Como posso ajudá-lo?',
      timestamp: new Date(),
      type: 'text',
    };
    
    setMessages((prev) => [...prev, cancelMessage]);
    voiceService.speak(cancelMessage.content);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-primary text-white p-5 rounded-t-lg flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <div className="signal-bars !h-4">
              <div className="signal-bar !bg-white"></div>
              <div className="signal-bar !bg-white"></div>
              <div className="signal-bar !bg-white"></div>
              <div className="signal-bar !bg-white"></div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold font-display">Micronet Agent</h2>
            <p className="text-xs text-white/70">Conectividade e Suporte</p>
          </div>
        </div>
        {activeFlow && (
          <div className="bg-accent text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Fluxo: {activeFlow}
          </div>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {sendMessageMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-3 rounded-lg rounded-bl-none flex items-center gap-3">
              <div className="signal-bars">
                <div className="signal-bar"></div>
                <div className="signal-bar"></div>
                <div className="signal-bar"></div>
                <div className="signal-bar"></div>
              </div>
              <span className="text-xs font-medium text-primary animate-pulse">Conectando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fluxo Ativo */}
      {activeFlow && (
        <div className="border-t border-yellow-200 bg-yellow-50 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-yellow-800">Fluxo ativo: {activeFlow}</span>
          </div>
          <button
            onClick={cancelFlow}
            className="text-yellow-700 hover:text-yellow-900 transition"
            title="Cancelar fluxo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        {!activeFlow && (
          <div className="w-full grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => startFlow('curriculum')}
              className="px-2 py-2 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-bold border border-primary/20"
            >
              📄 Currículo
            </button>
            <button
              onClick={() => startFlow('contact')}
              className="px-2 py-2 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-bold border border-primary/20"
            >
              📞 Contato
            </button>
            <button
              onClick={() => startFlow('second_copy')}
              className="px-2 py-2 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-bold border border-primary/20"
            >
              🔄 2ª Via
            </button>
            <button
              onClick={() => startFlow('research')}
              className="px-2 py-2 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-bold border border-primary/20"
            >
              🎓 Pesquisa
            </button>
            <button
              onClick={() => startFlow('report')}
              className="px-2 py-2 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-bold border border-primary/20"
            >
              📊 Relatório
            </button>
            <button
              onClick={() => startFlow('proposal')}
              className="px-2 py-2 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-bold border border-primary/20"
            >
              💼 Proposta
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={activeFlow ? 'Digite sua resposta...' : 'Digite sua mensagem...'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sendMessageMutation.isPending || isListening}
          />

          {/* Botão de Voz */}
          <button
            onClick={handleVoiceInput}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              isListening
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            title={isListening ? 'Parar de ouvir' : 'Iniciar reconhecimento de voz'}
            disabled={sendMessageMutation.isPending}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Botão de Som */}
          <button
            onClick={toggleSpeaking}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              isSpeaking
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            title={isSpeaking ? 'Silenciar' : 'Ativar som'}
          >
            {isSpeaking ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {/* Botão de Envio */}
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition font-bold disabled:opacity-50 shadow-md shadow-secondary/20"
            disabled={!inputValue.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
