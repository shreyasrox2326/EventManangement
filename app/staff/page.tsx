"use client";

import Link from "next/link";
import { Camera, Ticket } from "lucide-react";
import { useAuth } from "@/app/providers";
import { Card } from "@/components/ui/Card";
import { useAsyncResource } from "@/services/use-async-resource";
import { emtsApi } from "@/services/live-api";

export default function StaffPage() {
  const { session } = useAuth();
  const staffUserId = session?.user.userId ?? "";
  const { data: assignmentsData } = useAsyncResource(() => emtsApi.getStaffAssignmentsByUser(staffUserId), [staffUserId]);
  const { data: eventsData } = useAsyncResource(() => emtsApi.getEvents(), []);
  const assignments = assignmentsData ?? [];
  const events = eventsData ?? [];
  const assignedEvents = events.filter((event) => assignments.some((assignment) => assignment.eventId === event.eventId));

  return (
    <div className="grid">
      <Card style={{ padding: 24 }}>
        <div className="eyebrow">Staff Dashboard</div>
        <h2 className="section-title">Entry validation console</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Select one of your assigned events, open the scanner, and validate tickets against that event.
        </p>
        <div className="metrics-grid" style={{ marginTop: 18 }}>
          <div className="card" style={{ padding: 18, borderRadius: 18 }}>
            <div className="eyebrow">Assigned Events</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: 10 }}>{assignedEvents.length}</div>
          </div>
          <div className="card" style={{ padding: 18, borderRadius: 18 }}>
            <div className="eyebrow">Notifications</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: 10 }}>Live</div>
          </div>
        </div>
        <div className="grid" style={{ gap: 12, marginTop: 20 }}>
          {assignedEvents.map((event) => (
            <div key={event.eventId} className="pill" style={{ justifyContent: "space-between" }}>
              <span>{event.title}</span>
              <strong>{event.venueName}</strong>
            </div>
          ))}
          {assignedEvents.length === 0 && <div className="muted">No staff event assignments were found for this account yet.</div>}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <Link href="/staff/scan" className="button button-primary">
            <Camera size={16} />
            Open scanner
          </Link>
          <div className="button button-secondary" aria-disabled="true">
            <Ticket size={16} />
            Live ticket verification
          </div>
        </div>
      </Card>
    </div>
  );
}
