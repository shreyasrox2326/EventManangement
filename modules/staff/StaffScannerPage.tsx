"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, CircleAlert, CircleCheck, QrCode, RotateCcw } from "lucide-react";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatDateTime } from "@/utils/format";
import { isEventStillLive } from "@/utils/ticketing";

type ScanState = {
  outcome: "VALID" | "DUPLICATE" | "CANCELLED" | "INVALID";
  statusLabel: string;
  message: string;
  ticket: Awaited<ReturnType<typeof emtsApi.getTicketById>>;
  details: {
    eventName: string;
    eventDate: string;
    categoryName: string;
    customerName: string;
    totalTickets: number;
    presentCount: number;
  } | null;
} | null;

const themeStyles = {
  VALID: {
    color: "var(--success)",
    background: "linear-gradient(180deg, rgba(15,118,110,0.14), rgba(15,118,110,0.04))",
    border: "rgba(15,118,110,0.36)"
  },
  DUPLICATE: {
    color: "var(--warning)",
    background: "linear-gradient(180deg, rgba(180,83,9,0.14), rgba(180,83,9,0.04))",
    border: "rgba(180,83,9,0.36)"
  },
  CANCELLED: {
    color: "var(--danger)",
    background: "linear-gradient(180deg, rgba(180,35,24,0.14), rgba(180,35,24,0.04))",
    border: "rgba(180,35,24,0.36)"
  },
  INVALID: {
    color: "var(--danger)",
    background: "linear-gradient(180deg, rgba(180,35,24,0.14), rgba(180,35,24,0.04))",
    border: "rgba(180,35,24,0.36)"
  }
} as const;

const prettyTicketStatus = (status?: string) => {
  switch (status) {
    case "USED":
      return "Present";
    case "CANCELLED":
      return "Cancelled";
    case "ACTIVE":
      return "Booked";
    default:
      return "Unavailable";
  }
};

const playScanBeep = () => {
  if (typeof window === "undefined") {
    return;
  }

  const audioContext = new window.AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.8;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
  oscillator.onended = () => {
    void audioContext.close();
  };
};

