"use client";

import React, { createContext, useContext, useState, useEffect, useTransition, useRef, useCallback } from "react";
import { loadProfile } from "@/services/auth/auth.service";
import { usePathname } from "next/navigation";

type AuthUser = {
  Id: number;
  username: string;
  Name: string;
  Email: string;
  name?: string;
  email?: string;
  mobile_number: string | null;
  status: string;
  role?: {
    id: number;
    name: string;
    description: string;
  };
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  refreshProfile: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const pathname = usePathname();
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track in-flight requests to avoid race conditions
  const fetchCounterRef = useRef(0);

  // Keep state in sync with server component updates (initialUser changes on navigation)
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  const refreshProfile = useCallback(async (): Promise<AuthUser | null> => {
    // Increment counter to track this specific fetch
    const currentFetch = ++fetchCounterRef.current;
    setLoading(true);
    try {
      const res = await loadProfile();
      // Discard stale responses — only apply the latest fetch result
      if (currentFetch !== fetchCounterRef.current) return null;

      if (res.success && res.data) {
        setUser(res.data);
        return res.data;
      } else {
        // Only clear user if explicitly unauthenticated (not transient network errors)
        if (res.message?.toLowerCase().includes("unauthorized") ||
            res.message?.toLowerCase().includes("token") ||
            res.message?.toLowerCase().includes("session")) {
          setUser(null);
        }
        return null;
      }
    } catch (error) {
      // Discard stale or errored responses from superseded fetches
      if (currentFetch !== fetchCounterRef.current) return null;
      // DO NOT wipe user on transient errors (network failure, 502, timeout)
      // The user is still authenticated — keep existing state
      console.error("Error refreshing profile:", error);
      return null;
    } finally {
      if (currentFetch === fetchCounterRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Revalidate profile reactively on route navigation
  // Debounced 150ms to absorb rapid tab switching (prevents fetch storm)
  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      startTransition(async () => {
        await refreshProfile();
      });
    }, 150);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [pathname, refreshProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
