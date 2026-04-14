import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { authService } from "@/services/auth-service";

export function ForgotPasswordScreen() {
  const [emailAddress, setEmailAddress] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const challenge = await authService.startPasswordReset(emailAddress);
      setChallengeId(challenge.challengeId);
      setMessage("Password reset OTP sent to your email.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send reset OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      await authService.completePasswordReset({ challengeId, otpCode, newPassword });
      setMessage("Password updated successfully. You can sign in now.");
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-grid page-reveal">
      <section style={{ padding: 40 }}>
        <Logo />
        <div style={{ maxWidth: 540, marginTop: 88 }}>
          <h1 style={{ fontSize: "clamp(2.6rem, 5vw, 4.8rem)", letterSpacing: "-0.08em", lineHeight: 0.96 }}>
            Reset your password.
          </h1>
        </div>
      </section>
      <section style={{ padding: 32, display: "flex", alignItems: "center" }}>
        <div className="card panel" style={{ width: "100%", maxWidth: 520, margin: "0 auto" }}>
          <h2 className="section-title">Forgot password</h2>
          {!challengeId ? (
            <form onSubmit={startReset} style={{ display: "grid", gap: 14 }}>
              <input className="input" type="email" value={emailAddress} onChange={(event) => setEmailAddress(event.target.value)} placeholder="Registered email address" required />
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending OTP..." : "Send reset OTP"}</Button>
            </form>
          ) : (
            <form onSubmit={completeReset} style={{ display: "grid", gap: 14 }}>
              <div className="muted">Enter the OTP sent to {emailAddress} and choose a new password.</div>
              <input className="input mono" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="OTP" inputMode="numeric" required />
              <input className="input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="New password" required />
              <input className="input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" required />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Resetting..." : "Reset password"}</Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => {
                    setChallengeId("");
                    setOtpCode("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setMessage("");
                  }}
                >
                  Back
                </Button>
              </div>
            </form>
          )}
          {message && <div className="badge" style={{ marginTop: 16 }}>{message}</div>}
          <div style={{ marginTop: 18 }}>
            <Link href="/auth/login" className="muted">
              Back to login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
