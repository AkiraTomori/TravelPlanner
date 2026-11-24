export interface MenuItem {
  id: string;
  priceVnd: number;
}

export interface Place {
  id: string;
  items: MenuItem[];
}

export interface Stop {
  placeId: string;
  /** "HH:MM", 24-hour, local time. */
  start: string;
  end: string;
  items: { itemId: string; forUserIds: string[] }[];
}

export interface Plan {
  id: string;
  groupId: string;
  createdBy: string;
  version: number;
  status: 'draft' | 'saved';
  stops: Stop[];
  savedAt: string | null;
  savedBy: string | null;
}

export interface Group {
  id: string;
  memberIds: string[];
  /** null for an individual plan (group of one, no group total). */
  totalVnd: number | null;
  capsVnd: Record<string, number | null>;
}

export type ViolationCode =
  'unknown-place' | 'unknown-item' | 'over-member-cap' | 'over-group-total' | 'stop-order';

export interface Violation {
  code: ViolationCode;
  stopIndex: number | null;
  userId: string | null;
  message: string;
}

export interface PlanCost {
  totalVnd: number;
  groupTotalVnd: number | null;
  members: { userId: string; spendVnd: number; capVnd: number | null }[];
}
