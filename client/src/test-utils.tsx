import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode, createContext } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockAuthContext } from './__mocks__/auth';

// Create mock auth context for tests
export const MockAuthContext = createContext(mockAuthContext);
export const MockAuthProvider = ({ children }: { children: ReactNode }) => (
  <MockAuthContext.Provider value={mockAuthContext}>
    {children}
  </MockAuthContext.Provider>
);

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  // Create a new QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render method
export { customRender as render };