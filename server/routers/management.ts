import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { dbService } from '../services/db';

const priority = z.enum(['low', 'medium', 'high']);
const status = z.enum(['todo', 'in_progress', 'done']);
const category = z.enum(['fixed', 'variable', 'other']);
const expenseStatus = z.enum(['pending', 'paid', 'cancelled']);

export const managementRouter = router({
  scrum: router({
    list: publicProcedure.query(() => dbService.listScrumItems()),
    create: publicProcedure.input(z.object({ title: z.string().min(1), description: z.string().optional(), priority: priority.default('medium'), dueDate: z.string().optional() })).mutation(({ input }) => dbService.createScrumItem(input)),
    update: publicProcedure.input(z.object({ id: z.number(), title: z.string().min(1).optional(), description: z.string().optional(), status: status.optional(), priority: priority.optional(), dueDate: z.string().optional() })).mutation(({ input }) => {
      const { id, ...changes } = input;
      return dbService.updateScrumItem(id, changes);
    }),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => ({ success: dbService.deleteScrumItem(input.id) })),
  }),
  expenses: router({
    list: publicProcedure.query(() => dbService.listExpenses()),
    create: publicProcedure.input(z.object({ description: z.string().min(1), amount: z.number().positive(), category, status: expenseStatus.default('pending'), expenseDate: z.string().default('') })).mutation(({ input }) => dbService.createExpense({ ...input, expenseDate: input.expenseDate || new Date().toISOString().slice(0, 10) })),
    updateStatus: publicProcedure.input(z.object({ id: z.number(), status: expenseStatus })).mutation(({ input }) => dbService.updateExpenseStatus(input.id, input.status)),
    delete: publicProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => ({ success: dbService.deleteExpense(input.id) })),
  }),
  statistics: publicProcedure.query(() => dbService.getStatistics()),
});
