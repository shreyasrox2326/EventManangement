"use client";

import { ReactNode } from "react";
import { RoleGuard } from "@/app/providers";
import { CorporateProfileGate } from "@/components/auth/ProfileGate";
import { PortalShell } from "@/components/navigation/PortalShell";

const navItems = [
  { label: "Dashboard", href: "/corporate" },
  { label: "Browse Events", href: "/corporate/request" },
  { label: "Bookings", href: "/corporate/bookings" },
  { label: "Live Tickets", href: "/corporate/tickets" },
  { label: "Notifications", href: "/corporate/notifications" }
];

export default function CorporateLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["CORPORATE_CLIENT"]}>
      <PortalShell title="Corporate Booking Desk" navItems={navItems}>
        <CorporateProfileGate>{children}</CorporateProfileGate>
      </PortalShell>
    </RoleGuard>
  );
}
