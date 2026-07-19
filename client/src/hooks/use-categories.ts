import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";
import { BUILTIN_CATEGORIES, iconForKey, categoryLabel, type CategoryOption } from "@/lib/categories";

interface UseCategories {
  list: CategoryOption[];
  labelFor: (value: string) => string;
  iconFor: (value: string) => CategoryOption["icon"];
}

/**
 * The user's category list (built-ins seeded server-side + custom), resolved to
 * display options. Falls back to the built-in set until the query loads.
 * labelFor/iconFor resolve an item's stored category value to its current
 * display label/icon (so renames are reflected on item cards).
 */
export function useCategories(): UseCategories {
  const { data } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const list: CategoryOption[] = data && data.length
    ? data.map((c) => ({ value: c.value ?? c.name, label: c.name, icon: iconForKey(c.icon) }))
    : BUILTIN_CATEGORIES;

  const byValue = new Map(list.map((c) => [c.value, c]));
  return {
    list,
    labelFor: (value: string) => byValue.get(value)?.label ?? categoryLabel(value),
    iconFor: (value: string) => byValue.get(value)?.icon ?? iconForKey("tag"),
  };
}
