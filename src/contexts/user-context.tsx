"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  accessStatus?: string;
  canAccessHub?: boolean;
  canAccessConference?: boolean | null;
  canAccessAdmin?: boolean | null;
  roleChangedAt: string | null;
  sessionCreatedAt: string;
}

interface UserContextValue {
  user: AuthUser | null;
  /** true only during the initial fetch — never flashes back to true */
  loading: boolean;
  /** Call after sign in / sign out to refresh the user state */
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  const fetchUser = useCallback(async () => {
    // If just logged out, skip the fetch and immediately show logged-out state
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("logout=1")
    ) {
      setUser(null);
      setLoading(false);
      // Clean up the URL param without triggering a reload
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Safety net: never let the loading skeleton show for more than 4 s
    const giveUp = setTimeout(() => {
      setLoading(false);
    }, 4000);

    try {
      // Cache-buster ensures the browser never serves a stale /me response
      const res = await fetch(`/api/auth/me?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
        credentials: "include",
      });
      const data = (await res.json()) as Partial<AuthUser> & { id?: string };
      setUser(data.id ? (data as AuthUser) : null);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
      setUser(null);
    } finally {
      clearTimeout(giveUp);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, loading, refresh: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
