"use client";

import { ReactNode } from "react";
import { RoleGuard } from "@/app/providers";
import { PortalShell } from "@/components/navigation/PortalShell";

const customerNav = [
  { label: "Dashboard", href: "/customer" },
  { label: "Browse Events", href: "/customer/events" },
  { label: "Active Tickets", href: "/customer/tickets" },
  { label: "Purchase History", href: "/customer/history" },
  { label: "Notifications", href: "/customer/notifications" }
];

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["CUSTOMER"]}>
      <PortalShell title="Customer Portal" navItems={customerNav}>
        {children}
      </PortalShell>
    </RoleGuard>
  );
}
