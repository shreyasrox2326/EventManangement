"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { Bell, Building2, LayoutDashboard, LogOut, QrCode, Shield, Ticket, UserRound } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { useAuth } from "@/app/providers";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

export interface PortalNavItem {
  label: string;
  href: string;
}

const getNavIcon = (label: string, href: string) => {
  const key = `${label} ${href}`.toLowerCase();
  if (key.includes("notification")) return Bell;
  if (key.includes("scan")) return QrCode;
  if (key.includes("ticket")) return Ticket;
  if (key.includes("security") || key.includes("admin")) return Shield;
  if (key.includes("corporate") || key.includes("booking")) return Building2;
  return LayoutDashboard;
};

export function PortalShell({
  title,
  navItems,
  children
}: {
  title: string;
  navItems: PortalNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, session } = useAuth();
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const roleCode = session?.user.roleCode;
  const userId = session?.user.userId ?? "";
  const { data: profileLabel } = useAsyncResource(
    async () => {
      if (!userId || !roleCode) {
        return "";
      }

      if (roleCode === "ORGANIZER") {
        const profile = await emtsApi.getOrganizerProfile(userId);
        return profile?.orgName ?? "";
      }

      if (roleCode === "CORPORATE_CLIENT") {
        const profile = await emtsApi.getCorporateProfile(userId);
        return profile?.companyName ?? "";
      }

      return "";
    },
    [roleCode, userId]
  );

  const mobileNavItems = useMemo(
    () => [...navItems.slice(0, 3), { label: "You", href: "#you" }],
    [navItems]
  );

  return (
    <div className="portal-layout page-reveal">
      <aside
        className="portal-sidebar"
        style={{
          padding: 18,
          borderRight: "1px solid var(--line)",
          position: "sticky",
          top: 0,
          height: "100vh",
          background: "color-mix(in srgb, var(--surface-strong) 76%, transparent)"
        }}
      >
        <div className="card panel" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
          <Logo compact />
          <div className="pill" style={{ justifyContent: "space-between" }}>
            <span>{title}</span>
            <LayoutDashboard size={16} />
          </div>
          <nav style={{ display: "grid", gap: 10 }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx("button", isActive ? "button-primary" : "button-secondary")}
                  style={{ justifyContent: "flex-start" }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div style={{ marginTop: "auto", display: "grid", gap: 12, width: "100%", minWidth: 0 }}>
            <div className="card" style={{ padding: 16, width: "100%", minWidth: 0 }}>
              <div className="eyebrow">Signed in</div>
              <div style={{ fontWeight: 700, marginTop: 6, color: "var(--text)" }}>{session?.user.fullName}</div>
              {profileLabel && (
                <div className="muted" style={{ marginTop: 4 }}>
                  {profileLabel}
                </div>
              )}
              <div className="muted" style={{ marginTop: 4 }}>
                {session?.user.emailAddress}
              </div>
            </div>
            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", width: "100%", minWidth: 0 }}>
              <ThemeToggle />
              <button
                className="button button-secondary"
                type="button"
                style={{ width: "100%" }}
                onClick={() => {
                  logout();
                  router.replace("/auth/login");
                }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="portal-main">
        <div style={{ display: "grid", gap: 20 }}>
          <div className="card panel portal-header" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, letterSpacing: "-0.05em" }}>{title}</h1>
            </div>
          </div>
          {children}
        </div>
      </main>
      <div className="mobile-bottom-nav">
        {mobileNavItems.map((item) => {
          const isYou = item.href === "#you";
          const isActive = !isYou && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const Icon = isYou ? UserRound : getNavIcon(item.label, item.href);

          if (isYou) {
            return (
              <button
                key={item.label}
                type="button"
                className={clsx("mobile-tab", showAccountPanel && "mobile-tab-active")}
                onClick={() => setShowAccountPanel((current) => !current)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={clsx("mobile-tab", isActive && "mobile-tab-active")}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      {showAccountPanel && (
        <div className="mobile-account-sheet">
          <div className="card panel" style={{ display: "grid", gap: 14 }}>
            <div>
              <div className="eyebrow">Signed in</div>
              <div style={{ fontWeight: 700, marginTop: 6, color: "var(--text)" }}>{session?.user.fullName}</div>
              {profileLabel && <div className="muted" style={{ marginTop: 4 }}>{profileLabel}</div>}
              <div className="muted" style={{ marginTop: 4 }}>{session?.user.emailAddress}</div>
            </div>
            <ThemeToggle />
            <button
              className="button button-secondary"
              type="button"
              style={{ width: "100%" }}
              onClick={() => {
                logout();
                router.replace("/auth/login");
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
