import type { Group, PlanCost, Place, Plan } from './types.js';

/** compute_cost: plain code, no model. Integer VND. Unknown places/items cost 0 (the validator reports them). */
export function computeCost(
  plan: Plan,
  group: Group,
  getPlace: (id: string) => Place | undefined,
): PlanCost {
  const spend = new Map<string, number>(group.memberIds.map((id) => [id, 0]));
  for (const stop of plan.stops) {
    const place = getPlace(stop.placeId);
    for (const chosen of stop.items) {
      const item = place?.items.find((i) => i.id === chosen.itemId);
      if (!item) continue;
      for (const userId of chosen.forUserIds) {
        spend.set(userId, (spend.get(userId) ?? 0) + item.priceVnd);
      }
    }
  }
  const members = [...spend.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([userId, spendVnd]) => ({ userId, spendVnd, capVnd: group.capsVnd[userId] ?? null }));
  return {
    totalVnd: members.reduce((sum, m) => sum + m.spendVnd, 0),
    groupTotalVnd: group.totalVnd,
    members,
  };
}
