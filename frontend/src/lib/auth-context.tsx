"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, setTokens } from "@/lib/api";
import type { User } from "@/lib/types";

const REFRESH_KEY = "askdocs_refresh";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // bootstrap session from stored refresh token
  useEffect(() => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    api.setOnTokens((t) => {
      if (t?.refresh) localStorage.setItem(REFRESH_KEY, t.refresh);
      else localStorage.removeItem(REFRESH_KEY);
    });
    if (!refresh) {
      setLoading(false);
      return;
    }
    setTokens({ access: "", refresh });
    (async () => {
      try {
        // empty access token forces a 401 -> silent refresh inside request()
        const me = await api.me();
        setUser(me);
      } catch {
        setTokens(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const pair = await api.login(email, password);
    setTokens({ access: pair.access_token, refresh: pair.refresh_token });
    setUser(await api.me());
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      await api.register(email, password, name);
      await login(email, password);
    },
    [login],
  );

  const logout = useCallback(() => {
    setTokens(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
