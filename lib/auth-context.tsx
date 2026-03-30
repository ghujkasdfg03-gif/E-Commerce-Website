"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

/**
 * User type returned from the API (no password field).
 * The `id` is the MongoDB _id as a string.
 */
interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: { name?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key used to persist the current user session in localStorage
const CURRENT_USER_KEY = "electrostore_current_user";

/**
 * Retrieve the stored user from localStorage (session persistence across refreshes).
 */
function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save the current user to localStorage so the session survives page refreshes.
 */
function saveCurrentUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore user session from localStorage
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  /**
   * Login: calls the /api/auth/login endpoint.
   * On success, stores the user in state and localStorage.
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      const loggedInUser: AuthUser = { ...data.user, token: data.token };
      setUser(loggedInUser);
      saveCurrentUser(loggedInUser);
      return { success: true };
    } catch {
      return { success: false, error: "Something went wrong. Please try again." };
    }
  }, []);

  /**
   * Signup: calls the /api/auth/signup endpoint.
   * On success, stores the new user in state and localStorage.
   */
  const signup = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, phone }),
        });

        const data = await res.json();

        if (!res.ok) {
          return { success: false, error: data.error || "Signup failed" };
        }

        const newUser: AuthUser = { ...data.user, token: data.token };
        setUser(newUser);
        saveCurrentUser(newUser);
        return { success: true };
      } catch {
        return { success: false, error: "Something went wrong. Please try again." };
      }
    },
    []
  );

  /**
   * Logout: clears user from state and localStorage.
   */
  const logout = useCallback(() => {
    setUser(null);
    saveCurrentUser(null);
  }, []);

  /**
   * Update profile: persists changes to MongoDB via the profile API.
   */
  const updateProfile = useCallback(
    async (updates: { name?: string; phone?: string }) => {
      if (!user) return { success: false, error: "Not logged in" };
      try {
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(updates),
        });

        const data = await res.json();

        if (!res.ok) {
          return { success: false, error: data.error || "Update failed" };
        }

        const updatedUser: AuthUser = { ...data.user, token: user.token };
        setUser(updatedUser);
        saveCurrentUser(updatedUser);
        return { success: true };
      } catch {
        return { success: false, error: "Something went wrong. Please try again." };
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, updateProfile }}
    >
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
