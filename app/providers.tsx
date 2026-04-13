"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { LoginResponseDto, UserRole } from "@/types/contracts";
import { canAccessPath } from "@/utils/rbac";
import { rolePaths } from "@/utils/constants";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

interface AuthContextValue {
  session: LoginResponseDto | null;
  isHydrated: boolean;
  login: (session: LoginResponseDto) => void;
  logout: () => void;
  activeRole: UserRole | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);

const THEME_KEY = "emts-theme";

export function AppProviders({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [session, setSession] = useState<LoginResponseDto | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY) as ThemeMode | null;
    const resolvedTheme = storedTheme ?? "dark";
    setTheme(resolvedTheme);
    document.documentElement.dataset.theme = resolvedTheme;
    setSession(authService.getSession());
    setIsHydrated(true);
  }, []);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem(THEME_KEY, next);
      return next;
    });
  };

  const authValue = useMemo<AuthContextValue>(
    () => ({
      session,
      isHydrated,
      login: (nextSession) => {
        setSession(nextSession);
        authService.saveSession(nextSession);
      },
      logout: () => {
        setSession(null);
        authService.clearSession();
      },
      activeRole: session?.user.roleCode ?? null
    }),
    [isHydrated, session]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within AppProviders");
  }
  return context;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AppProviders");
  }
  return context;
};

export function RoleGuard({
  allowedRoles,
  children
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!session) {
      router.replace("/auth/login");
      return;
    }

    if (!allowedRoles.includes(session.user.roleCode) || !canAccessPath(session.user.roleCode, pathname)) {
      router.replace(rolePaths[session.user.roleCode]);
    }
  }, [allowedRoles, isHydrated, pathname, router, session]);

  if (!isHydrated || !session || !allowedRoles.includes(session.user.roleCode)) {
    return (
      <div className="container" style={{ padding: "120px 0" }}>
        <div className="card panel skeleton" style={{ height: 280, borderRadius: 32 }} />
      </div>
    );
  }

  return <>{children}</>;
}
