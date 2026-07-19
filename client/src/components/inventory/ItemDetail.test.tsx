import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import ItemDetail from './ItemDetail';
import { mockItems } from '../../__mocks__/data';
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

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

describe('ItemDetail', () => {
  // Return [] for list endpoints (e.g. the item's trips), the item otherwise.
  const itemQuery = (options: any): any => {
    const key = options.queryKey?.[0];
    if (typeof key === 'string' && key.endsWith('/trips')) {
      return { data: [], isLoading: false, error: null, isError: false };
    }
    return { data: mockItems[0], isLoading: false, error: null, isError: false };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tanstackQuery.useQuery).mockImplementation(itemQuery);
  });

  it('renders correctly with item data', async () => {
    render(<ItemDetail itemId={1} />);
    
    // Wait for the component to render with data
    await waitFor(() => {
      expect(screen.getByText('Tent')).toBeInTheDocument();
      expect(screen.getByText('A 4-person camping tent')).toBeInTheDocument();
      expect(screen.getByText('REI')).toBeInTheDocument();
      expect(screen.getByText('Camping')).toBeInTheDocument();
    });
    
    // Verify storage location info is displayed
    expect(screen.getByText('Storage Location')).toBeInTheDocument();
    expect(screen.getByText('Garage')).toBeInTheDocument();
    
    // Verify condition is displayed
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows loading state', async () => {
    vi.mocked(tanstackQuery.useQuery).mockImplementation((options: any): any => {
      const key = options.queryKey?.[0];
      if (typeof key === 'string' && key.endsWith('/trips')) {
        return { data: [], isLoading: false, error: null, isError: false };
      }
      return { data: undefined, isLoading: true, error: null, isError: false };
    });

    const { container } = render(<ItemDetail itemId={1} />);

    // Loading is shown as a spinner (no text)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(tanstackQuery.useQuery).mockImplementation((options: any): any => {
      const key = options.queryKey?.[0];
      if (typeof key === 'string' && key.endsWith('/trips')) {
        return { data: [], isLoading: false, error: null, isError: false };
      }
      return { data: undefined, isLoading: false, error: new Error('Failed to load item'), isError: true };
    });

    render(<ItemDetail itemId={1} />);

    // Should display error message
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/Unable to load the item details/i)).toBeInTheDocument();
  });

  it('shows status correctly', async () => {
    render(<ItemDetail itemId={1} />);

    await waitFor(() => {
      // mockItems[0].status is 'stored' -> badge reads "Stored"
      expect(screen.getByText('Stored')).toBeInTheDocument();
    });
  });
});