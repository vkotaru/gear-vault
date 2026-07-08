export interface StatusOption {
  value: string;
  label: string;
  badgeClass: string;
}

// Single source of truth for item status (mirrors the schema enum).
export const STATUSES: StatusOption[] = [
  { value: "stored", label: "Stored", badgeClass: "bg-muted text-muted-foreground" },
  { value: "in_use", label: "In use", badgeClass: "bg-primary/15 text-primary" },
  { value: "lent", label: "Lent out", badgeClass: "bg-secondary/15 text-secondary" },
  { value: "unknown", label: "Unknown", badgeClass: "bg-destructive/15 text-destructive" },
];

const BY_VALUE: Record<string, StatusOption> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s])
);

export function statusLabel(value: string): string {
  return BY_VALUE[value]?.label || value;
}

export function statusBadgeClass(value: string): string {
  return BY_VALUE[value]?.badgeClass || "bg-muted text-muted-foreground";
}
