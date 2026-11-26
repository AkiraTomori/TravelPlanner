import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { savePlanHandler } from './plans/save-plan.js';
import type { Deps } from './plans/store.js';
import { problems, sendProblem } from './problem.js';

/** Contract: bodies over 16 KB are 413 body-too-large, checked before anything else. */
const BODY_LIMIT_BYTES = 16 * 1024;

function isBodyTooLarge(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { type?: unknown }).type === 'entity.too.large'
  );
}

export function createApp(deps: Deps): Express {
  const app = express();
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  // Raw text so the handler decides the order of checks (contract: 415 before 401 before body).
  app.post(
    '/plans/:planId/save',
    express.text({ type: () => true, limit: BODY_LIMIT_BYTES }),
    savePlanHandler(deps),
  );
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);
    if (isBodyTooLarge(err)) return sendProblem(res, problems.bodyTooLarge(BODY_LIMIT_BYTES));
    console.error(err);
    sendProblem(res, problems.internal());
  });
  return app;
}
