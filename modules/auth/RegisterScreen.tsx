"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authService } from "@/services/auth-service";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function RegisterScreen() {
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitted(false);
    setErrorMessage("");

    try {
      await authService.registerCustomer({
        fullName: String(formData.get("fullName")),
        emailAddress: String(formData.get("emailAddress")),
        phoneNumber: String(formData.get("phoneNumber")),
        password: String(formData.get("password"))
      });
      setSubmitted(true);
      event.currentTarget.reset();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create account.");
    }
  };

  return (
    <div className="auth-grid page-reveal">
      <section style={{ padding: 40 }}>
        <Logo />
        <div style={{ maxWidth: 560, marginTop: 88 }}>
          <h1 style={{ fontSize: "clamp(2.8rem, 5vw, 5rem)", letterSpacing: "-0.08em", lineHeight: 0.95 }}>
            Create your account.
          </h1>
        </div>
      </section>
      <section style={{ padding: 32, display: "flex", alignItems: "center" }}>
        <div className="card panel" style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
          <h2 className="section-title">Create account</h2>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <input className="input" name="fullName" placeholder="Full name" required />
            <input className="input" name="emailAddress" placeholder="Email address" type="email" required />
            <input className="input" name="phoneNumber" placeholder="Phone number" required />
            <input className="input" name="password" placeholder="Password" type="password" required />
            <Button type="submit">Create account</Button>
          </form>
          {submitted && (
            <div className="badge" style={{ marginTop: 16, color: "var(--success)" }}>
              Account created successfully. You can proceed to the customer login portal.
            </div>
          )}
          {errorMessage && (
            <div className="badge" style={{ marginTop: 16 }}>
              {errorMessage}
            </div>
          )}
          <div style={{ marginTop: 18 }}>
            <Link href="/auth/customer/login" className="muted">
              Already have an account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
