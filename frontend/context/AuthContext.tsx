"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  org_id: number;
  group_id?: number;
  permissions: Record<string, { read: boolean; write: boolean }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  hasPermission: (screen: string, action: "read" | "write") => boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("trippilot_token");
  };

  const hasPermission = (screen: string, action: "read" | "write"): boolean => {
    if (!user) return false;
    // Check group-based permissions
    if (!user.permissions) return false;
    return user.permissions[screen]?.[action] || false;
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("trippilot_token");
      localStorage.removeItem("trippilot_user");
    }
    setUser(null);
  };

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
        } else {
          throw new Error("Failed to fetch user");
        }
        return;
      }

      const userData = await res.json();
      setUser(userData);
      localStorage.setItem("trippilot_user", JSON.stringify(userData));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Populate from cache immediately so the UI renders without waiting for /auth/me
    const cached = localStorage.getItem("trippilot_user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
        setLoading(false);
      } catch {}
    }
    // Validate token in background; logs out if expired
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    hasPermission,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
