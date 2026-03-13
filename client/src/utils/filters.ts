import { Item } from '@shared/schema';

/**
 * Filters items by a search term
 * @param items Array of items to filter
 * @param searchTerm Search term to filter by
 * @returns Filtered array of items
 */
export function filterItemsBySearchTerm(items: Item[], searchTerm: string) {
  if (!searchTerm) return items;
  
  return items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (item.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
}

/**
 * Filters items by category
 * @param items Array of items to filter
 * @param categoryFilter Category to filter by
 * @returns Filtered array of items
 */
export function filterItemsByCategory(items: Item[], categoryFilter: string) {
  if (!categoryFilter || categoryFilter === 'all') return items;
  
  return items.filter(item => item.category === categoryFilter);
}

/**
 * Filters items by status
 * @param items Array of items to filter
 * @param statusFilter Status to filter by
 * @returns Filtered array of items
 */
export function filterItemsByStatus(items: Item[], statusFilter: string) {
  if (!statusFilter || statusFilter === 'all') return items;
  
  return items.filter(item => item.status === statusFilter);
}

/**
 * Apply all filters to an array of items
 * @param items Array of items to filter
 * @param searchTerm Search term to filter by
 * @param categoryFilter Category to filter by
 * @param statusFilter Status to filter by
 * @returns Filtered array of items
 */
export function applyAllFilters(
  items: Item[], 
  searchTerm: string = '', 
  categoryFilter: string = '', 
  statusFilter: string = ''
) {
  let filteredItems = items;
  
  if (searchTerm) {
    filteredItems = filterItemsBySearchTerm(filteredItems, searchTerm);
  }
  
  if (categoryFilter) {
    filteredItems = filterItemsByCategory(filteredItems, categoryFilter);
  }
  
  if (statusFilter) {
    filteredItems = filterItemsByStatus(filteredItems, statusFilter);
  }
  
  return filteredItems;
}