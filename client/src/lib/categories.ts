import { TentTree, Mountain, Bike, Droplets, CloudSnow, Shirt, Cpu, Wrench, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface CategoryOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

// Single source of truth for item categories (mirrors the schema enum).
export const CATEGORIES: CategoryOption[] = [
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

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS[value] || (value.charAt(0).toUpperCase() + value.slice(1));
}
