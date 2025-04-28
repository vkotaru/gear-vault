import { vi } from 'vitest';

// Mock user data
export const mockUser = {
  id: 1,
  username: 'testuser',
  password: 'hashed_password'
};

// Mock authentication context
export const mockAuthContext = {
  user: mockUser,
  isLoading: false,
  error: null,
  loginMutation: {
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
  },
  logoutMutation: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }
};

// Mock for unauthenticated state
export const mockUnauthenticatedContext = {
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {
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
  },
  logoutMutation: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }
};