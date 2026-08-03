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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Key className="text-blue-600" />
            Gerenciador de Chaves (Keygen)
          </h2>
          <p className="text-gray-600 text-sm">Gere e gerencie licenças de acesso para o agente.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex-1">
          <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Prefixo da Chave</label>
          <input 
            type="text" 
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: MICRONET"
          />
        </div>
        <div className="flex items-end">
          <button 
            onClick={() => generateMutation.mutate({ prefix })}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Gerar Nova Chave
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
          As chaves geradas são armazenadas em memória no servidor e serão perdidas se o servidor for reiniciado. 
          Para persistência a longo prazo, conecte um banco de dados.
        </p>
      </div>
    </div>
  );
};
