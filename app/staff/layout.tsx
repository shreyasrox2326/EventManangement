"use client";

import { ReactNode } from "react";
import { RoleGuard } from "@/app/providers";
import { PortalShell } from "@/components/navigation/PortalShell";

const navItems = [
  { label: "Dashboard", href: "/staff" },
  { label: "My Ticket", href: "/staff/tickets" },
  { label: "Scan Tickets", href: "/staff/scan" },
  { label: "Notifications", href: "/staff/notifications" }
];

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["STAFF"]}>
      <PortalShell title="Staff Gateway" navItems={navItems}>
        {children}
      </PortalShell>
    </RoleGuard>
  );
}
