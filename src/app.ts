import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { savePlanHandler } from './plans/save-plan.js';
import type { Deps } from './plans/store.js';
import { problems, sendProblem } from './problem.js';

export function createApp(deps: Deps): Express {
  const app = express();
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  // Raw text so the handler decides the order of checks (contract: 415 before 401 before body).
  app.post(
    '/plans/:planId/save',
    express.text({ type: () => true, limit: '16kb' }),
    savePlanHandler(deps),
  );
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    console.error(err);
    sendProblem(res, problems.internal());
  });
  return app;
}