export function StaffScannerPage() {
  const { session } = useAuth();
  const staffUserId = session?.user.userId ?? "";
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [scanState, setScanState] = useState<ScanState>(null);
  const [autoMarkPresent, setAutoMarkPresent] = useState(true);
  const [cameraMessage, setCameraMessage] = useState("Open the camera and scan a ticket QR code.");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [ticketsRefreshKey, setTicketsRefreshKey] = useState(0);
  const [locallyUsedTicketIds, setLocallyUsedTicketIds] = useState<Set<string>>(() => new Set());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const isProcessingScanRef = useRef(false);

  useEffect(() => {
    readerRef.current = new BrowserQRCodeReader();

    return () => {
      scannerControlsRef.current?.stop();
      readerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setScanState(null);
    }
  }, [selectedEventId]);

  const { data: assignmentsData } = useAsyncResource(() => emtsApi.getStaffAssignmentsByUser(staffUserId), [staffUserId]);
  const { data: eventsData } = useAsyncResource(() => emtsApi.getEvents(), []);
  const { data: ticketsData } = useAsyncResource(() => emtsApi.getTickets(), [ticketsRefreshKey]);
  const assignments = assignmentsData ?? [];
  const events = eventsData ?? [];
  const tickets = ticketsData ?? [];
  const assignedEvents = events.filter(
    (event) => assignments.some((assignment) => assignment.eventId === event.eventId) && isEventStillLive(event)
  );
  const selectedEvent = assignedEvents.find((event) => event.eventId === selectedEventId) ?? assignedEvents[0] ?? null;
  const selectedEventTickets = selectedEvent ? tickets.filter((ticket) => ticket.eventId === selectedEvent.eventId) : [];
  const selectedEventPresentCount = selectedEventTickets.filter(
    (ticket) => ticket.ticketStatus === "USED" || locallyUsedTicketIds.has(ticket.ticketId)
  ).length;

  useEffect(() => {
    if (!selectedEventId && assignedEvents[0]) {
      setSelectedEventId(assignedEvents[0].eventId);
    }
  }, [assignedEvents, selectedEventId]);

  const handleDecodedValue = async (rawValue: string) => {
    try {
      const normalizedValue = rawValue.trim();
      const lastScan = lastScanRef.current;
      if (lastScan && lastScan.value === normalizedValue && Date.now() - lastScan.at < 2500) {
        return;
      }

      lastScanRef.current = { value: normalizedValue, at: Date.now() };
      playScanBeep();
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
      setIsScanning(false);
      setIsProcessingScan(true);
      isProcessingScanRef.current = true;

      const result = autoMarkPresent
        ? await emtsApi.scanAndMarkTicket(normalizedValue, selectedEvent?.eventId)
        : await emtsApi.validateTicket(normalizedValue, selectedEvent?.eventId);
      if (autoMarkPresent && result.outcome === "VALID" && result.ticket?.ticketId) {
        setLocallyUsedTicketIds((current) => new Set(current).add(result.ticket!.ticketId));
        setTicketsRefreshKey((current) => current + 1);
      }
      setScanState(result);
      setCameraMessage(result.message);
    } catch (error) {
      setScanState({
        outcome: "INVALID",
        statusLabel: "Scan failed",
        message: error instanceof Error ? error.message : "Unable to process the scanned ticket.",
        ticket: null,
        details: null
      });
      setCameraMessage("The scan could not be completed. Please try again.");
    } finally {
      setIsProcessingScan(false);
      isProcessingScanRef.current = false;
    }
  };

  const startScanning = async () => {
    if (!selectedEvent) {
      setCameraMessage("Select an assigned event before opening the scanner.");
      return;
    }

    try {
      if (!videoRef.current || !readerRef.current) {
        throw new Error("Scanner is not ready.");
      }

      setScanState(null);
      lastScanRef.current = null;
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result && !isProcessingScanRef.current) {
            void handleDecodedValue(result.getText());
          }
        }
      );
      setIsScanning(true);
      setCameraMessage("Camera is live. Hold the QR code steady inside the frame.");
    } catch (error) {
      setCameraMessage(error instanceof Error ? error.message : "Camera access was denied or the scanner could not start.");
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    setCameraMessage("Camera stopped. Start scanning again when you are ready.");
  };

  const resetResult = () => {
    setScanState(null);
    lastScanRef.current = null;
    setCameraMessage("Result cleared. Start camera scan when you are ready for the next ticket.");
  };

  const markPresentManually = async () => {
    if (!scanState?.ticket || scanState.outcome !== "VALID" || scanState.ticket.ticketStatus !== "ACTIVE") {
      return;
    }

    setIsProcessingScan(true);
    try {
      const updatedTicket = await emtsApi.markTicketPresent(scanState.ticket.ticketId);
      const updatedValidation = await emtsApi.validateTicket(JSON.stringify({
        ticketId: updatedTicket.ticketId,
        qrCode: updatedTicket.qrCodeValue
      }), selectedEvent?.eventId);
      setScanState({
        ...updatedValidation,
        ticket: updatedTicket,
        statusLabel: "Present",
        message: "Ticket validated and attendee marked present."
      });
      setLocallyUsedTicketIds((current) => new Set(current).add(updatedTicket.ticketId));
      setTicketsRefreshKey((current) => current + 1);
      setCameraMessage("Ticket validated and attendee marked present.");
    } catch (error) {
      setCameraMessage(error instanceof Error ? error.message : "Unable to mark the ticket present.");
    } finally {
      setIsProcessingScan(false);
    }
  };

  const activeTheme = themeStyles[scanState?.outcome ?? "INVALID"];
  const showResultPanel = Boolean(scanState) || isProcessingScan;
  const modeLabel = autoMarkPresent ? "Mark Present Automatically" : "Just Check Ticket";

  return (
    <div className="grid" style={{ maxWidth: 920, margin: "0 auto" }}>
      <Card style={{ padding: 20 }}>
        <div className="eyebrow">Staff Scanner</div>
        <h2 className="section-title">Scan and validate ticket entry</h2>
      </Card>

      <Card style={{ padding: 20 }}>
        <div className="details-list" style={{ marginBottom: 18 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span className="eyebrow">Assigned event</span>
            <select className="select" value={selectedEvent?.eventId ?? ""} onChange={(event) => setSelectedEventId(event.target.value)}>
              {assignedEvents.map((event) => (
                <option key={event.eventId} value={event.eventId}>
                  {event.title} ({event.eventId})
                </option>
              ))}
            </select>
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
              padding: "12px 0",
              borderBottom: "1px solid var(--line)"
            }}
          >
            <div>
              <div className="details-key">Total tickets</div>
              <div className="details-value" style={{ marginTop: 4 }}>
                {selectedEventTickets.length}
              </div>
            </div>
            <div>
              <div className="details-key">Marked present</div>
              <div className="details-value" style={{ marginTop: 4 }}>
                {selectedEventPresentCount}
              </div>
            </div>
          </div>
          <div className="details-row">
            <div className="details-key">Venue</div>
            <div className="details-value">{selectedEvent?.venueName ?? "Unavailable"}</div>
          </div>
          <div
            className="details-row"
            style={{
              alignItems: "center"
            }}
          >
            <div className="details-key">Auto mark present</div>
            <div className="details-value" style={{ display: "flex", justifyContent: "flex-start" }}>
              <button
                type="button"
                className="scanner-mode-toggle"
                aria-pressed={autoMarkPresent}
                onClick={() => setAutoMarkPresent((current) => !current)}
              >
                <span
                  className="scanner-mode-indicator"
                  style={{ background: autoMarkPresent ? "var(--success)" : "var(--danger)" }}
                />
                <span>{modeLabel}</span>
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
            border: `1px solid ${scanState ? activeTheme.border : "var(--line)"}`,
            background: scanState ? activeTheme.background : "linear-gradient(180deg, rgba(15,118,110,0.1), rgba(15,118,110,0.02))"
          }}
        >
          <div style={{ position: "relative", minHeight: 420, display: "grid", placeItems: "center" }}>
            <video
              ref={videoRef}
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%",
                minHeight: 420,
                objectFit: "cover",
                display: isScanning && !showResultPanel ? "block" : "none"
              }}
            />
            {!showResultPanel && !isScanning && (
              <div style={{ textAlign: "center", padding: 32 }}>
                <QrCode size={36} color="var(--accent-staff)" />
                <div style={{ marginTop: 14, fontWeight: 700 }}>Scanner standby</div>
                <div className="muted" style={{ marginTop: 8 }}>
                  {cameraMessage}
                </div>
              </div>
            )}
            {isScanning && !showResultPanel && (
              <div
                style={{
                  position: "absolute",
                  inset: 24,
                  borderRadius: 24,
                  border: "2px solid rgba(255,255,255,0.75)",
                  boxShadow: "inset 0 0 0 9999px rgba(0,0,0,0.18)",
                  pointerEvents: "none"
                }}
              />
            )}
            {showResultPanel && (
              <div style={{ width: "100%", padding: 24, display: "grid", gap: 14 }}>
                <div className="eyebrow">Scan Result</div>
                <h3 style={{ margin: "4px 0 0" }}>{isProcessingScan ? "Processing scan..." : "Ticket validation status"}</h3>
                {isProcessingScan ? (
                  <div className="muted">Checking ticket authenticity and entry status...</div>
                ) : scanState ? (
                  <>
                    <div
                      className="badge"
                      style={{
                        color: activeTheme.color,
                        width: "fit-content",
                        borderColor: activeTheme.border,
                        background: activeTheme.background
                      }}
                    >
                      {scanState.outcome === "VALID" ? <CircleCheck size={16} /> : <CircleAlert size={16} />}
                      {scanState.statusLabel}
                    </div>
                    <div className="muted">{scanState.message}</div>
                    <div className="details-list">
                      <div className="details-row">
                        <div className="details-key">Event</div>
                        <div className="details-value">{scanState.details?.eventName ?? "Unavailable"}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-key">Date</div>
                        <div className="details-value">{scanState.details ? formatDateTime(scanState.details.eventDate) : "Unavailable"}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-key">Customer</div>
                        <div className="details-value">{scanState.details?.customerName ?? "Unavailable"}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-key">Category</div>
                        <div className="details-value">{scanState.details?.categoryName ?? "Unavailable"}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-key">Ticket Status</div>
                        <div className="details-value">{prettyTicketStatus(scanState.ticket?.ticketStatus)}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-key">Ticket ID</div>
                        <div className="details-value mono">{scanState.ticket?.ticketId ?? "Unavailable"}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-key">Total Tickets</div>
                        <div className="details-value">{scanState.details?.totalTickets ?? 0}</div>
                      </div>
                      <div className="details-row">
                        <div className="details-key">Already Present</div>
                        <div className="details-value">{scanState.details?.presentCount ?? 0}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="muted">No ticket scanned yet.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          {!isScanning ? (
            <Button type="button" onClick={startScanning} disabled={!selectedEvent}>
              <Camera size={16} />
              Start camera scan
            </Button>
          ) : (
            <Button type="button" variant="secondary" onClick={stopScanning}>
              <CameraOff size={16} />
              Stop camera
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={resetResult}>
            <RotateCcw size={16} />
            Clear result
          </Button>
          {!autoMarkPresent && scanState?.outcome === "VALID" && scanState.ticket?.ticketStatus === "ACTIVE" && (
            <Button type="button" onClick={markPresentManually} disabled={isProcessingScan}>
              <CircleCheck size={16} />
              Mark present
            </Button>
          )}
        </div>

        <div className="muted" style={{ marginTop: 14 }}>
          {cameraMessage}
        </div>
      </Card>
    </div>
  );
}
