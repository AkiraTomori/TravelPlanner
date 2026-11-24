import type { Request, Response } from 'express';
import { problems, sendProblem } from '../problem.js';
import type { Deps } from './store.js';

/** POST /plans/:planId/save — see docs/contract/save-plan.md. Not implemented yet. */
export function savePlanHandler(deps: Deps) {
  return (_req: Request, res: Response): void => {
    void deps;
    sendProblem(res, { ...problems.internal(), status: 501, detail: 'Not implemented.' });
  };
}
