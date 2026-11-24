import { describe, expect, it } from 'vitest';
import { computeCost } from '../../src/plans/cost.js';
import type { Plan } from '../../src/plans/types.js';
import { validatePlan } from '../../src/plans/validate.js';
import { groups, places, plans } from '../fixtures.js';

const getPlace = (id: string) => places.find((p) => p.id === id);
const group = groups[0]!;
const base = plans[0]!;
const withStops = (stops: Plan['stops']): Plan => ({ ...base, stops });
const codes = (plan: Plan, g = group) => validatePlan(plan, g, getPlace).map((v) => v.code);

describe('computeCost', () => {
  it('adds integer VND per member', () => {
    expect(computeCost(base, group, getPlace).totalVnd).toBe(680_000);
  });
});

describe('validatePlan', () => {
  it('accepts the weekend plan', () => {
    expect(codes(base)).toEqual([]);
  });

  it('flags an unknown place and an unknown item', () => {
    const stops = structuredClone(base.stops);
    stops[0]!.placeId = 'place_nowhere';
    stops[1]!.items.push({ itemId: 'item_free_lunch', forUserIds: ['usr_an'] });
    expect(codes(withStops(stops))).toEqual(['unknown-place', 'unknown-item']);
  });

  it('flags overlapping or reversed stops', () => {
    const stops = structuredClone(base.stops);
    stops[1]!.start = '08:30';
    stops[2]!.end = '18:00';
    expect(codes(withStops(stops))).toEqual(['stop-order', 'stop-order']);
  });

  it('flags a member over their cap', () => {
    expect(codes(plans[1]!)).toEqual(['over-member-cap']);
  });

  it('flags a plan over the group total', () => {
    expect(codes(base, { ...group, totalVnd: 600_000 })).toEqual(['over-group-total']);
  });

  it('a cap equal to the spend is allowed', () => {
    const g = { ...group, capsVnd: { ...group.capsVnd, usr_an: 170_000 } };
    expect(codes(base, g)).toEqual([]);
  });
});
