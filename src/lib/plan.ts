export const PLAN_LIMITS = {
  free: { maxProducts: 10 },
  pro: { maxProducts: Infinity },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

export const PRO_PLAN_PRICE_PYG = 220_000;
