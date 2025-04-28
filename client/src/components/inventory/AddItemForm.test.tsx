import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../test-utils';
import AddItemForm from './AddItemForm';
import { mockAuthContext } from '../../__mocks__/auth';
import * as authHooks from '@/hooks/use-auth';

// Mock the useAuth hook
vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(() => mockAuthContext)
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

describe('AddItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the add button correctly', () => {
    render(<AddItemForm />);
    expect(screen.getByText('Add New Item')).toBeInTheDocument();
  });

  it('opens the dialog when the add button is clicked', async () => {
    render(<AddItemForm />);
    const addButton = screen.getByText('Add New Item');
    
    fireEvent.click(addButton);
    
    // After clicking, the dialog should be open and show the form title
    expect(screen.getByText('Add New Equipment')).toBeInTheDocument();
    expect(screen.getByText('Fill out the form below to add a new item to the inventory.')).toBeInTheDocument();
  });

  it('closes the dialog when cancel button is clicked', async () => {
    render(<AddItemForm />);
    
    // Open the dialog
    fireEvent.click(screen.getByText('Add New Item'));
    
    // Click the cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // The dialog should be closed and the title no longer visible
    expect(screen.queryByText('Add New Equipment')).not.toBeInTheDocument();
  });
});