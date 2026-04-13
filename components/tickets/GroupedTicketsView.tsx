"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QrCodeCard } from "@/components/ui/QrCodeCard";
import { Ticket } from "@/types/contracts";
import { formatDateTime } from "@/utils/format";
import { buildTicketQrPayload, downloadTicketsByEventZip } from "@/utils/ticketing";

export interface TicketGroup {
  eventId: string;
  eventName: string;
  eventDate?: string;
  tickets: Ticket[];
}

const statusDot = (ticketStatus: Ticket["ticketStatus"]) =>
  ticketStatus === "ACTIVE"
    ? "var(--success)"
    : ticketStatus === "USED"
      ? "var(--danger)"
      : "var(--text-soft)";

const statusLabel = (ticketStatus: Ticket["ticketStatus"]) =>
  ticketStatus === "ACTIVE"
    ? "Unused"
    : ticketStatus === "USED"
      ? "Used"
      : ticketStatus === "CANCELLED"
        ? "Cancelled"
        : "Invalid";

export function GroupedTicketsView({
  title,
  eyebrow,
  groups
}: {
  title: string;
  eyebrow: string;
  groups: TicketGroup[];
}) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showQrGroups, setShowQrGroups] = useState<Record<string, boolean>>({});
  const allExpanded = useMemo(() => groups.every((group) => expandedGroups[group.eventId]), [expandedGroups, groups]);
  const allShowingQrs = useMemo(() => groups.every((group) => showQrGroups[group.eventId]), [groups, showQrGroups]);

  const setAllExpanded = (value: boolean) => {
    setExpandedGroups(Object.fromEntries(groups.map((group) => [group.eventId, value])));
  };

  const setAllQrs = (value: boolean) => {
    setShowQrGroups(Object.fromEntries(groups.map((group) => [group.eventId, value])));
  };

  const downloadAll = async () => {
    await downloadTicketsByEventZip(
      groups.map((group) => ({
        eventName: group.eventName,
        tickets: group.tickets
      }))
    );
  };

  return (
    <Card>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="section-title">{title}</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Button type="button" variant="secondary" onClick={() => setAllExpanded(!allExpanded)}>
          {allExpanded ? "Collapse all groups" : "Expand all groups"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setAllQrs(!allShowingQrs)}>
          {allShowingQrs ? "Hide QR for all groups" : "Show QR for all groups"}
        </Button>
        <Button type="button" variant="secondary" onClick={downloadAll} disabled={groups.length === 0}>
          Download tickets for all events
        </Button>
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--success)", display: "inline-block" }} />
          <span className="muted">Unused</span>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--danger)", display: "inline-block" }} />
          <span className="muted">Used</span>
        </div>
      </div>
      <div className="grid" style={{ gap: 16 }}>
        {groups.map((group) => {
          const isExpanded = expandedGroups[group.eventId] ?? false;
          const isShowingQrs = showQrGroups[group.eventId] ?? false;
          const usedCount = group.tickets.filter((ticket) => ticket.ticketStatus === "USED").length;
          return (
            <div key={group.eventId} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <strong>{group.eventName}</strong>
                  <div className="muted" style={{ marginTop: 6 }}>
                    {group.eventDate ? formatDateTime(group.eventDate) : "Unknown event date"} · {group.tickets.length} ticket(s) · {usedCount} used
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Button type="button" variant="secondary" onClick={() => setExpandedGroups((current) => ({ ...current, [group.eventId]: !isExpanded }))}>
                    {isExpanded ? "Collapse group" : "Expand group"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowQrGroups((current) => ({ ...current, [group.eventId]: !isShowingQrs }))}>
                    {isShowingQrs ? "Hide QR" : "Show QR"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => downloadTicketsByEventZip([{ eventName: group.eventName, tickets: group.tickets }])}>
                    Download tickets
                  </Button>
                </div>
              </div>

              {isExpanded && (
                <table className="table" style={{ marginTop: 16 }}>
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Booking ID</th>
                      <th>Category</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.tickets.map((ticket) => (
                      <tr key={ticket.ticketId}>
                        <td className="mono">{ticket.ticketId}</td>
                        <td className="mono">{ticket.bookingId}</td>
                        <td>{ticket.seatLabel}</td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: statusDot(ticket.ticketStatus), display: "inline-block" }} />
                            <span>{statusLabel(ticket.ticketStatus)}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {isShowingQrs && (
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginTop: 16 }}>
                  {group.tickets.map((ticket) => (
                    <QrCodeCard
                      key={ticket.ticketId}
                      value={buildTicketQrPayload(ticket)}
                      label={[ticket.seatLabel, ticket.ticketId].join(" · ")}
                      prefix={<span style={{ width: 10, height: 10, borderRadius: "50%", background: statusDot(ticket.ticketStatus), display: "inline-block" }} />}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {groups.length === 0 && <div className="muted" style={{ marginTop: 12 }}>No tickets available.</div>}
    </Card>
  );
}
