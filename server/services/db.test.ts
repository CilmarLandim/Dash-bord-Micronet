import { afterAll, describe, expect, it } from 'vitest';
import { dbService } from './db';

const createdTaskIds: number[] = [];
const createdExpenseIds: number[] = [];

afterAll(() => {
  createdTaskIds.forEach((id) => dbService.deleteScrumItem(id));
  createdExpenseIds.forEach((id) => dbService.deleteExpense(id));
});

describe('dbService: gestão operacional', () => {
  it('cria e avança uma tarefa no quadro Scrum', () => {
    const task = dbService.createScrumItem({
      title: 'Teste unitário Scrum',
      priority: 'high',
    });
    createdTaskIds.push(task.id);

    expect(task.status).toBe('todo');

    const updated = dbService.updateScrumItem(task.id, { status: 'in_progress' });
    expect(updated?.status).toBe('in_progress');
  });

  it('registra despesa fixa e cria tarefa automática associada', () => {
    const beforeTaskIds = new Set(dbService.listScrumItems().map((task) => task.id));
    const expense = dbService.createExpense({
      description: 'Teste unitário de custo fixo',
      amount: 125.5,
      category: 'fixed',
      status: 'pending',
      expenseDate: '2026-08-19',
    });
    createdExpenseIds.push(expense.id);

    const newTask = dbService.listScrumItems().find((task) => !beforeTaskIds.has(task.id) && task.title.includes('Teste unitário de custo fixo'));
    if (newTask) createdTaskIds.push(newTask.id);

    expect(expense.amount).toBe(125.5);
    expect(newTask?.status).toBe('todo');
  });

  it('consolida métricas de estatísticas', () => {
    const statistics = dbService.getStatistics();

    expect(statistics.sessions.total).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(statistics.tasks)).toBe(true);
    expect(Array.isArray(statistics.expenses)).toBe(true);
  });
});
