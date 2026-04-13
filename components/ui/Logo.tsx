import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="logo-intro" style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <span className="eyebrow" style={{ letterSpacing: "0.2em" }}>
        Event Management and Ticketing System
      </span>
      <strong className="logo-wordmark" style={{ fontSize: compact ? "2rem" : undefined }}>
        EMTS
      </strong>
    </Link>
  );
}
