import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils';
import ItemDetail from './ItemDetail';
import { mockAuthContext } from '../../__mocks__/auth';
import { mockItems } from '../../__mocks__/data';
import * as tanstackQuery from '@tanstack/react-query';

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => mockAuthContext)
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
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the useQuery to return mock item
    vi.mocked(tanstackQuery.useQuery).mockReturnValue({
      data: mockItems[0],
      isLoading: false,
      error: null,
      isError: false,
    } as any);
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
    // Override the mock to show loading state
    vi.mocked(tanstackQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
    } as any);
    
    render(<ItemDetail itemId={1} />);
    
    // Should display loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles error state', async () => {
    // Override the mock to show error state
    vi.mocked(tanstackQuery.useQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load item'),
      isError: true,
    } as any);
    
    render(<ItemDetail itemId={1} />);
    
    // Should display error message
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to load item/i)).toBeInTheDocument();
  });

  it('shows availability status correctly', async () => {
    render(<ItemDetail itemId={1} />);
    
    // Wait for the component to render with data
    await waitFor(() => {
      // Check if the status is displayed correctly (Available)
      expect(screen.getByText('Available')).toBeInTheDocument();
    });
  });
});