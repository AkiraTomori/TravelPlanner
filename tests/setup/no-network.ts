// Rule from AGENTS.md: no real model (or any network) call in tests.
// Any test that reaches fetch() fails loudly instead of quietly spending Groq credit.
import { beforeEach } from 'vitest';

beforeEach(() => {
  globalThis.fetch = () => {
    throw new Error('Network is disabled in tests: inject a fake model client instead.');
  };
});
