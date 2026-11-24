import type { Group, Place, Plan } from './types.js';

export interface PlanStore {
  getPlan(id: string): Plan | undefined;
  putPlan(plan: Plan): void;
  getGroup(id: string): Group | undefined;
  getPlace(id: string): Place | undefined;
}

export interface Notifier {
  planShared(planId: string, version: number, toUserIds: string[]): void;
}

export interface Deps {
  store: PlanStore;
  notifier: Notifier;
  /** Returns the user id for a session token, or undefined. */
  authenticate(token: string): string | undefined;
  now(): Date;
}

export class InMemoryPlanStore implements PlanStore {
  private plans = new Map<string, Plan>();
  private groups = new Map<string, Group>();
  private places = new Map<string, Place>();

  constructor(seed: { plans?: Plan[]; groups?: Group[]; places?: Place[] } = {}) {
    for (const p of seed.plans ?? []) this.plans.set(p.id, structuredClone(p));
    for (const g of seed.groups ?? []) this.groups.set(g.id, structuredClone(g));
    for (const p of seed.places ?? []) this.places.set(p.id, structuredClone(p));
  }

  getPlan(id: string): Plan | undefined {
    const p = this.plans.get(id);
    return p && structuredClone(p);
  }

  putPlan(plan: Plan): void {
    this.plans.set(plan.id, structuredClone(plan));
  }

  getGroup(id: string): Group | undefined {
    const g = this.groups.get(id);
    return g && structuredClone(g);
  }

  getPlace(id: string): Place | undefined {
    const p = this.places.get(id);
    return p && structuredClone(p);
  }
}
