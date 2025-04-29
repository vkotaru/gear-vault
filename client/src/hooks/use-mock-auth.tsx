import { createContext, ReactNode, useContext } from "react";
import { User as SelectUser } from "@shared/schema";

// Create a mock user that will always be returned
const MOCK_ADMIN_USER: SelectUser = {
  id: 1,
  username: "admin",
  password: "", // Password is never exposed in the frontend
};

// Simplified auth context that always returns the admin user
type MockAuthContextType = {
  user: SelectUser;
  isLoading: boolean;
  error: null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

// Create the mock context with the admin user
export const MockAuthContext = createContext<MockAuthContextType>({
  user: MOCK_ADMIN_USER,
  isLoading: false,
  error: null,
  loginMutation: {
    mutate: () => {},
    isPending: false,
  },
  logoutMutation: {
    mutate: () => {},
    isPending: false,
  },
  registerMutation: {
    mutate: () => {},
    isPending: false,
  },
});

// Provider component that supplies the mock auth context
export function MockAuthProvider({ children }: { children: ReactNode }) {
  // Always return the admin user
  return (
    <MockAuthContext.Provider
      value={{
        user: MOCK_ADMIN_USER,
        isLoading: false,
        error: null,
        loginMutation: {
          mutate: () => {},
          isPending: false,
        },
        logoutMutation: {
          mutate: () => {},
          isPending: false,
        },
        registerMutation: {
          mutate: () => {},
          isPending: false,
        },
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
}

// Custom hook that works the same as useAuth but always returns the admin user
export function useMockAuth() {
  return useContext(MockAuthContext);
}