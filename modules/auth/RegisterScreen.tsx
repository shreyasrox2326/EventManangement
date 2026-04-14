"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export function RegisterScreen() {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSubmitted(false);
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const password = String(formData.get("password"));
      const confirmPassword = String(formData.get("confirmPassword"));
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const email = String(formData.get("emailAddress"));
      const challenge = await authService.registerCustomer({
        fullName: String(formData.get("fullName")),
        emailAddress: email,
        phoneNumber: String(formData.get("phoneNumber")),
        password
      });
      setChallengeId(challenge.challengeId);
      setEmailAddress(email);
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await authService.verifyCustomerRegistration({ challengeId, otpCode });
      router.push("/auth/customer/login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to verify OTP.");
    } finally {
      setIsSubmitting(false);
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
          {!challengeId ? (
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
              <input className="input" name="fullName" placeholder="Full name" required />
              <input className="input" name="emailAddress" placeholder="Email address" type="email" required />
              <input className="input" name="phoneNumber" placeholder="Phone number" required />
              <input className="input" name="password" placeholder="Password" type="password" required />
              <input className="input" name="confirmPassword" placeholder="Confirm password" type="password" required />
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending OTP..." : "Create account"}</Button>
            </form>
          ) : (
            <form onSubmit={onVerify} style={{ display: "grid", gap: 14 }}>
              <div className="muted">We sent a verification OTP to {emailAddress}.</div>
              <input
                className="input mono"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
                inputMode="numeric"
                placeholder="Enter OTP"
                required
              />
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Verifying..." : "Verify email"}</Button>
            </form>
          )}
          {submitted && (
            <div className="badge" style={{ marginTop: 16, color: "var(--success)" }}>
              OTP sent successfully. Complete verification to activate this account.
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
