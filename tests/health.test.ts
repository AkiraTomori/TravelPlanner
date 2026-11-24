import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeHarness } from './fixtures.js';

describe('GET /health', () => {
  it('answers ok', async () => {
    const res = await request(makeHarness().app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('test harness', () => {
  it('refuses real network calls', () => {
    expect(() => fetch('https://api.groq.com')).toThrow(/Network is disabled/);
  });
});
