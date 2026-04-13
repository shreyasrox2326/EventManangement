import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/navigation/PublicHeader";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <>
      <PublicHeader />
      <main className="container page-reveal" style={{ paddingBottom: 48 }}>
        <section className="hero-grid" style={{ minHeight: "calc(100vh - 140px)", alignItems: "center" }}>
          <Card style={{ padding: 32 }}>
            <h1 style={{ fontSize: "clamp(3rem, 6vw, 6.2rem)", letterSpacing: "-0.09em", lineHeight: 0.92, marginBottom: 18 }}>
              Event management, ticketing, and entry control in one place.
            </h1>
            <p className="muted" style={{ fontSize: "1.08rem", maxWidth: 680, margin: 0 }}>
              Sign in to continue.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
              <Link href="/auth/login" className="button button-primary">
                Login
                <ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        </section>
      </main>
    </>
  );
}
