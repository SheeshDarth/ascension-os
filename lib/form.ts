export function normalizeNumber(value: string, fallback = 0) {
  if (value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeText(value: string) {
  return value.trim();
}

export function normalizeBoolean(value: unknown) {
  return Boolean(value);
}
