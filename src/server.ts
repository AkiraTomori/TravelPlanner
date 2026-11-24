import { createApp } from './app.js';
import { InMemoryPlanStore } from './plans/store.js';

// PA#2: in-memory store and no real auth yet. PA#3 replaces these with the database and sessions.
const port = Number(process.env.PORT ?? 3000);
createApp({
  store: new InMemoryPlanStore(),
  notifier: { planShared: () => undefined },
  authenticate: () => undefined,
  now: () => new Date(),
}).listen(port, () => {
  console.warn(`travel-planner-api listening on :${port}`);
});
