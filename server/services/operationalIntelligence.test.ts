import { describe, expect, it } from 'vitest';
import type { OperationalSnapshot } from './db';
import { analyzeOperationalIntent, buildOperationalBriefing, formatOperationalContext } from './operationalIntelligence';

const snapshot: OperationalSnapshot = {
  generatedAt: '2026-08-20T12:00:00.000Z',
  sessions: { total: 8, totalSeconds: 3600 },
  messages: { total: 42 },
  documents: { total: 3, recent: [] },
  tasks: { todo: 1, inProgress: 2, done: 4, total: 7 },
  expenses: { pendingCount: 1, pendingTotal: 250.5, activeTotal: 600.5 },
};

describe('operationalIntelligence', () => {
  it('gera um briefing baseado no estado operacional real', () => {
    const response = buildOperationalBriefing(snapshot);

    expect(response.action).toBe('operational_briefing');
    expect(response.message).toContain('3 tarefas em aberto');
    expect(response.message).toContain('R$ 250.50');
    expect(response.message).toContain('8 sessões no histórico');
    expect(response.operationalSnapshot?.tasks.inProgress).toBe(2);
  });

  it('propõe criação de tarefa sem executar a ação', () => {
    const response = analyzeOperationalIntent('Criar tarefa: revisar contrato urgente', snapshot);

    expect(response?.action).toBe('propose_action');
    expect(response?.suggestedActions?.[0].type).toBe('create_task');
    expect(response?.suggestedActions?.[0].payload.priority).toBe('high');
    expect(response?.message).toContain('sua confirmação');
  });

  it('identifica pedidos de briefing e fornece contexto resumido', () => {
    const response = analyzeOperationalIntent('Como está a operação hoje?', snapshot);

    expect(response?.action).toBe('operational_briefing');
    expect(response?.reasoning).toHaveLength(3);
    expect(formatOperationalContext(snapshot)).toContain('Sessões registradas: 8');
  });
});
