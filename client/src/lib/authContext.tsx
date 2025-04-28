import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "./queryClient";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Check auth status using React Query
  const { data, isLoading } = useQuery({
    queryKey: ['/api/auth/status'],
    onSuccess: (data) => {
      if (data.isAuthenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    },
    onError: () => {
      setUser(null);
    },
  });

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/login', { username, password });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading: isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
