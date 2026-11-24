import { createApp } from '../src/app.js';
import { InMemoryPlanStore } from '../src/plans/store.js';
import type { Group, Place, Plan } from '../src/plans/types.js';

export const places: Place[] = [
  {
    id: 'place_ben_thanh',
    items: [
      { id: 'item_com_tam', priceVnd: 45_000 },
      { id: 'item_che', priceVnd: 25_000 },
    ],
  },
  {
    id: 'place_war_museum',
    items: [
      { id: 'item_ticket', priceVnd: 40_000 },
      { id: 'item_audio_tour', priceVnd: 200_000 },
    ],
  },
  { id: 'place_bui_vien', items: [{ id: 'item_drink', priceVnd: 60_000 }] },
];

const everyone = ['usr_an', 'usr_bao', 'usr_linh', 'usr_minh'];

export const groups: Group[] = [
  {
    id: 'grp_linh',
    memberIds: everyone,
    totalVnd: 4_000_000,
    capsVnd: { usr_an: 300_000, usr_bao: null, usr_linh: 1_000_000, usr_minh: null },
  },
  { id: 'grp_zed', memberIds: ['usr_zed'], totalVnd: null, capsVnd: { usr_zed: null } },
];

const weekendStops: Plan['stops'] = [
  {
    placeId: 'place_ben_thanh',
    start: '08:00',
    end: '09:00',
    items: [
      { itemId: 'item_com_tam', forUserIds: everyone },
      { itemId: 'item_che', forUserIds: everyone },
    ],
  },
  {
    placeId: 'place_war_museum',
    start: '09:30',
    end: '11:30',
    items: [{ itemId: 'item_ticket', forUserIds: everyone }],
  },
  {
    placeId: 'place_bui_vien',
    start: '19:00',
    end: '21:00',
    items: [{ itemId: 'item_drink', forUserIds: everyone }],
  },
];

export const plans: Plan[] = [
  {
    id: 'plan_weekend',
    groupId: 'grp_linh',
    createdBy: 'usr_linh',
    version: 3,
    status: 'draft',
    stops: weekendStops,
    savedAt: null,
    savedBy: null,
  },
  {
    // usr_an also gets the 200,000 VND audio tour: 370,000 > cap 300,000.
    id: 'plan_over_cap',
    groupId: 'grp_linh',
    createdBy: 'usr_linh',
    version: 1,
    status: 'draft',
    stops: weekendStops.map((s, i) =>
      i === 1
        ? { ...s, items: [...s.items, { itemId: 'item_audio_tour', forUserIds: ['usr_an'] }] }
        : s,
    ),
    savedAt: null,
    savedBy: null,
  },
  {
    id: 'plan_zed',
    groupId: 'grp_zed',
    createdBy: 'usr_zed',
    version: 1,
    status: 'draft',
    stops: [weekendStops[0]!].map((s) => ({
      ...s,
      items: s.items.map((it) => ({ ...it, forUserIds: ['usr_zed'] })),
    })),
    savedAt: null,
    savedBy: null,
  },
];

export const tokens: Record<string, string> = {
  'tok-linh': 'usr_linh',
  'tok-an': 'usr_an',
  'tok-zed': 'usr_zed',
};

export function makeHarness() {
  const store = new InMemoryPlanStore({ plans, groups, places });
  const shared: { planId: string; version: number; toUserIds: string[] }[] = [];
  const clock = { now: new Date('2026-11-28T02:00:00.000Z') };
  const app = createApp({
    store,
    notifier: {
      planShared: (planId, version, toUserIds) => shared.push({ planId, version, toUserIds }),
    },
    authenticate: (token) => tokens[token],
    now: () => clock.now,
  });
  return { app, store, shared, clock };
}
