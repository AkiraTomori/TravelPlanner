// Holds the code to docs/contract/save-plan.md. One describe block per contract section.
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { makeHarness, tokens } from '../fixtures.js';

type Harness = ReturnType<typeof makeHarness>;
let h: Harness;
beforeEach(() => {
  h = makeHarness();
});

const KEY = 'key-0001-weekend';

function save(
  planId: string,
  body: unknown = { expectedVersion: 3 },
  opts: { token?: string | null; key?: string | null; contentType?: string } = {},
) {
  const req = request(h.app).post(`/plans/${planId}/save`);
  const token = opts.token === undefined ? 'tok-linh' : opts.token;
  const key = opts.key === undefined ? KEY : opts.key;
  if (token !== null) req.set('Authorization', `Bearer ${token}`);
  if (key !== null) req.set('Idempotency-Key', key);
  req.set('Content-Type', opts.contentType ?? 'application/json');
  return req.send(typeof body === 'string' ? body : JSON.stringify(body));
}

function expectProblem(res: request.Response, status: number, type: string) {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/^application\/problem\+json/);
  expect(res.body).toMatchObject({ type, status });
  expect(typeof res.body.title).toBe('string');
  expect(typeof res.body.detail).toBe('string');
}

describe('200 — the creator saves a valid plan', () => {
  it('returns the saved plan with cost computed by code', async () => {
    const res = await save('plan_weekend');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect(res.headers['idempotent-replayed']).toBeUndefined();
    expect(res.body).toEqual({
      planId: 'plan_weekend',
      groupId: 'grp_linh',
      status: 'saved',
      version: 3,
      savedAt: '2026-11-28T02:00:00.000Z',
      savedBy: 'usr_linh',
      sharedNow: true,
      cost: {
        totalVnd: 680_000,
        groupTotalVnd: 4_000_000,
        members: [
          { userId: 'usr_an', spendVnd: 170_000, capVnd: 300_000 },
          { userId: 'usr_bao', spendVnd: 170_000, capVnd: null },
          { userId: 'usr_linh', spendVnd: 170_000, capVnd: 1_000_000 },
          { userId: 'usr_minh', spendVnd: 170_000, capVnd: null },
        ],
      },
    });
  });

  it('marks the plan saved and notifies every other member once', async () => {
    await save('plan_weekend');
    expect(h.store.getPlan('plan_weekend')).toMatchObject({
      status: 'saved',
      savedBy: 'usr_linh',
      savedAt: '2026-11-28T02:00:00.000Z',
    });
    expect(h.shared).toEqual([
      { planId: 'plan_weekend', version: 3, toUserIds: ['usr_an', 'usr_bao', 'usr_minh'] },
    ]);
  });

  it('works for an individual plan (group of one, groupTotalVnd null)', async () => {
    const res = await save('plan_zed', { expectedVersion: 1 }, { token: 'tok-zed' });
    expect(res.status).toBe(200);
    expect(res.body.cost).toEqual({
      totalVnd: 70_000,
      groupTotalVnd: null,
      members: [{ userId: 'usr_zed', spendVnd: 70_000, capVnd: null }],
    });
    expect(h.shared).toEqual([{ planId: 'plan_zed', version: 1, toUserIds: [] }]);
  });
});

