"use client";

import { ReactNode } from "react";
import { RoleGuard } from "@/app/providers";
import { PortalShell } from "@/components/navigation/PortalShell";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Manage Users", href: "/admin/users" },
  { label: "Notifications", href: "/admin/notifications" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <PortalShell title="Admin Control Panel" navItems={navItems}>
        {children}
      </PortalShell>
    </RoleGuard>
  );
}
