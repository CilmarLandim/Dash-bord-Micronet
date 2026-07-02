import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Loader } from 'lucide-react';
import { ChatMessage } from '../types';
import { chatAPI } from '../services/api';
import { voiceService } from '../services/voiceService';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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
    setInputValue('');
    setIsLoading(true);

    try {
      // Envia para a IA
      const response = await chatAPI.sendMessage(sessionId, inputValue);

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

      // Se gerou documento, notifica
      if (response.action === 'generate_document' && response.documentData?.id) {
        onDocumentGenerated?.(response.documentData.id);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
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

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">Atendimento Virtual Micronet</h2>
        <p className="text-sm text-blue-100">Fale ou digite sua pergunta</p>
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

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite sua mensagem..."
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