describe('Who may call it', () => {
  it('401 unauthenticated without a token', async () => {
    expectProblem(
      await save('plan_weekend', undefined, { token: null }),
      401,
      '/problems/unauthenticated',
    );
  });

  it('401 unauthenticated with an unknown token', async () => {
    expectProblem(
      await save('plan_weekend', undefined, { token: 'tok-nobody' }),
      401,
      '/problems/unauthenticated',
    );
  });

  it('401 unauthenticated with a non-Bearer scheme', async () => {
    const res = await request(h.app)
      .post('/plans/plan_weekend/save')
      .set('Authorization', 'Basic dG9rLWxpbmg6')
      .set('Idempotency-Key', KEY)
      .set('Content-Type', 'application/json')
      .send('{"expectedVersion":3}');
    expectProblem(res, 401, '/problems/unauthenticated');
  });

  it("404 plan-not-found for another group's plan (existence hidden)", async () => {
    const res = await save('plan_weekend', undefined, { token: 'tok-zed' });
    expectProblem(res, 404, '/problems/plan-not-found');
    const missing = await save('plan_does_not_exist', undefined, {
      token: 'tok-zed',
      key: 'key-0002-missing',
    });
    expect(res.body).toEqual(missing.body);
  });

  it('403 not-plan-owner for a group member who did not create the plan', async () => {
    expectProblem(
      await save('plan_weekend', undefined, { token: 'tok-an' }),
      403,
      '/problems/not-plan-owner',
    );
    expect(h.store.getPlan('plan_weekend')?.status).toBe('draft');
    expect(h.shared).toEqual([]);
  });
});

describe('Request rules', () => {
  it('404 plan-not-found for an unknown plan', async () => {
    expectProblem(await save('plan_nope'), 404, '/problems/plan-not-found');
  });

  it('404 plan-not-found for a malformed planId', async () => {
    expectProblem(await save('plan%20weekend'), 404, '/problems/plan-not-found');
  });

  it('415 unsupported-media-type for a non-JSON Content-Type', async () => {
    const res = await save('plan_weekend', 'expectedVersion=3', { contentType: 'text/plain' });
    expectProblem(res, 415, '/problems/unsupported-media-type');
  });

  it('415 is checked before authentication', async () => {
    const res = await save('plan_weekend', 'x', { token: null, contentType: 'text/plain' });
    expectProblem(res, 415, '/problems/unsupported-media-type');
  });

  it.each([
    ['missing', null],
    ['too short', 'short'],
    ['bad characters', 'key with spaces!!'],
    ['too long', 'k'.repeat(129)],
  ])('400 idempotency-key-required when the key is %s', async (_label, key) => {
    const res = await save('plan_weekend', undefined, { key });
    expectProblem(res, 400, '/problems/idempotency-key-required');
  });

  it.each([
    ['malformed JSON', '{"expectedVersion":', 'body'],
    ['an array body', [], 'body'],
    ['expectedVersion missing', {}, 'expectedVersion'],
    ['expectedVersion zero', { expectedVersion: 0 }, 'expectedVersion'],
    ['expectedVersion not an integer', { expectedVersion: 2.5 }, 'expectedVersion'],
    ['expectedVersion a string', { expectedVersion: '3' }, 'expectedVersion'],
    ['an unknown field', { expectedVersion: 3, share: false }, 'share'],
  ])('400 invalid-request for %s', async (_label, body, field) => {
    const res = await save('plan_weekend', body);
    expectProblem(res, 400, '/problems/invalid-request');
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field, message: expect.any(String) })]),
    );
  });

  it('409 version-conflict when the plan changed since the client read it', async () => {
    const res = await save('plan_weekend', { expectedVersion: 2 });
    expectProblem(res, 409, '/problems/version-conflict');
    expect(res.body.currentVersion).toBe(3);
    expect(h.store.getPlan('plan_weekend')?.status).toBe('draft');
  });
});

describe('422 plan-invalid — the validator runs in the backend', () => {
  it('refuses a plan over a member cap and shares nothing', async () => {
    const res = await save('plan_over_cap', { expectedVersion: 1 });
    expectProblem(res, 422, '/problems/plan-invalid');
    expect(res.body.violations).toEqual([
      {
        code: 'over-member-cap',
        stopIndex: null,
        userId: 'usr_an',
        message: expect.any(String),
      },
    ]);
    expect(h.store.getPlan('plan_over_cap')?.status).toBe('draft');
    expect(h.shared).toEqual([]);
  });

  it('refuses a plan that became invalid after it was drafted', async () => {
    const plan = h.store.getPlan('plan_weekend')!;
    plan.stops[0]!.placeId = 'place_closed_forever';
    h.store.putPlan(plan);
    const res = await save('plan_weekend');
    expectProblem(res, 422, '/problems/plan-invalid');
    expect(res.body.violations.map((v: { code: string }) => v.code)).toContain('unknown-place');
  });
});

