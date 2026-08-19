import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { adminService } from '../services/adminService';

const boardColumnSchema = z.enum(['todo', 'in_progress', 'done']);
const taskTypeSchema = z.enum(['expense', 'fixed_cost', 'activity']);

export const adminRouter = router({
  overview: publicProcedure.query(async () => adminService.getOverview()),

  sessions: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(200).optional(), search: z.string().optional() }).optional())
    .query(async ({ input }) => adminService.listSessions(input?.limit || 50, input?.search)),

  documents: publicProcedure
    .input(z.object({ limit: z.number().int().positive().max(200).optional() }).optional())
    .query(async ({ input }) => adminService.listDocuments(input?.limit || 50)),

  board: publicProcedure.query(async () => adminService.getBoard()),

  createTask: publicProcedure
    .input(z.object({
      title: z.string().min(2).max(120),
      description: z.string().max(500).optional(),
      taskType: taskTypeSchema.optional(),
      amount: z.number().nonnegative().optional(),
      dueDate: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input }) => adminService.createTask(input)),

  moveTask: publicProcedure
    .input(z.object({ taskId: z.number().int().positive(), columnName: boardColumnSchema }))
    .mutation(async ({ input }) => adminService.moveTask(input.taskId, input.columnName)),

  createFixedCost: publicProcedure
    .input(z.object({
      description: z.string().min(2).max(160),
      amount: z.number().positive(),
      recurrence: z.enum(['monthly', 'weekly', 'annual', 'one_time']).default('monthly'),
    }))
    .mutation(async ({ input }) => adminService.createFixedCost(input)),

  markFixedCostPaid: publicProcedure
    .input(z.object({ costId: z.number().int().positive() }))
    .mutation(async ({ input }) => adminService.markFixedCostPaid(input.costId)),
});

