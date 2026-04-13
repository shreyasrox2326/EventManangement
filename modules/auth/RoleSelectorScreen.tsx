import Link from "next/link";
import { ArrowRight, Building2, Shield, TicketCheck, UserCircle2, Users } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { PublicHeader } from "@/components/navigation/PublicHeader";

const roles = [
  {
    label: "Customer",
    href: "/auth/customer/login",
    description: "Explore published events, purchase seats, manage refunds and view ticket history.",
    icon: UserCircle2,
    accent: "var(--accent-customer)"
  },
  {
    label: "Organizer",
    href: "/auth/organizer/login",
    description: "Create and publish events, manage ticket categories, allocations, and performance reporting.",
    icon: TicketCheck,
    accent: "var(--accent-organizer)"
  },
  {
    label: "Venue Staff",
    href: "/auth/staff/login",
    description: "Validate entry using QR scans, handle manual checks, and update attendance instantly.",
    icon: Users,
    accent: "var(--accent-staff)"
  },
  {
    label: "Admin",
    href: "/auth/admin/login",
    description: "Supervise platform users, system settings, refund defaults, security, and audit logs.",
    icon: Shield,
    accent: "var(--accent-admin)"
  },
  {
    label: "Corporate Client",
    href: "/auth/corporate/login",
    description: "Request bulk booking blocks, review organizer offers, and receive employee tickets.",
    icon: Building2,
    accent: "var(--accent-corporate)"
  }
];

export function RoleSelectorScreen() {
  return (
    <>
      <PublicHeader />
      <main className="container page-reveal" style={{ paddingBottom: 40 }}>
        <section className="hero-grid">
          <div className="card panel" style={{ padding: 32 }}>
            <div className="pill" style={{ width: "fit-content" }}>
              Multi-role access control
            </div>
            <div style={{ marginTop: 22 }}>
              <Logo />
              <h1 style={{ fontSize: "clamp(2.8rem, 5vw, 5rem)", letterSpacing: "-0.08em", lineHeight: 0.95, marginBottom: 16 }}>
                Choose the portal matching your operational role.
              </h1>
              <p className="muted" style={{ fontSize: "1.08rem", maxWidth: 620 }}>
                EMTS separates customer commerce, event operations, gate validation, corporate procurement, and system governance
                into distinct secured frontends.
              </p>
            </div>
          </div>
          <div className="card panel" style={{ padding: 32 }}>
            <div className="eyebrow">Scope aligned to system areas</div>
            <h2 className="section-title">Ticketing, refunds, attendance, reporting, notifications</h2>
            <div className="grid" style={{ marginTop: 18 }}>
              {[
                "Event creation and management",
                "Ticketing and QR issuance",
                "Refund and cancellation rules",
                "Entry validation and scan logs",
                "Bulk booking and corporate offers",
                "Admin audit and system reporting"
              ].map((item) => (
                <div key={item} className="pill">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 26 }} className="event-grid">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link key={role.label} href={role.href} className="card panel" style={{ display: "grid", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    display: "grid",
                    placeItems: "center",
                    background: `color-mix(in srgb, ${role.accent} 16%, transparent)`,
                    color: role.accent
                  }}
                >
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px" }}>{role.label}</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    {role.description}
                  </p>
                </div>
                <div className="pill" style={{ width: "fit-content", color: role.accent }}>
                  Enter portal
                  <ArrowRight size={16} />
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </>
  );
}
