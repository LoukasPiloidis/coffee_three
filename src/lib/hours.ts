import type { ShopSettings } from "./menu";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function parseRange(range: string): [number, number] | null {
  // "HH:MM-HH:MM"
  const m = range.match(/^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const start = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const end = parseInt(m[3], 10) * 60 + parseInt(m[4], 10);
  return [start, end];
}

export function isWithinDeliveryHours(
  settings: ShopSettings,
  now: Date = new Date()
): boolean {
  const day = DAY_KEYS[now.getDay()];
  const range = settings.deliveryHours[day];
  if (!range) return false;
  const parsed = parseRange(range);
  if (!parsed) return false;
  const [start, end] = parsed;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= start && minutes < end;
}
