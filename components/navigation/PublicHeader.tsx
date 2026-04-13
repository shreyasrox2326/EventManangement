import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";

export function PublicHeader() {
  return (
    <header className="container" style={{ padding: "20px 0" }}>
      <div
        className="card panel"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, padding: 18 }}
      >
        <Logo compact />
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <ThemeToggle />
          <Link href="/auth/login" className="button button-primary">
            Enter Portal
          </Link>
        </div>
      </div>
    </header>
  );
}
