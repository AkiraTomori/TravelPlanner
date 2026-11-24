import type { Response } from 'express';

/** RFC 9457 problem details. `type` values are listed in docs/contract/*.md. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
  [extension: string]: unknown;
}

export function sendProblem(res: Response, problem: Problem): void {
  res.status(problem.status).type('application/problem+json').json(problem);
}

export const problems = {
  invalidRequest: (errors: { field: string; message: string }[]): Problem => ({
    type: '/problems/invalid-request',
    title: 'The request body is not valid',
    status: 400,
    detail: `${errors.length} field error(s).`,
    errors,
  }),
  idempotencyKeyRequired: (): Problem => ({
    type: '/problems/idempotency-key-required',
    title: 'An Idempotency-Key header is required',
    status: 400,
    detail: 'Send Idempotency-Key: 8-128 characters of [A-Za-z0-9_-].',
  }),
  unauthenticated: (): Problem => ({
    type: '/problems/unauthenticated',
    title: 'Sign-in required',
    status: 401,
    detail: 'Send Authorization: Bearer <token> with a valid session token.',
  }),
  notPlanOwner: (): Problem => ({
    type: '/problems/not-plan-owner',
    title: 'Only the creator of the plan can save it',
    status: 403,
    detail: 'You are a member of this group but did not create this plan.',
  }),
  planNotFound: (): Problem => ({
    type: '/problems/plan-not-found',
    title: 'Plan not found',
    status: 404,
    detail: 'No plan with this id is visible to you.',
  }),
  versionConflict: (currentVersion: number): Problem => ({
    type: '/problems/version-conflict',
    title: 'The plan changed since you read it',
    status: 409,
    detail: `Current version is ${currentVersion}. Reload the plan and review it again.`,
    currentVersion,
  }),
  unsupportedMediaType: (): Problem => ({
    type: '/problems/unsupported-media-type',
    title: 'Content-Type must be application/json',
    status: 415,
    detail: 'Send the body as JSON with Content-Type: application/json.',
  }),
  planInvalid: (violations: unknown[]): Problem => ({
    type: '/problems/plan-invalid',
    title: 'The plan does not pass validation',
    status: 422,
    detail: `${violations.length} violation(s); the plan was not saved.`,
    violations,
  }),
  idempotencyKeyReused: (): Problem => ({
    type: '/problems/idempotency-key-reused',
    title: 'Idempotency-Key was already used for a different request',
    status: 422,
    detail: 'Use a new Idempotency-Key for a different plan or body.',
  }),
  internal: (): Problem => ({
    type: '/problems/internal',
    title: 'Internal error',
    status: 500,
    detail: 'Nothing was shared. Retry with the same Idempotency-Key.',
  }),
};
