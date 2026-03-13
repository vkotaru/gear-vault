import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import AllGear from './AllGear';
import { mockItems } from '../__mocks__/data';
import * as tanstackQuery from '@tanstack/react-query';

// Mock useAuth directly in this file
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'testuser',
      password: 'hashed_password'
    },
    isLoading: false,
    error: null,
    loginMutation: {
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    },
    logoutMutation: {
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    },
    registerMutation: {
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    }
  })
}));

// Mock the useQuery hook from react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn()
  };
});

// Mock Layout component to simplify tests
vi.mock('@/components/layout/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-layout">{children}</div>
}));

// Mock AddItemForm component
vi.mock('@/components/inventory/AddItemForm', () => ({
  default: () => <button>Mock Add Item</button>
}));

describe('AllGear', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the useQuery to return mock data
    vi.mocked(tanstackQuery.useQuery).mockReturnValue({
      data: mockItems,
      isLoading: false,
      error: null,
      isError: false,
    } as any);
  });

  it('renders correctly with items', async () => {
    render(<AllGear />);
    
    // Check if page title is rendered
    expect(screen.getByText('All Gear')).toBeInTheDocument();
    
    // Check if the filter buttons are rendered
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Camping')).toBeInTheDocument();
    expect(screen.getByText('Hiking')).toBeInTheDocument();
    expect(screen.getByText('Biking')).toBeInTheDocument();
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('Winter')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
    
    // Check if items are rendered
    await waitFor(() => {
      expect(screen.getByText('Tent')).toBeInTheDocument();
      expect(screen.getByText('Hiking Boots')).toBeInTheDocument();
      expect(screen.getByText('Mountain Bike')).toBeInTheDocument();
    });
  });

  it('filters items by category', async () => {
    render(<AllGear />);
    
    // Initially all items should be visible
    expect(screen.getByText('Tent')).toBeInTheDocument();
    expect(screen.getByText('Hiking Boots')).toBeInTheDocument();
    
    // Click on the Camping filter
    fireEvent.click(screen.getByText('Camping'));
    
    // Only camping items should be visible
    await waitFor(() => {
      expect(screen.getByText('Tent')).toBeInTheDocument();
      expect(screen.queryByText('Hiking Boots')).not.toBeInTheDocument();
      expect(screen.queryByText('Mountain Bike')).not.toBeInTheDocument();
    });
    
    // Click on the Mountain filter
    fireEvent.click(screen.getByText('Hiking'));
    
    // Only hiking/mountain items should be visible
    await waitFor(() => {
      expect(screen.queryByText('Tent')).not.toBeInTheDocument();
      expect(screen.getByText('Hiking Boots')).toBeInTheDocument();
      expect(screen.queryByText('Mountain Bike')).not.toBeInTheDocument();
    });
  });

  it('filters items by search term', async () => {
    render(<AllGear />);
    
    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search by name, description, or brand...');
    fireEvent.change(searchInput, { target: { value: 'Kayak' } });
    
    // Only items matching the search should be visible
    await waitFor(() => {
      expect(screen.queryByText('Tent')).not.toBeInTheDocument();
      expect(screen.queryByText('Hiking Boots')).not.toBeInTheDocument();
      expect(screen.getByText('Kayak')).toBeInTheDocument();
    });
  });

  it('shows empty state when no items match filters', async () => {
    render(<AllGear />);
    
    // Type a search term that won't match any items
    const searchInput = screen.getByPlaceholderText('Search by name, description, or brand...');
    fireEvent.change(searchInput, { target: { value: 'NotExistingItem' } });
    
    // Should show the empty state
    await waitFor(() => {
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });
});