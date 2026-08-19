import { rawDb } from './db';

export type BoardColumn = 'todo' | 'in_progress' | 'done';
export type TaskType = 'expense' | 'fixed_cost' | 'activity';

function ensureAdminTables() {
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS scrum_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      task_type TEXT NOT NULL DEFAULT 'activity',
      column_name TEXT NOT NULL DEFAULT 'todo',
      amount REAL,
      due_date INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fixed_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      recurrence TEXT NOT NULL DEFAULT 'monthly',
      status TEXT NOT NULL DEFAULT 'launched',
      created_at INTEGER NOT NULL,
      paid_at INTEGER
    );
  `);
}

ensureAdminTables();

export const adminService = {
  getOverview: () => {
    const sessions = rawDb.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN end_time IS NULL THEN 1 ELSE 0 END) AS active,
        COALESCE(SUM(total_time_seconds), 0) AS total_seconds
      FROM sessions
    `).get() as { total: number; active: number; total_seconds: number };

    const messages = rawDb.prepare('SELECT COUNT(*) AS total FROM chat_messages').get() as { total: number };
    const documents = rawDb.prepare('SELECT COUNT(*) AS total FROM documents').get() as { total: number };
    const licenses = rawDb.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN revoked = 0 THEN 1 ELSE 0 END) AS active
      FROM license_keys
    `).get() as { total: number; active: number };

    const recentSessions = rawDb.prepare(`
      SELECT id, start_time AS startTime, end_time AS endTime,
             total_time_seconds AS totalTimeSeconds
      FROM sessions
      ORDER BY start_time DESC
      LIMIT 6
    `).all();

    const recentDocuments = rawDb.prepare(`
      SELECT id, session_id AS sessionId, type, title, url, created_at AS createdAt
      FROM documents
      ORDER BY created_at DESC
      LIMIT 6
    `).all();

    return {
      metrics: {
        sessions: sessions.total || 0,
        activeSessions: sessions.active || 0,
        totalSeconds: sessions.total_seconds || 0,
        messages: messages.total || 0,
        documents: documents.total || 0,
        activeLicenses: licenses.active || 0,
        licenses: licenses.total || 0,
      },
      recentSessions,
      recentDocuments,
    };
  },

  listSessions: (limit = 50, search?: string) => {
    const normalizedLimit = Math.min(Math.max(limit, 1), 200);
    if (search?.trim()) {
      return rawDb.prepare(`
        SELECT s.id, s.start_time AS startTime, s.end_time AS endTime,
               s.total_time_seconds AS totalTimeSeconds,
               COUNT(m.id) AS messageCount
        FROM sessions s
        LEFT JOIN chat_messages m ON m.session_id = s.id
        WHERE s.id LIKE ?
        GROUP BY s.id
        ORDER BY s.start_time DESC
        LIMIT ?
      `).all(`%${search.trim()}%`, normalizedLimit);
    }

    return rawDb.prepare(`
      SELECT s.id, s.start_time AS startTime, s.end_time AS endTime,
             s.total_time_seconds AS totalTimeSeconds,
             COUNT(m.id) AS messageCount
      FROM sessions s
      LEFT JOIN chat_messages m ON m.session_id = s.id
      GROUP BY s.id
      ORDER BY s.start_time DESC
      LIMIT ?
    `).all(normalizedLimit);
  },

  listDocuments: (limit = 50) => {
    const normalizedLimit = Math.min(Math.max(limit, 1), 200);
    return rawDb.prepare(`
      SELECT id, session_id AS sessionId, type, title,
             file_path AS filePath, url, created_at AS createdAt
      FROM documents
      ORDER BY created_at DESC
      LIMIT ?
    `).all(normalizedLimit);
  },

  getBoard: () => {
    const tasks = rawDb.prepare(`
      SELECT id, title, description, task_type AS taskType,
             column_name AS columnName, amount, due_date AS dueDate,
             created_at AS createdAt, updated_at AS updatedAt
      FROM scrum_tasks
      ORDER BY updated_at DESC, id DESC
    `).all() as Array<Record<string, unknown>>;

    const fixedCosts = rawDb.prepare(`
      SELECT id, task_id AS taskId, description, amount, recurrence,
             status, created_at AS createdAt, paid_at AS paidAt
      FROM fixed_costs
      ORDER BY created_at DESC
    `).all();

    return {
      columns: {
        todo: tasks.filter((task) => task.columnName === 'todo'),
        in_progress: tasks.filter((task) => task.columnName === 'in_progress'),
        done: tasks.filter((task) => task.columnName === 'done'),
      },
      fixedCosts,
    };
  },

  createTask: (input: {
    title: string;
    description?: string;
    taskType?: TaskType;
    amount?: number;
    dueDate?: number;
  }) => {
    const now = Date.now();
    const result = rawDb.prepare(`
      INSERT INTO scrum_tasks
        (title, description, task_type, column_name, amount, due_date, created_at, updated_at)
      VALUES (?, ?, ?, 'todo', ?, ?, ?, ?)
    `).run(
      input.title.trim(),
      input.description?.trim() || null,
      input.taskType || 'activity',
      input.amount ?? null,
      input.dueDate ?? null,
      now,
      now,
    );
    return { id: Number(result.lastInsertRowid) };
  },

  moveTask: (taskId: number, columnName: BoardColumn) => {
    const result = rawDb.prepare(`
      UPDATE scrum_tasks SET column_name = ?, updated_at = ? WHERE id = ?
    `).run(columnName, Date.now(), taskId);
    return { success: result.changes > 0 };
  },

  createFixedCost: (input: {
    description: string;
    amount: number;
    recurrence: string;
  }) => {
    const now = Date.now();
    const transaction = rawDb.transaction(() => {
      const task = rawDb.prepare(`
        INSERT INTO scrum_tasks
          (title, description, task_type, column_name, amount, created_at, updated_at)
        VALUES (?, ?, 'fixed_cost', 'in_progress', ?, ?, ?)
      `).run(
        `Custo fixo: ${input.description.trim()}`,
        `Lançamento automático de custo fixo (${input.recurrence}).`,
        input.amount,
        now,
        now,
      );

      const taskId = Number(task.lastInsertRowid);
      const cost = rawDb.prepare(`
        INSERT INTO fixed_costs
          (task_id, description, amount, recurrence, status, created_at)
        VALUES (?, ?, ?, ?, 'launched', ?)
      `).run(taskId, input.description.trim(), input.amount, input.recurrence, now);

      return { taskId, costId: Number(cost.lastInsertRowid) };
    });

    return transaction;
  },

  markFixedCostPaid: (costId: number) => {
    const now = Date.now();
    const transaction = rawDb.transaction(() => {
      const cost = rawDb.prepare('SELECT task_id AS taskId FROM fixed_costs WHERE id = ?').get(costId) as { taskId: number } | undefined;
      if (!cost) return false;

      rawDb.prepare(`
        UPDATE fixed_costs SET status = 'paid', paid_at = ? WHERE id = ?
      `).run(now, costId);
      rawDb.prepare(`
        UPDATE scrum_tasks SET column_name = 'done', updated_at = ? WHERE id = ?
      `).run(now, cost.taskId);
      return true;
    });

    return { success: transaction };
  },
};

