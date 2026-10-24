/** Tunable settings. Each has a default here that an environment variable can override. */
export type Settings = {
  /** Hours between the starts of distill passes. DISTILL_INTERVAL_HOURS, default 24. */
  distillIntervalHours: number;
  /** Most the distill may spend on model calls per UTC day. DAILY_SPEND_CAP_USD, default 1. */
  dailySpendCapUsd: number;
};

export function getSettings(env: NodeJS.ProcessEnv = process.env): Settings {
  return {
    distillIntervalHours: positiveNumber(env, "DISTILL_INTERVAL_HOURS", 24),
    dailySpendCapUsd: positiveNumber(env, "DAILY_SPEND_CAP_USD", 1),
  };
}

function positiveNumber(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!(value > 0)) throw new Error(`${name} must be a positive number, got "${raw}"`);
  return value;
}
