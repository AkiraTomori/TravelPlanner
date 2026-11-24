import { computeCost } from './cost.js';
import type { Group, Place, Plan, Violation } from './types.js';

const vnd = (n: number) => n.toLocaleString('en-US');
const minutes = (hhmm: string) => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};

/**
 * validate_plan: plain code, no model. PA#2 subset of the brief's validator.
 * PA#3 adds opening hours, travel time and rain once the shared data is published.
 */
export function validatePlan(
  plan: Plan,
  group: Group,
  getPlace: (id: string) => Place | undefined,
): Violation[] {
  const violations: Violation[] = [];
  let previousEnd = -1;

  plan.stops.forEach((stop, stopIndex) => {
    const place = getPlace(stop.placeId);
    if (!place) {
      violations.push({
        code: 'unknown-place',
        stopIndex,
        userId: null,
        message: `Place ${stop.placeId} is not in the checked data.`,
      });
    } else {
      for (const chosen of stop.items) {
        if (!place.items.some((i) => i.id === chosen.itemId)) {
          violations.push({
            code: 'unknown-item',
            stopIndex,
            userId: null,
            message: `Item ${chosen.itemId} is not on the menu of ${place.id}.`,
          });
        }
      }
    }
    const start = minutes(stop.start);
    const end = minutes(stop.end);
    if (!(start < end) || start < previousEnd) {
      violations.push({
        code: 'stop-order',
        stopIndex,
        userId: null,
        message: `Stop ${stopIndex} (${stop.start}-${stop.end}) overlaps or is out of order.`,
      });
    }
    if (!Number.isNaN(end)) previousEnd = end;
  });

  const cost = computeCost(plan, group, getPlace);
  for (const m of cost.members) {
    if (m.capVnd !== null && m.spendVnd > m.capVnd) {
      violations.push({
        code: 'over-member-cap',
        stopIndex: null,
        userId: m.userId,
        message: `Spending ${vnd(m.spendVnd)} VND is over the cap of ${vnd(m.capVnd)} VND.`,
      });
    }
  }
  if (cost.groupTotalVnd !== null && cost.totalVnd > cost.groupTotalVnd) {
    violations.push({
      code: 'over-group-total',
      stopIndex: null,
      userId: null,
      message: `Total ${vnd(cost.totalVnd)} VND is over the group total of ${vnd(cost.groupTotalVnd)} VND.`,
    });
  }
  return violations;
}
