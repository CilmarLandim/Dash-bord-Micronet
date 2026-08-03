import React, { useState, useEffect } from 'react';
import { Clock, FileText, Printer, Info, LayoutDashboard, Key } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import { KeygenManager } from './components/KeygenManager';
import { trpc } from './services/trpc';
import { toast } from 'sonner';

interface GeneratedDocument {
  id: string;
  fileName: string;
  format: 'pdf' | 'docx';
}

function App() {
  const [sessionId, setSessionId] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'info' | 'admin'>('chat');
  const [licenseKey, setLicenseKey] = useState<string>(localStorage.getItem('micronet_license') || '');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDocument | null>(null);

  // Inicializa sessão via tRPC
  const startSessionMutation = trpc.chat.startSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
    },
    onError: (error) => {
      console.error('Erro ao iniciar sessão:', error);
      toast.error('Erro ao iniciar sessão');
    }
  });

  // Valida a chave de licença
  const validateMutation = trpc.keygen.validate.useMutation({
    onSuccess: (data) => {
      if (data.isValid) {
        setIsAuthorized(true);
        localStorage.setItem('micronet_license', licenseKey);
        startSessionMutation.mutate();
      } else {
        setIsAuthorized(false);
        toast.error('Chave de licença inválida');
      }
      setIsValidating(false);
    },
    onError: () => {
      toast.error('Erro ao validar licença');
      setIsValidating(false);
    }
  });

  const handleValidateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;
    setIsValidating(true);
    validateMutation.mutate({ key: licenseKey });
  };

  useEffect(() => {
    if (licenseKey) {
      setIsValidating(true);
      validateMutation.mutate({ key: licenseKey });
    }
  }, []);

  // Controla tempo decorrido
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  // Registra tempo periodicamente via tRPC
  const recordTimeMutation = trpc.chat.recordTime.useMutation();

  useEffect(() => {
    if (!sessionId || elapsedTime === 0 || elapsedTime % 30 !== 0) return;
    
    recordTimeMutation.mutate({
      sessionId,
      seconds: elapsedTime
    });
  }, [sessionId, elapsedTime]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDocumentGenerated = (documentId: string) => {
    setGeneratedDocument({
      id: documentId,
      fileName: `documento_${documentId}`,
      format: 'pdf',
    });
    toast.success(`Documento gerado com sucesso!`);
  };

  if (!isAuthorized && activeTab !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full border border-blue-100">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Ativação Requerida</h1>
            <p className="text-gray-600">Insira sua chave de licença Micronet para continuar.</p>
          </div>
          
          <form onSubmit={handleValidateLicense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chave de Licença</label>
              <input 
                type="text" 
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                placeholder="MICRONET-XXXX-XXXX"
                disabled={isValidating}
              />
            </div>
            <button 
              type="submit"
              disabled={isValidating || !licenseKey}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : 'Ativar Agora'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
             <button 
              onClick={() => setActiveTab('admin')}
              className="text-sm text-gray-400 hover:text-gray-600 transition flex items-center gap-1"
            >
              <Info className="w-4 h-4" />
              Acesso Administrativo (Demo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (startSessionMutation.isPending) {
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
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === 'admin'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Key className="w-5 h-5 inline mr-2" />
              Admin
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
                onDocumentGenerated={handleDocumentGenerated}
              />
            )}

            {activeTab === 'info' && (
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                <h2 className="text-2xl font-bold text-gray-800">Sobre a Micronet</h2>
                <div className="space-y-4 text-gray-600">
                   <p>A Micronet é sua parceira em soluções digitais e serviços de escritório.</p>
                   <div>
                      <h3 className="font-bold text-gray-700">Serviços Disponíveis:</h3>
                      <ul className="list-disc list-inside ml-4">
                        <li>Impressão e Cópias</li>
                        <li>Geração de Currículos</li>
                        <li>Segunda Via de Documentos</li>
                        <li>Pesquisas Escolares</li>
                        <li>Relatórios e Propostas</li>
                      </ul>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && (
              <KeygenManager />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sessão Ativa</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-mono">{sessionId.substring(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className="text-green-600 font-bold">Conectado</span>
                </div>
              </div>
            </div>
            
            {generatedDocument && (
               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Documento Gerado
                  </h4>
                  <p className="text-xs text-green-700 mb-3">{generatedDocument.fileName}.pdf</p>
                  <button className="w-full bg-green-600 text-white py-2 rounded text-sm font-bold hover:bg-green-700 transition">
                    Visualizar / Baixar
                  </button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
