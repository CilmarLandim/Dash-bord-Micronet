import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Loader, X } from 'lucide-react';
import { ChatMessage, DocumentActionPayload, OperationalSnapshotView, SuggestedOperationalAction } from '../types';
import { trpc } from '../services/trpc';
import { voiceService } from '../services/voiceService';
import { flowService, FlowType } from '../services/flowService';
import { toast } from 'sonner';

interface GeneratedDocumentSummary {
  id: string;
  url: string;
  format: 'pdf' | 'docx';
}

interface ChatInterfaceProps {
  sessionId: string;
  onDocumentGenerated?: (document: GeneratedDocumentSummary) => void;
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
  const [suggestedActions, setSuggestedActions] = useState<SuggestedOperationalAction[]>([]);
  const [operationalSnapshot, setOperationalSnapshot] = useState<OperationalSnapshotView | null>(null);
  const [operationalPlan, setOperationalPlan] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setSuggestedActions(response.suggestedActions ?? []);
      setOperationalSnapshot(response.operationalSnapshot ?? null);
      setOperationalPlan(response.reasoning ?? []);

      // Fala a resposta
      setIsSpeaking(true);
      voiceService.speak(response.message, () => {
        setIsSpeaking(false);
      });

      // A geração de documentos do fluxo supervisionado é tratada após a confirmação
      // em executeOperationalAction, pois o arquivo não pode existir antes dela.
    },
    onError: (error) => {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao processar sua mensagem');
    }
  });

  const briefingQuery = trpc.chat.getBriefing.useQuery(undefined, { enabled: false });

  const executeOperationalActionMutation = trpc.chat.executeOperationalAction.useMutation({
    onSuccess: (result) => {
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setSuggestedActions([]);
      setOperationalSnapshot(result.operationalSnapshot);
      setOperationalPlan(['Ação confirmada e registrada na operação.']);
      if ('document' in result && result.document) {
        onDocumentGenerated?.({
          id: result.document.id,
          url: result.document.url,
          format: result.document.format,
        });
        toast.success(`Documento ${result.document.format.toUpperCase()} gerado com sucesso`);
      } else {
        toast.success('Ação operacional executada');
      }
    },
    onError: () => toast.error('Não foi possível executar a ação operacional'),
  });

  const handleBriefing = async () => {
    const result = await briefingQuery.refetch();
    if (!result.data) {
      toast.error('Não foi possível gerar o briefing operacional');
      return;
    }

    const briefingMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: result.data.message,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prev) => [...prev, briefingMessage]);
    setSuggestedActions(result.data.suggestedActions ?? []);
    setOperationalSnapshot(result.data.operationalSnapshot ?? null);
    setOperationalPlan(result.data.reasoning ?? []);
  };

  const confirmSuggestedAction = (suggestedAction: SuggestedOperationalAction) => {
    if (suggestedAction.type === 'create_task') {
      executeOperationalActionMutation.mutate({ sessionId, action: 'create_task', payload: suggestedAction.payload });
      return;
    }
    if (suggestedAction.type === 'create_expense') {
      executeOperationalActionMutation.mutate({ sessionId, action: 'create_expense', payload: suggestedAction.payload });
      return;
    }
    executeOperationalActionMutation.mutate({ sessionId, action: 'generate_document', payload: suggestedAction.payload });
  };

  const proposeDocxGeneration = (type: FlowType, data: Record<string, unknown>) => {
    const payload: DocumentActionPayload = { type, format: 'docx', data };
    const action: SuggestedOperationalAction = {
      id: `generate-docx-${Date.now()}`,
      type: 'generate_document',
      label: 'Confirmar geração do DOCX',
      description: 'Gerar o arquivo DOCX com os dados coletados neste atendimento.',
      payload,
      requiresConfirmation: true,
    };
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Fluxo concluído. Revise e confirme a geração do seu documento DOCX.',
      timestamp: new Date(),
      type: 'text',
    };
    setMessages((prev) => [...prev, assistantMessage]);
    setSuggestedActions([action]);
  };

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
          
          proposeDocxGeneration(currentFlowType, flowData);
          setActiveFlow(null);
          flowService.resetFlow();
          voiceService.speak('Fluxo concluído. Confirme a geração do documento DOCX.');
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
        {activeFlow ? (
          <div className="bg-accent text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Fluxo: {activeFlow}
          </div>
        ) : (
          <button
            onClick={handleBriefing}
            disabled={briefingQuery.isFetching}
            className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/25 disabled:opacity-60"
          >
            {briefingQuery.isFetching ? 'Analisando...' : 'Briefing'}
          </button>
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

        {operationalSnapshot && (
          <section className="rounded-lg border border-blue-200 bg-blue-50/80 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Memória operacional</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-md bg-white p-2"><strong className="block text-sm text-slate-800">{operationalSnapshot.tasks.todo + operationalSnapshot.tasks.inProgress}</strong><span className="text-slate-500">tarefas abertas</span></div>
              <div className="rounded-md bg-white p-2"><strong className="block text-sm text-slate-800">R$ {operationalSnapshot.expenses.pendingTotal.toFixed(2)}</strong><span className="text-slate-500">a pagar</span></div>
              <div className="rounded-md bg-white p-2"><strong className="block text-sm text-slate-800">{operationalSnapshot.documents.total}</strong><span className="text-slate-500">documentos</span></div>
            </div>
            {operationalPlan.length > 0 && (
              <div className="mt-3 border-t border-blue-100 pt-2">
                <p className="text-xs font-bold text-slate-700">Plano do agente</p>
                <ol className="mt-1 space-y-1 pl-4 text-xs text-slate-600">
                  {operationalPlan.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
                </ol>
              </div>
            )}
          </section>
        )}

        {suggestedActions.length > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Ação supervisionada</p>
            {suggestedActions.map((suggestedAction) => (
              <div key={suggestedAction.id} className="mt-2 rounded-md bg-white p-3 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">{suggestedAction.description}</p>
                <button
                  onClick={() => confirmSuggestedAction(suggestedAction)}
                  disabled={executeOperationalActionMutation.isPending}
                  className="mt-2 rounded-md bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {executeOperationalActionMutation.isPending ? 'Executando...' : suggestedAction.label}
                </button>
              </div>
            ))}
          </div>
        )}

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
