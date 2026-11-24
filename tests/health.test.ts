import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('answers ok', async () => {
    const res = await request(createApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('test harness', () => {
  it('refuses real network calls', () => {
    expect(() => fetch('https://api.groq.com')).toThrow(/Network is disabled/);
  });
});
