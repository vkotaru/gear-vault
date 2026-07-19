import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";
import { BUILTIN_CATEGORIES, categoryIcon, type CategoryOption } from "@/lib/categories";

/**
 * The full category list = built-ins + the user's custom categories (from the
 * categories table). Custom categories get the default (tag) icon. Built-ins
 * always come first; duplicates by value are ignored.
 */
export function useCategories(): CategoryOption[] {
  const { data: custom = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });

  const seen = new Set(BUILTIN_CATEGORIES.map((c) => c.value));
  const customOptions: CategoryOption[] = custom
    .filter((c) => !seen.has(c.name))
    .map((c) => ({ value: c.name, label: c.name, icon: categoryIcon(c.name) }));

  return [...BUILTIN_CATEGORIES, ...customOptions];
}
