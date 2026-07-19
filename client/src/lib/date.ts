import { format } from "date-fns";

/**
 * Format a date-only value (e.g. a bought date or trip date) without any
 * timezone shift. These are stored as UTC midnight, so formatting them in the
 * browser's local time can roll the calendar date back a day (e.g. entering
 * 2022-02-17 in UTC-7 would otherwise show February 16). We rebuild the date
 * from its UTC components so the displayed calendar date matches what was entered.
 */
export function formatDateOnly(
  value: string | Date | null | undefined,
  fmt = "MMM d, yyyy"
): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return format(local, fmt);
}
