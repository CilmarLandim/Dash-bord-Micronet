import React, { useState, useEffect } from 'react';
import { Clock, FileText, Printer, Info } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import { chatAPI, timeAPI } from './services/api';
import { toast } from 'sonner';

function App() {
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'info'>('chat');

  // Inicializa sessão
  useEffect(() => {
    const initSession = async () => {
      try {
        const { sessionId } = await chatAPI.startSession();
        setSessionId(sessionId);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao iniciar sessão:', error);
        toast.error('Erro ao iniciar sessão');
      }
    };

    initSession();
  }, []);

  // Controla tempo decorrido
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Registra tempo periodicamente
  useEffect(() => {
    if (!sessionId || elapsedTime === 0 || elapsedTime % 30 !== 0) return;

    const recordTime = async () => {
      try {
        await timeAPI.recordTime(sessionId, elapsedTime);
      } catch (error) {
        console.error('Erro ao registrar tempo:', error);
      }
    };

    recordTime();
  }, [sessionId, elapsedTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-semibold">Iniciando atendimento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Micronet</h1>
              <p className="text-gray-600">Agente Virtual de Atendimento</p>
            </div>
            <div className="flex items-center gap-4 bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Tempo de uso</p>
                  <p className="text-lg font-bold text-gray-800">{formatTime(elapsedTime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === 'info'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Info className="w-5 h-5 inline mr-2" />
              Informações
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat */}
          <div className="lg:col-span-2">
            {activeTab === 'chat' && sessionId && (
              <ChatInterface
                sessionId={sessionId}
                onDocumentGenerated={(docId) => {
                  toast.success(`Documento ${docId} gerado com sucesso!`);
                }}
              />
            )}

            {activeTab === 'info' && (
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Sobre a Micronet</h2>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Serviços</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Printer className="w-5 h-5 text-blue-600" />
                      <span>Impressão profissional</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Cópias e encadernação</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>Design gráfico</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Contato</h3>
                  <p className="text-gray-600">📞 (11) 3000-0000</p>
                  <p className="text-gray-600">📧 contato@micronet.com.br</p>
                  <p className="text-gray-600">📍 Rua Principal, 123 - São Paulo, SP</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Horário de Funcionamento</h3>
                  <p className="text-gray-600">Segunda a Sexta: 9h - 18h</p>
                  <p className="text-gray-600">Sábado: 9h - 13h</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Fluxos disponíveis */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Fluxos Disponíveis</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 transition text-gray-700">
                  📄 Currículo
                </button>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 transition text-gray-700">
                  📞 Contato
                </button>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 transition text-gray-700">
                  🔄 Segunda Via
                </button>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 transition text-gray-700">
                  🎓 Pesquisa Escolar
                </button>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 transition text-gray-700">
                  📊 Relatório
                </button>
                <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 transition text-gray-700">
                  💼 Proposta
                </button>
              </div>
            </div>

            {/* Dicas */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 Dica</h4>
              <p className="text-sm text-yellow-700">
                Você pode usar voz ou digitar. Clique no ícone do microfone para começar a falar!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
