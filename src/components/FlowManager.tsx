import React, { useState, useEffect } from 'react';
import { FlowType, flowService } from '../services/flowService';
import { toast } from 'sonner';

interface FlowManagerProps {
  onFlowStart: (flowType: FlowType) => void;
  onFlowComplete: (data: Record<string, any>) => void;
  onMessage: (message: string) => void;
}

export const FlowManager: React.FC<FlowManagerProps> = ({
  onFlowStart,
  onFlowComplete,
  onMessage,
}) => {
  const [activeFlow, setActiveFlow] = useState<FlowType | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const flows: { type: FlowType; label: string; emoji: string; description: string }[] = [
    {
      type: 'curriculum',
      label: 'Currículo',
      emoji: '📄',
      description: 'Gere seu currículo profissional',
    },
    {
      type: 'contact',
      label: 'Contato',
      emoji: '📞',
      description: 'Envie uma mensagem de contato',
    },
    {
      type: 'second_copy',
      label: 'Segunda Via',
      emoji: '🔄',
      description: 'Solicite segunda via de documento',
    },
    {
      type: 'research',
      label: 'Pesquisa Escolar',
      emoji: '🎓',
      description: 'Gere uma pesquisa escolar',
    },
    {
      type: 'report',
      label: 'Relatório',
      emoji: '📊',
      description: 'Crie um relatório profissional',
    },
    {
      type: 'proposal',
      label: 'Proposta',
      emoji: '💼',
      description: 'Gere uma proposta comercial',
    },
  ];

  const startFlow = (flowType: FlowType) => {
    const flow = flowService.initFlow(flowType);
    setActiveFlow(flowType);
    const question = flowService.getNextQuestion();
    setCurrentQuestion(question);
    onFlowStart(flowType);
    onMessage(`Iniciando fluxo de ${flows.find(f => f.type === flowType)?.label}. ${question}`);
  };

  const processAnswer = (answer: string) => {
    setIsProcessing(true);

    try {
      const result = flowService.processAnswer(answer);

      if (!result.valid) {
        toast.error(result.error || 'Resposta inválida');
        onMessage(`❌ ${result.error || 'Resposta inválida'}`);
        setIsProcessing(false);
        return;
      }

      if (flowService.isFlowCompleted()) {
        const data = flowService.getCollectedData();
        onMessage('✅ Fluxo concluído com sucesso! Gerando documento...');
        onFlowComplete(data);
        setActiveFlow(null);
        setCurrentQuestion('');
        flowService.resetFlow();
      } else {
        const nextQuestion = flowService.getNextQuestion();
        setCurrentQuestion(nextQuestion);
        onMessage(nextQuestion);
      }
    } catch (error) {
      console.error('Erro ao processar resposta:', error);
      toast.error('Erro ao processar resposta');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelFlow = () => {
    setActiveFlow(null);
    setCurrentQuestion('');
    flowService.resetFlow();
    onMessage('Fluxo cancelado.');
  };

  if (activeFlow) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">
            {flows.find(f => f.type === activeFlow)?.emoji} Fluxo Ativo
          </h3>
          <button
            onClick={cancelFlow}
            className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
            disabled={isProcessing}
          >
            Cancelar
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">{currentQuestion}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Fluxos Disponíveis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {flows.map((flow) => (
          <button
            key={flow.type}
            onClick={() => startFlow(flow.type)}
            className="p-3 text-left rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{flow.emoji}</span>
              <div>
                <h4 className="font-semibold text-gray-800">{flow.label}</h4>
                <p className="text-xs text-gray-600">{flow.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FlowManager;
