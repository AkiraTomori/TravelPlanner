import type { Request, Response } from 'express';
import { problems, sendProblem } from '../problem.js';
import { computeCost } from './cost.js';
import type { Deps } from './store.js';
import { validatePlan } from './validate.js';

/** POST /plans/:planId/save — see docs/contract/save-plan.md. Check order follows §Errors. */

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const KEY = /^[A-Za-z0-9_-]{8,128}$/;
const KEY_TTL_MS = 24 * 60 * 60 * 1000;

interface StoredResponse {
  fingerprint: string;
  body: unknown;
  storedAt: number;
}

type FieldError = { field: string; message: string };

function parseBody(raw: unknown): { expectedVersion: number } | FieldError[] {
  let body: unknown;
  try {
    body = JSON.parse(typeof raw === 'string' ? raw : '');
  } catch {
    return [{ field: 'body', message: 'Body is not valid JSON.' }];
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return [{ field: 'body', message: 'Body must be a JSON object.' }];
  }
  const errors: FieldError[] = [];
  const record = body as Record<string, unknown>;
  for (const field of Object.keys(record)) {
    if (field !== 'expectedVersion') errors.push({ field, message: 'Unknown field.' });
  }
  const v = record.expectedVersion;
  if (v === undefined) {
    errors.push({ field: 'expectedVersion', message: 'Required.' });
  } else if (typeof v !== 'number' || !Number.isInteger(v) || v < 1) {
    errors.push({ field: 'expectedVersion', message: 'Must be an integer >= 1.' });
  }
  return errors.length > 0 ? errors : { expectedVersion: v as number };
}

export function savePlanHandler(deps: Deps) {
  const idempotency = new Map<string, StoredResponse>();

  return (req: Request, res: Response): void => {
    // 415
    if (!req.is('application/json')) return sendProblem(res, problems.unsupportedMediaType());

    // 401
    const auth = /^Bearer (\S+)$/.exec(req.get('authorization') ?? '');
    const userId = auth?.[1] ? deps.authenticate(auth[1]) : undefined;
    if (!userId) return sendProblem(res, problems.unauthenticated());

    // 400 idempotency-key-required
    const key = req.get('idempotency-key') ?? '';
    if (!KEY.test(key)) return sendProblem(res, problems.idempotencyKeyRequired());

    // Replay / 422 idempotency-key-reused
    const planId = String(req.params.planId);
    const rawBody = typeof req.body === 'string' ? req.body : '';
    const fingerprint = `${planId}\n${rawBody}`;
    const scope = `${userId}\n${key}`;
    const now = deps.now().getTime();
    const stored = idempotency.get(scope);
    if (stored && now - stored.storedAt > KEY_TTL_MS) idempotency.delete(scope);
    else if (stored) {
      if (stored.fingerprint !== fingerprint) {
        return sendProblem(res, problems.idempotencyKeyReused());
      }
      res.set('Idempotent-Replayed', 'true').status(200).json(stored.body);
      return;
    }

    // 400 invalid-request
    const parsed = parseBody(req.body);
    if (Array.isArray(parsed)) return sendProblem(res, problems.invalidRequest(parsed));

    // 404 / 403: hide plans outside the caller's groups
    const plan = ID.test(planId) ? deps.store.getPlan(planId) : undefined;
    const group = plan && deps.store.getGroup(plan.groupId);
    if (!plan || !group || !group.memberIds.includes(userId)) {
      return sendProblem(res, problems.planNotFound());
    }
    if (plan.createdBy !== userId) return sendProblem(res, problems.notPlanOwner());

    // 409
    if (parsed.expectedVersion !== plan.version) {
      return sendProblem(res, problems.versionConflict(plan.version));
    }

    const getPlace = (id: string) => deps.store.getPlace(id);
    let sharedNow = false;
    if (plan.status !== 'saved') {
      // 422 plan-invalid: the validator always runs one last time before sharing.
      const violations = validatePlan(plan, group, getPlace);
      if (violations.length > 0) return sendProblem(res, problems.planInvalid(violations));

      plan.status = 'saved';
      plan.savedAt = deps.now().toISOString();
      plan.savedBy = userId;
      deps.store.putPlan(plan);
      deps.notifier.planShared(
        plan.id,
        plan.version,
        group.memberIds.filter((id) => id !== userId),
      );
      sharedNow = true;
    }

    const body = {
      planId: plan.id,
      groupId: plan.groupId,
      status: 'saved' as const,
      version: plan.version,
      savedAt: plan.savedAt,
      savedBy: plan.savedBy,
      sharedNow,
      cost: computeCost(plan, group, getPlace),
    };
    idempotency.set(scope, { fingerprint, body, storedAt: now });
    res.status(200).json(body);
  };
}
