import { UserRole } from "@/types/contracts";

export const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  ORGANIZER: "Organizer",
  STAFF: "Venue Staff",
  ADMIN: "Admin",
  CORPORATE_CLIENT: "Corporate Client"
};

export const rolePaths: Record<UserRole, string> = {
  CUSTOMER: "/customer",
  ORGANIZER: "/organizer",
  STAFF: "/staff",
  ADMIN: "/admin",
  CORPORATE_CLIENT: "/corporate"
};

export const roleAccentMap: Record<UserRole, string> = {
  CUSTOMER: "var(--accent-customer)",
  ORGANIZER: "var(--accent-organizer)",
  STAFF: "var(--accent-staff)",
  ADMIN: "var(--accent-admin)",
  CORPORATE_CLIENT: "var(--accent-corporate)"
};