describe('Idempotency', () => {
  it('replays the stored response for the same key and body, and shares once', async () => {
    const first = await save('plan_weekend');
    h.clock.now = new Date('2026-11-28T02:05:00.000Z');
    const again = await save('plan_weekend');
    expect(again.status).toBe(200);
    expect(again.headers['idempotent-replayed']).toBe('true');
    expect(again.body).toEqual(first.body);
    expect(again.body.sharedNow).toBe(true);
    expect(h.shared).toHaveLength(1);
  });

  it('422 idempotency-key-reused for the same key with a different body', async () => {
    await save('plan_weekend');
    expectProblem(
      await save('plan_weekend', { expectedVersion: 4 }),
      422,
      '/problems/idempotency-key-reused',
    );
  });

  it('422 idempotency-key-reused for the same key on a different plan', async () => {
    await save('plan_weekend');
    const res = await save('plan_over_cap', { expectedVersion: 1 });
    expectProblem(res, 422, '/problems/idempotency-key-reused');
  });

  it('a new key on an already-saved plan returns 200, sharedNow false, original savedAt', async () => {
    await save('plan_weekend');
    h.clock.now = new Date('2026-11-28T03:00:00.000Z');
    const res = await save('plan_weekend', undefined, { key: 'key-0003-lost-key' });
    expect(res.status).toBe(200);
    expect(res.headers['idempotent-replayed']).toBeUndefined();
    expect(res.body.sharedNow).toBe(false);
    expect(res.body.savedAt).toBe('2026-11-28T02:00:00.000Z');
    expect(h.shared).toHaveLength(1);
  });

  it('does not store errors: the same key works after the cause is fixed', async () => {
    expectProblem(
      await save('plan_weekend', { expectedVersion: 2 }),
      409,
      '/problems/version-conflict',
    );
    const res = await save('plan_weekend', { expectedVersion: 3 });
    expect(res.status).toBe(200);
    expect(res.body.sharedNow).toBe(true);
  });

  it('scopes keys per user: two users may use the same key', async () => {
    expect((await save('plan_weekend')).status).toBe(200);
    const zed = await save('plan_zed', { expectedVersion: 1 }, { token: 'tok-zed' });
    expect(zed.status).toBe(200);
    expect(zed.body.planId).toBe('plan_zed');
  });

  it('forgets a key after 24 hours', async () => {
    await save('plan_weekend');
    h.clock.now = new Date('2026-11-29T02:00:01.000Z');
    const res = await save('plan_weekend');
    expect(res.status).toBe(200);
    expect(res.headers['idempotent-replayed']).toBeUndefined();
    expect(res.body.sharedNow).toBe(false);
  });
});

describe('500 internal — unexpected failure', () => {
  it('returns problem details and shares nothing', async () => {
    const shared: unknown[] = [];
    const app = createApp({
      store: {
        getPlan: () => {
          throw new Error('database down');
        },
        putPlan: () => undefined,
        getGroup: () => undefined,
        getPlace: () => undefined,
      },
      notifier: { planShared: (...args) => shared.push(args) },
      authenticate: (token) => tokens[token],
      now: () => new Date('2026-11-28T02:00:00.000Z'),
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await request(app)
      .post('/plans/plan_weekend/save')
      .set('Authorization', 'Bearer tok-linh')
      .set('Idempotency-Key', KEY)
      .set('Content-Type', 'application/json')
      .send('{"expectedVersion":3}');
    spy.mockRestore();
    expectProblem(res, 500, '/problems/internal');
    expect(shared).toEqual([]);
  });
});
