"use client";

import { FormEvent, ReactNode, useState } from "react";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";

export function OrganizerProfileGate({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.userId ?? "";
  const [refreshKey, setRefreshKey] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: profile, isLoading } = useAsyncResource(() => emtsApi.getOrganizerProfile(userId), [userId, refreshKey]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await emtsApi.upsertOrganizerProfile(userId, orgName);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save organizer profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <>{children}</>;
  }

  if (profile) {
    return <>{children}</>;
  }

  return (
    <div className="grid">
      <Card style={{ padding: 24, maxWidth: 620 }}>
        <div className="eyebrow">Organizer Sign-On</div>
        <h2 className="section-title">Complete your organizer profile</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Your organizer record must exist before you can create events or access organizer tools.
        </p>
        <form onSubmit={handleSubmit} className="grid" style={{ gap: 14 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Organization name</span>
            <input className="input" value={orgName} onChange={(nextEvent) => setOrgName(nextEvent.target.value)} />
          </label>
          {message && <div className="badge">{message}</div>}
          <Button type="submit" disabled={isSubmitting || !orgName.trim()}>
            {isSubmitting ? "Saving..." : "Save organizer profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export function CorporateProfileGate({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.userId ?? "";
  const [refreshKey, setRefreshKey] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: profile, isLoading } = useAsyncResource(() => emtsApi.getCorporateProfile(userId), [userId, refreshKey]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      await emtsApi.upsertCorporateProfile(userId, companyName, gstNumber);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save corporate profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <>{children}</>;
  }

  if (profile) {
    return <>{children}</>;
  }

  return (
    <div className="grid">
      <Card style={{ padding: 24, maxWidth: 620 }}>
        <div className="eyebrow">Corporate Sign-On</div>
        <h2 className="section-title">Complete your corporate profile</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Your company record must exist before you can submit or manage corporate booking requests.
        </p>
        <form onSubmit={handleSubmit} className="grid" style={{ gap: 14 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Company name</span>
            <input className="input" value={companyName} onChange={(nextEvent) => setCompanyName(nextEvent.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">GST number</span>
            <input className="input" value={gstNumber} onChange={(nextEvent) => setGstNumber(nextEvent.target.value)} />
          </label>
          {message && <div className="badge">{message}</div>}
          <Button type="submit" disabled={isSubmitting || !companyName.trim() || !gstNumber.trim()}>
            {isSubmitting ? "Saving..." : "Save corporate profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
