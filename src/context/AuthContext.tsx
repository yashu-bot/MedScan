
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect }  from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

interface AuthContextType {
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter(); // Initialize router

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/patient/auth/me', { cache: 'no-store' });
        const json = await res.json();
        setIsLoggedIn(Boolean(json?.user));
      } catch {
        setIsLoggedIn(false);
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch('/api/patient/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) return false;
      setIsLoggedIn(true);
      router.push('/patient/dashboard');
      return true;
    } catch {
      return false;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/patient/auth/logout', { method: 'POST' });
    } catch {}
    setIsLoggedIn(false);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
