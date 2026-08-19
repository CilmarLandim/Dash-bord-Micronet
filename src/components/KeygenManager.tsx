import React, { useState } from 'react';
import { Key, Plus, Trash2, CheckCircle, XCircle, Copy } from 'lucide-react';
import { trpc } from '../services/trpc';
import { toast } from 'sonner';

export const KeygenManager: React.FC = () => {
  const [prefix, setPrefix] = useState('MICRONET');
  
  const utils = trpc.useUtils();
  const keysQuery = trpc.keygen.list.useQuery();
  
  const generateMutation = trpc.keygen.generate.useMutation({
    onSuccess: () => {
      toast.success('Nova chave gerada com sucesso!');
      utils.keygen.list.invalidate();
    },
    onError: () => toast.error('Erro ao gerar chave')
  });

  const revokeMutation = trpc.keygen.revoke.useMutation({
    onSuccess: () => {
      toast.success('Chave revogada');
      utils.keygen.list.invalidate();
    },
    onError: () => toast.error('Erro ao revogar chave')
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Chave copiada para a área de transferência!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 font-display tracking-tight">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Key className="text-primary w-6 h-6" />
            </div>
            Keygen Era
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Controle de licenciamento e acesso ao sistema.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div className="flex-1">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prefixo da Chave</label>
          <input 
            type="text" 
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-lg"
            placeholder="Ex: MICRONET"
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={() => generateMutation.mutate({ prefix })}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Gerar Licença
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-700 border-b pb-2">Chaves Ativas</h3>
        
        {keysQuery.isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando chaves...</div>
        ) : keysQuery.data?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded italic">Nenhuma chave gerada ainda.</div>
        ) : (
          keysQuery.data?.map((key) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded hover:border-blue-300 transition group">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <code className="font-mono font-bold text-gray-800">{key}</code>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                <button 
                  onClick={() => copyToClipboard(key)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Copiar chave"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => revokeMutation.mutate({ key })}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Revogar chave"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-yellow-800 font-bold flex items-center gap-2 mb-1">
          <XCircle className="w-4 h-4" />
          Atenção
        </h4>
        <p className="text-sm text-yellow-700">
          As chaves geradas são persistidas no banco local do agente e continuam disponíveis após reinicializações. 
          Restrinja o acesso a este painel quando publicar o sistema em produção.
        </p>
      </div>
    </div>
  );
};
