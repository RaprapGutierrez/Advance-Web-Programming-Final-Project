// src/lib/auth.tsx
// Mock auth for UI testing only. Replace with real API/JWT later.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Role = "customer" | "owner";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
}

// Fake accounts so you can test both sides quickly
export const MOCK_USERS: Record<Role, AuthUser> = {
  customer: { id: "cust-1", name: "Test Customer", role: "customer" },
  owner: { id: "owner-1", name: "Studio Owner", role: "owner" },
};

interface AuthContextValue {
  user: AuthUser | null;
  loginAs: (role: Role, profile?: { id?: string; name?: string }) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "studiospace_mock_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [user]);

  const value: AuthContextValue = {
    user,
    loginAs: (role, profile) =>
      setUser({
        ...MOCK_USERS[role],
        ...(profile?.id ? { id: profile.id } : {}),
        ...(profile?.name ? { name: profile.name } : {}),
      }),
    logout: () => setUser(null),
    hasRole: (...roles) => !!user && roles.includes(user.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
