import { Event, Ticket, TicketCategory } from "@/types/contracts";
import { getDateTimeMillis } from "@/utils/date-time";
import QRCode from "qrcode";

export const INTERNAL_USAGE_PREFIX = "internal usage -";

export const isInternalUseCategoryName = (value?: string | null) =>
  (value ?? "").trim().toLowerCase().startsWith(INTERNAL_USAGE_PREFIX);

export const isInternalUseCategory = (category: Pick<TicketCategory, "displayName" | "categoryCode">) =>
  isInternalUseCategoryName(category.displayName) || isInternalUseCategoryName(category.categoryCode);

export const getSellableCategories = (event: Event) => event.ticketCategories.filter((category) => !isInternalUseCategory(category));

export const isEventStillLive = (event: Pick<Event, "endDateTime"> & Partial<Pick<Event, "status">>) => {
  const normalizedStatus = event.status?.trim().toLowerCase();
  if (normalizedStatus === "deleted" || normalizedStatus === "cancelled") {
    return false;
  }

  const endMillis = getDateTimeMillis(event.endDateTime);
  return Number.isFinite(endMillis) ? endMillis > Date.now() : true;
};

export const getLowestAvailablePrice = (event: Event) => {
  const prices = getSellableCategories(event)
    .filter((category) => category.availableQuantity > 0)
    .map((category) => category.unitPrice);

  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices);
};

export const getEventSalesStatus = (event: Event) => {
  const now = Date.now();
  const sellableCategories = getSellableCategories(event);
  const saleStartTimes = sellableCategories
    .map((category) => category.saleStartDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => getDateTimeMillis(value))
    .filter((value) => Number.isFinite(value));
  const earliestSaleStart = saleStartTimes.length > 0 ? Math.min(...saleStartTimes) : Number.NEGATIVE_INFINITY;
  const totalAvailable = sellableCategories.reduce((sum, category) => sum + category.availableQuantity, 0);
  const eventEnded = !isEventStillLive(event);
  const saleNotStarted = earliestSaleStart > now;
  const soldOut = sellableCategories.length === 0 || totalAvailable <= 0;

  return {
    earliestSaleStart: Number.isFinite(earliestSaleStart) ? new Date(earliestSaleStart).toISOString() : null,
    saleNotStarted,
    soldOut,
    eventEnded,
    canBook: !saleNotStarted && !soldOut && !eventEnded
  };
};

export const buildTicketQrPayload = (ticket: Pick<Ticket, "ticketId" | "qrCodeValue">) =>
  JSON.stringify({
    ticketId: ticket.ticketId,
    qrCode: ticket.qrCodeValue
  });

const sanitizeFilenamePart = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "Ticket";

const dataUrlToBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export const downloadTicketQrZip = async (
  tickets: Array<Pick<Ticket, "ticketId" | "bookingId" | "seatLabel" | "qrCodeValue">>
) => {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  await addTicketsToZipFolder(zip, "", tickets);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `booking_qrs_${tickets[0]?.bookingId ?? "tickets"}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const addTicketsToZipFolder = async (
  zip: { folder: (name: string) => any; file: (name: string, data: Uint8Array) => void },
  folderName: string,
  tickets: Array<Pick<Ticket, "ticketId" | "bookingId" | "seatLabel" | "qrCodeValue">>
) => {
  const target = folderName ? zip.folder(sanitizeFilenamePart(folderName)) : zip;
  const categoryCounts = tickets.reduce<Record<string, number>>((accumulator, ticket) => {
    const key = ticket.seatLabel;
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  const widestCount = Math.max(...Object.values(categoryCounts), 1);
  const serialWidth = `${widestCount}`.length;
  const serialsByCategory: Record<string, number> = {};

  for (const ticket of tickets) {
    const categoryKey = ticket.seatLabel;
    serialsByCategory[categoryKey] = (serialsByCategory[categoryKey] ?? 0) + 1;
    const serial = `${serialsByCategory[categoryKey]}`.padStart(serialWidth, "0");
    const filename = `${sanitizeFilenamePart(ticket.seatLabel)}_${serial}_${ticket.ticketId}_${ticket.bookingId}.png`;
    const dataUrl = await QRCode.toDataURL(buildTicketQrPayload(ticket), { margin: 1, width: 512 });
    target.file(filename, dataUrlToBytes(dataUrl));
  }
};

export const downloadTicketsByEventZip = async (
  groups: Array<{
    eventName: string;
    tickets: Array<Pick<Ticket, "ticketId" | "bookingId" | "seatLabel" | "qrCodeValue">>;
  }>
) => {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const group of groups) {
    await addTicketsToZipFolder(zip, group.eventName, group.tickets);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "event_ticket_qrs.zip";
  anchor.click();
  URL.revokeObjectURL(url);
};
