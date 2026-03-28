"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { User } from "./types";

interface AuthContextType {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: { name?: string; phone?: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = "electrostore_users";
const CURRENT_USER_KEY = "electrostore_current_user";

function getStoredUsers(): User[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CURRENT_USER_KEY);
  } catch {
    return null;
  }
}

function setCurrentUserId(userId: string | null) {
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function stripPassword(user: User): Omit<User, "password"> {
  const { password: _, ...rest } = user;
  return rest;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      const users = getStoredUsers();
      const found = users.find((u) => u.id === userId);
      if (found) {
        setUser(stripPassword(found));
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const users = getStoredUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!found) {
      return { success: false, error: "No account found with this email" };
    }

    const hashedPassword = await hashPassword(password);
    if (found.password !== hashedPassword) {
      return { success: false, error: "Incorrect password" };
    }

    setUser(stripPassword(found));
    setCurrentUserId(found.id);
    return { success: true };
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const users = getStoredUsers();
      const exists = users.some(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (exists) {
        return { success: false, error: "An account with this email already exists" };
      }

      const hashedPassword = await hashPassword(password);
      const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email: email.toLowerCase(),
        phone: phone || undefined,
        password: hashedPassword,
      };

      const updatedUsers = [...users, newUser];
      saveUsers(updatedUsers);
      setUser(stripPassword(newUser));
      setCurrentUserId(newUser.id);
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    setCurrentUserId(null);
  }, []);

  const updateProfile = useCallback(
    (updates: { name?: string; phone?: string }) => {
      if (!user) return;
      const users = getStoredUsers();
      const updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, ...updates } : u
      );
      saveUsers(updatedUsers);
      setUser((prev) => (prev ? { ...prev, ...updates } : prev));
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
