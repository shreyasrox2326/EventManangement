import { UserRole } from "@/types/contracts";

export const authPortalConfig: Record<
  UserRole,
  {
    title: string;
    subtitle: string;
    accent: string;
    portalDescription: string;
  }
> = {
  CUSTOMER: {
    title: "Customer Access",
    subtitle: "Browse events, book tickets, manage cancellations, and track QR passes.",
    accent: "var(--accent-customer)",
    portalDescription: "Discovery-led journey for attendees with ticketing, payments, refunds, and notifications."
  },
  ORGANIZER: {
    title: "Organizer Console",
    subtitle: "Create events, publish inventory, control refunds, and monitor live commercial performance.",
    accent: "var(--accent-organizer)",
    portalDescription: "Operations-oriented workspace for event creation, allocations, reports, and revenue management."
  },
  STAFF: {
    title: "Venue Staff Access",
    subtitle: "Validate entries on mobile, resolve scan exceptions, and track attendance in real time.",
    accent: "var(--accent-staff)",
    portalDescription: "Fast, mobile-first gate control for QR scanning, manual validation, and attendance marking."
  },
  ADMIN: {
    title: "Admin Control Panel",
    subtitle: "Supervise users, system policies, audit trails, platform health, and security operations.",
    accent: "var(--accent-admin)",
    portalDescription: "Central governance layer for user access, configurations, logs, and platform reporting."
  },
  CORPORATE_CLIENT: {
    title: "Corporate Booking Desk",
    subtitle: "Request bulk allocations, review organizer offers, complete payment, and distribute employee tickets.",
    accent: "var(--accent-corporate)",
    portalDescription: "Procurement-style workflow for bulk event access, organizer offers, and ticket receipt."
  }
};
