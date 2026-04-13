import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function ForgotPasswordScreen() {
  return (
    <div className="auth-grid page-reveal">
      <section style={{ padding: 40 }}>
        <Logo />
        <div style={{ maxWidth: 540, marginTop: 88 }}>
          <div className="pill" style={{ width: "fit-content" }}>
            Account Recovery
          </div>
          <h1 style={{ fontSize: "clamp(2.6rem, 5vw, 4.8rem)", letterSpacing: "-0.08em", lineHeight: 0.96 }}>
            Request a secure password reset across all EMTS portals.
          </h1>
          <p className="muted">
            The mock flow reflects a future identity service endpoint and supports separate recovery by portal role.
          </p>
        </div>
      </section>
      <section style={{ padding: 32, display: "flex", alignItems: "center" }}>
        <div className="card panel" style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
          <h2 className="section-title">Reset access</h2>
          <div style={{ display: "grid", gap: 14 }}>
            <input className="input" placeholder="Registered email address" />
            <select className="select" defaultValue="CUSTOMER">
              <option value="CUSTOMER">Customer</option>
              <option value="ORGANIZER">Organizer</option>
              <option value="STAFF">Venue Staff</option>
              <option value="ADMIN">Admin</option>
              <option value="CORPORATE_CLIENT">Corporate Client</option>
            </select>
            <Button>Send reset link</Button>
            <div className="badge">
              The demo does not send email. This screen exists to complete the frontend auth flow.
            </div>
            <Link href="/auth/select-role" className="muted">
              Return to role selector
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
