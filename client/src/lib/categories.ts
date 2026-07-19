import { TentTree, Mountain, Bike, Droplets, CloudSnow, Shirt, Cpu, Wrench, Package, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BUILTIN_CATEGORIES as BUILTIN_SEED } from "@shared/schema";

export interface CategoryOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

// Resolve a stored icon key (e.g. "camping") to a Lucide icon component.
const ICONS: Record<string, LucideIcon> = {
  camping: TentTree,
  hiking: Mountain,
  biking: Bike,
  water: Droplets,
  winter: CloudSnow,
  clothing: Shirt,
  electronics: Cpu,
  utilities: Wrench,
  other: Package,
  tag: Tag,
};

export function iconForKey(key: string | null | undefined): LucideIcon {
  return (key && ICONS[key]) || Tag;
}

// Built-in categories with resolved icons — used as a fallback before the
// user's category list has loaded from the server.
export const BUILTIN_CATEGORIES: CategoryOption[] = BUILTIN_SEED.map((c) => ({
  value: c.value,
  label: c.name,
  icon: iconForKey(c.icon),
}));

// Kept for any remaining static callers.
export const CATEGORIES = BUILTIN_CATEGORIES;

const BUILTIN_LABELS: Record<string, string> = Object.fromEntries(
  BUILTIN_SEED.map((c) => [c.value, c.name])
);

// Static label fallback (title-cases unknown values).
export function categoryLabel(value: string): string {
  return BUILTIN_LABELS[value] || value.charAt(0).toUpperCase() + value.slice(1);
}
