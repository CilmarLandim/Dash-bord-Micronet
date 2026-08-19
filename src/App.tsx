import React, { useState, useEffect } from 'react';
import { Clock, FileText, Printer, Info, LayoutDashboard, Key } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import AdminDashboard from './components/AdminDashboard';
import { trpc } from './services/trpc';
import { toast } from 'sonner';
import ScrumBoard from './components/ScrumBoard';
import ExpenseManager from './components/ExpenseManager';
import StatisticsBoard from './components/StatisticsBoard';

interface GeneratedDocument {
  id: string;
  fileName: string;
  format: 'pdf' | 'docx';
}

function App() {
  const [sessionId, setSessionId] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'chat' | 'scrum' | 'expenses' | 'statistics' | 'info' | 'admin'>('chat');
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
      <div className="flex items-center justify-center min-h-screen bg-neutral-light p-4 font-body">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full border border-slate-200">
          <div className="text-center mb-10">
            <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
              <Key className="w-10 h-10 text-primary -rotate-3" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 font-display tracking-tight">Ativação Requerida</h1>
            <p className="text-slate-500 mt-2">Insira sua chave de licença <span className="text-primary font-bold">Micronet Era</span> para iniciar.</p>
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
              className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
            >
              {isValidating ? (
                <div className="signal-bars !h-4">
                  <div className="signal-bar !bg-white"></div>
                  <div className="signal-bar !bg-white"></div>
                  <div className="signal-bar !bg-white"></div>
                  <div className="signal-bar !bg-white"></div>
                </div>
              ) : 'Ativar Sistema'}
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
    <div className="min-h-screen bg-neutral-light p-4 font-body">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary p-3 rounded-xl shadow-lg shadow-primary/20">
                <div className="signal-bars !h-6">
                  <div className="signal-bar !bg-white !w-1"></div>
                  <div className="signal-bar !bg-white !w-1"></div>
                  <div className="signal-bar !bg-white !w-1"></div>
                  <div className="signal-bar !bg-white !w-1"></div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-primary font-display tracking-tight">MICRONET</h1>
                <p className="text-sm font-bold text-secondary uppercase tracking-widest">Solutions Era</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-secondary/10 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tempo de Sessão</p>
                  <p className="text-xl font-bold text-slate-800 font-mono">{formatTime(elapsedTime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              💬 Atendimento
            </button>
            <button
              onClick={() => setActiveTab('scrum')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'scrum' ? 'bg-secondary text-white shadow-lg shadow-secondary/30 scale-105' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              Scrum
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'expenses' ? 'bg-secondary text-white shadow-lg shadow-secondary/30 scale-105' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              Despesas
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 ${activeTab === 'statistics' ? 'bg-secondary text-white shadow-lg shadow-secondary/30 scale-105' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              Estatísticas
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'info'
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Info className="w-5 h-5 inline mr-2" />
              Sobre
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/30 scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Key className="w-5 h-5 inline mr-2" />
              Painel
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

            {activeTab === 'scrum' && <ScrumBoard />}
            {activeTab === 'expenses' && <ExpenseManager />}
            {activeTab === 'statistics' && <StatisticsBoard />}

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
              <AdminDashboard />
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
