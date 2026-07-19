import { TentTree, Mountain, Bike, Droplets, CloudSnow, Shirt, Cpu, Wrench, Package, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CategoryOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

// Built-in categories (always available). Users can add more via Settings,
// which are merged in at runtime by the useCategories hook.
export const BUILTIN_CATEGORIES: CategoryOption[] = [
  { value: "camping", label: "Camping", icon: TentTree },
  { value: "hiking", label: "Hiking", icon: Mountain },
  { value: "biking", label: "Biking", icon: Bike },
  { value: "water", label: "Water", icon: Droplets },
  { value: "winter", label: "Winter", icon: CloudSnow },
  { value: "clothing", label: "Clothing", icon: Shirt },
  { value: "electronics", label: "Electronics", icon: Cpu },
  { value: "utilities", label: "Utilities", icon: Wrench },
  { value: "other", label: "Other", icon: Package },
];

// Kept for existing imports; built-ins only. Prefer useCategories() for the
// full list including a user's custom categories.
export const CATEGORIES = BUILTIN_CATEGORIES;

const BUILTIN_BY_VALUE: Record<string, CategoryOption> = Object.fromEntries(
  BUILTIN_CATEGORIES.map((c) => [c.value, c])
);

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BUILTIN_CATEGORIES.map((c) => [c.value, c.label])
);

// Title-case a raw category value for display (used for custom categories).
export function categoryLabel(value: string): string {
  return BUILTIN_BY_VALUE[value]?.label
    || value.charAt(0).toUpperCase() + value.slice(1);
}

// Icon for any category value; custom categories fall back to a tag icon.
export function categoryIcon(value: string): LucideIcon {
  return BUILTIN_BY_VALUE[value]?.icon || Tag;
}
