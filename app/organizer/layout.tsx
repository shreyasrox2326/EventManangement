"use client";

import { ReactNode } from "react";
import { RoleGuard } from "@/app/providers";
import { OrganizerProfileGate } from "@/components/auth/ProfileGate";
import { PortalShell } from "@/components/navigation/PortalShell";

const navItems = [
  { label: "Dashboard", href: "/organizer" },
  { label: "Events", href: "/organizer/events" },
  { label: "My Tickets", href: "/organizer/tickets" },
  { label: "Reports", href: "/organizer/reports" },
  { label: "Notifications", href: "/organizer/notifications" }
];

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={["ORGANIZER"]}>
      <PortalShell title="Organizer Console" navItems={navItems}>
        <OrganizerProfileGate>{children}</OrganizerProfileGate>
      </PortalShell>
    </RoleGuard>
  );
}
