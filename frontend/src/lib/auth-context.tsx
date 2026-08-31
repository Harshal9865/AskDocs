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
  /** object URL of the uploaded profile photo (when avatar_kind === "upload") */
  avatarSrc: string | null;
  login: (email: string, password: string) => Promise<User>;
  googleLogin: (idToken: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => void;
  /** update local user + re-resolve avatar after changes */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  avatarSrc: null,
  login: async () => ({} as User),
  googleLogin: async () => ({} as User),
  register: async () => ({} as User),
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // resolve the uploaded photo into an object URL
  const applyUser = useCallback(async (u: User | null) => {
    setUser(u);
    if (u?.avatar_kind === "upload" && u.avatar_value) {
      try {
        setAvatarSrc(await api.getAvatarPhotoUrl());
      } catch {
        setAvatarSrc(null);
      }
    } else {
      setAvatarSrc(null);
    }
  }, []);

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
        const me = await api.me();
        await applyUser(me);
      } catch {
        setTokens(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [applyUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const pair = await api.login(email, password);
      setTokens({ access: pair.access_token, refresh: pair.refresh_token });
      const me = await api.me();
      await applyUser(me);
      return me;
    },
    [applyUser],
  );

  const googleLogin = useCallback(
    async (idToken: string) => {
      await api.googleLogin(idToken);
      const me = await api.me();
      await applyUser(me);
      return me;
    },
    [applyUser],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      await api.register(email, password, name);
      return await login(email.trim().toLowerCase(), password);
    },
    [login],
  );

  const refreshUser = useCallback(async () => {
    if (!tokensAvailable()) return;
    await applyUser(await api.me());
  }, [applyUser]);

  function tokensAvailable() {
    return Boolean(localStorage.getItem(REFRESH_KEY));
  }

  const logout = useCallback(() => {
    setTokens(null);
    setUser(null);
    setAvatarSrc(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, avatarSrc, loading, login, googleLogin, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
