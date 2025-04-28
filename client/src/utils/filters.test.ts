import { describe, it, expect } from 'vitest';
import { mockItems } from '../__mocks__/data';
import { 
  filterItemsBySearchTerm, 
  filterItemsByCategory, 
  filterItemsByStatus,
  applyAllFilters
} from './filters';

describe('Item Filtering', () => {
  describe('filterItemsBySearchTerm', () => {
    it('returns all items when search term is empty', () => {
      const result = filterItemsBySearchTerm(mockItems, '');
      expect(result).toHaveLength(mockItems.length);
    });

    it('filters items by name', () => {
      const result = filterItemsBySearchTerm(mockItems, 'tent');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tent');
    });

    it('filters items by description', () => {
      const result = filterItemsBySearchTerm(mockItems, 'waterproof');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hiking Boots');
    });

    it('filters items by brand', () => {
      const result = filterItemsBySearchTerm(mockItems, 'burton');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Snowboard');
    });

    it('returns empty array when no items match', () => {
      const result = filterItemsBySearchTerm(mockItems, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterItemsByCategory', () => {
    it('returns all items when category filter is empty', () => {
      const result = filterItemsByCategory(mockItems, '');
      expect(result).toHaveLength(mockItems.length);
    });

    it('returns all items when category filter is "all"', () => {
      const result = filterItemsByCategory(mockItems, 'all');
      expect(result).toHaveLength(mockItems.length);
    });

    it('filters items by camping category', () => {
      const result = filterItemsByCategory(mockItems, 'camping');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tent');
    });

    it('filters items by hiking category', () => {
      const result = filterItemsByCategory(mockItems, 'hiking');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Hiking Boots');
    });

    it('returns empty array when no items match the category', () => {
      const result = filterItemsByCategory(mockItems, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterItemsByStatus', () => {
    it('returns all items when status filter is empty', () => {
      const result = filterItemsByStatus(mockItems, '');
      expect(result).toHaveLength(mockItems.length);
    });

    it('returns all items when status filter is "all"', () => {
      const result = filterItemsByStatus(mockItems, 'all');
      expect(result).toHaveLength(mockItems.length);
    });

    it('filters items by available status', () => {
      const result = filterItemsByStatus(mockItems, 'available');
      const availableCount = mockItems.filter(item => item.status === 'available').length;
      expect(result).toHaveLength(availableCount);
      expect(result.every(item => item.status === 'available')).toBe(true);
    });

    it('filters items by checked_out status', () => {
      const result = filterItemsByStatus(mockItems, 'checked_out');
      const checkedOutCount = mockItems.filter(item => item.status === 'checked_out').length;
      expect(result).toHaveLength(checkedOutCount);
      expect(result.every(item => item.status === 'checked_out')).toBe(true);
    });
  });

  describe('Combined filtering', () => {
    it('filters items by multiple criteria', () => {
      // Apply filters in sequence
      let result = filterItemsBySearchTerm(mockItems, 'bike');
      result = filterItemsByCategory(result, 'biking');
      result = filterItemsByStatus(result, 'checked_out');
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mountain Bike');
    });
  });
});