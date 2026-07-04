import React, { useState, useEffect } from 'react';
import { Clock, FileText, Printer, Info } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import { toast } from 'sonner';
import trpc from './services/trpcClient';

function App() {
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'info'>('chat');
  const [micronetInfo, setMicronetInfo] = useState<any>(null);

  // Inicializa sessão
  useEffect(() => {
    const initSession = async () => {
      try {
        const { sessionId } = await trpc.chat.startSession.mutate();
        setSessionId(sessionId);

        // Carrega informações da Micronet
        const infoResult = await trpc.info.getMicronetInfo.query();
        setMicronetInfo(infoResult.data);

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
        await trpc.time.recordTime.mutate({
          sessionId,
          seconds: 30,
        });
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

  const handleDocumentGenerated = (documentId: string) => {
    toast.success(`Documento gerado: ${documentId}`);
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-800">{formatTime(elapsedTime)}</span>
              </div>
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
                  Info
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat */}
          <div className="lg:col-span-3">
            {activeTab === 'chat' ? (
              <ChatInterface sessionId={sessionId} onDocumentGenerated={handleDocumentGenerated} />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Informações da Micronet</h2>

                {micronetInfo && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Sobre</h3>
                      <p className="text-gray-600">{micronetInfo.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Versão</h3>
                      <p className="text-gray-600">{micronetInfo.version}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Recursos</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {micronetInfo.features?.map((feature: string, idx: number) => (
                          <li key={idx} className="text-gray-600">
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Contato</h3>
                      <p className="text-gray-600">Email: {micronetInfo.contact?.email}</p>
                      <p className="text-gray-600">Telefone: {micronetInfo.contact?.phone}</p>
                      <p className="text-gray-600">Website: {micronetInfo.contact?.website}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Estatísticas */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Sessão</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ID da Sessão:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-800 font-mono">
                    {sessionId.substring(0, 8)}...
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tempo:</span>
                  <span className="font-semibold text-blue-600">{formatTime(elapsedTime)}</span>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Ações Rápidas</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-semibold text-sm">
                  <FileText className="w-4 h-4" />
                  Gerar Documento
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-semibold text-sm">
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Status</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 font-semibold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
