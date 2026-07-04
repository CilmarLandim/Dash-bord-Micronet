import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Loader, X } from 'lucide-react';
import { ChatMessage } from '../types';
import { voiceService } from '../services/voiceService';
import { flowService, FlowType } from '../services/flowService';
import { toast } from 'sonner';
import trpc from '../services/trpcClient';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeFlow, setActiveFlow] = useState<FlowType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!inputValue.trim()) return;

    // Adiciona mensagem do usuário
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Se há fluxo ativo, processa como resposta do fluxo
      if (activeFlow) {
        const result = flowService.processAnswer(userInput);

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
          const data = flowService.getCollectedData();

          // Gera documento
          try {
            const documentResult = await trpc.documents.generate.mutate({
              type: activeFlow,
              data,
              format: 'pdf',
            });

            const completedMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `✅ Fluxo concluído! Seu documento foi gerado com sucesso. ID: ${documentResult.document.id}`,
              timestamp: new Date(),
              type: 'text',
            };
            setMessages((prev) => [...prev, completedMessage]);
            onDocumentGenerated?.(documentResult.document.id);
            toast.success('Documento gerado com sucesso!');

            // Fala a mensagem de conclusão
            voiceService.speak(completedMessage.content);
          } catch (error) {
            console.error('Erro ao gerar documento:', error);
            const errorMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: '❌ Erro ao gerar documento. Por favor, tente novamente.',
              timestamp: new Date(),
              type: 'text',
            };
            setMessages((prev) => [...prev, errorMsg]);
            toast.error('Erro ao gerar documento');
          }

          setActiveFlow(null);
          flowService.resetFlow();
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

          // Fala a próxima pergunta
          setIsSpeaking(true);
          voiceService.speak(nextQuestion, () => {
            setIsSpeaking(false);
          });
        }
      } else {
        // Envia para a IA via tRPC
        try {
          const response = await trpc.chat.sendMessage.mutate({
            sessionId,
            message: userInput,
          });

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
        } catch (error) {
          console.error('Erro ao enviar mensagem:', error);
          const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '❌ Erro ao processar sua mensagem. Por favor, tente novamente.',
            timestamp: new Date(),
            type: 'text',
          };
          setMessages((prev) => [...prev, errorMsg]);
          toast.error('Erro ao processar sua mensagem');
        }
      }
    } catch (error) {
      console.error('Erro geral:', error);
      toast.error('Erro ao processar sua mensagem');
    } finally {
      setIsLoading(false);
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
          // Auto-envia após reconhecimento final
          setTimeout(() => {
            if (transcript.trim()) {
              setInputValue(transcript);
              // Simula envio
              const userMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: transcript,
                timestamp: new Date(),
                type: 'voice',
              };
              setMessages((prev) => [...prev, userMessage]);
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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Atendimento Virtual Micronet</h2>
          <p className="text-sm text-blue-100">Fale ou digite sua pergunta</p>
        </div>
        {activeFlow && (
          <div className="bg-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
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

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
              <Loader className="w-5 h-5 animate-spin" />
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
          <div className="w-full grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => startFlow('curriculum')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-semibold"
            >
              📄 Currículo
            </button>
            <button
              onClick={() => startFlow('contact')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-semibold"
            >
              📞 Contato
            </button>
            <button
              onClick={() => startFlow('second_copy')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-semibold"
            >
              🔄 2ª Via
            </button>
            <button
              onClick={() => startFlow('research')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-semibold"
            >
              🎓 Pesquisa
            </button>
            <button
              onClick={() => startFlow('report')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-semibold"
            >
              📊 Relatório
            </button>
            <button
              onClick={() => startFlow('proposal')}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-semibold"
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
            disabled={isLoading || isListening}
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
            disabled={isLoading}
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
