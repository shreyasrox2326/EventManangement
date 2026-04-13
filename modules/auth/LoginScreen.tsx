"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { authService } from "@/services/auth-service";
import { rolePaths } from "@/utils/constants";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await authService.login({ emailAddress, password });
      login(response);
      router.push(rolePaths[response.user.roleCode]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-grid page-reveal">
      <section
        style={{
          padding: "40px",
          background: "linear-gradient(140deg, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%), var(--bg)"
        }}
      >
        <Logo />
        <div style={{ maxWidth: 560, marginTop: 72, display: "grid", gap: 18 }}>
          <h1 style={{ fontSize: "clamp(2.8rem, 5vw, 5rem)", margin: 0, letterSpacing: "-0.08em", lineHeight: 0.96 }}>
            Sign in to continue.
          </h1>
        </div>
      </section>

      <section style={{ padding: "32px", display: "flex", alignItems: "center" }}>
        <div className="card panel" style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
          <h2 className="section-title" style={{ marginBottom: 6 }}>
            Login
          </h2>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, marginTop: 18 }}>
            <label>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Email Address
              </div>
              <input className="input" type="email" autoComplete="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} />
            </label>
            <label>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Password
              </div>
              <input className="input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {errorMessage && (
              <div className="badge" style={{ color: "var(--danger)" }}>
                <TriangleAlert size={16} />
                {errorMessage}
              </div>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
            <Link href="/auth/forgot-password" className="muted">
              Forgot password
            </Link>
            <Link href="/auth/customer/register" className="muted">
              Create account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
