export { emtsApi } from "@/services/live-api";
/*
import { mockDb } from "@/services/mock-db";
import {
  Booking,
  BulkBookingRequestDto,
  CheckoutRequestDto,
  EntryScanLog,
  Event,
  Expense,
  Notification,
  Payment,
  Refund,
  RefundPolicy,
  Ticket,
  TicketCategory,
  TicketStatus,
  User,
  UserRole
} from "@/types/contracts";

const API_BASE_PATH = "/api/emts";

interface BackendEvent {
  capacity?: number;
  endTime?: string;
  eventId: string;
  name?: string;
  organizerId?: string;
  startTime?: string;
  status?: string;
  type?: string;
  venue?: string;
}

interface BackendTicketCategory {
  availableQty?: number;
  categoryId: string;
  eventId: string;
  name?: string;
  price?: number;
  saleStartDate?: string;
  totalQty?: number;
}

interface BackendUser {
  email?: string;
  name?: string;
  password_hash?: string;
  phone?: string;
  type?: string;
  user_id: string;
}

interface BackendBooking {
  bookingId: string;
  bookingTimestamp?: string;
  eventId: string;
  paymentStatus?: string;
  quantity?: number;
  totalCost?: number;
  userId: string;
}

interface BackendTicket {
  bookingId: string;
  categoryId: string;
  qrCode?: string;
  status?: string;
  ticketId: string;
}

const normalizeEventStatus = (value?: string) => (value ?? "draft").trim().toUpperCase();
const normalizeEventType = (value?: string) => (value ?? "other").trim().toUpperCase();

function normalizeUserRole(value?: string): UserRole {
  const normalized = (value ?? "").trim().toLowerCase();

  switch (normalized) {
    case "customer":
      return "CUSTOMER";
    case "organizer":
      return "ORGANIZER";
    case "staff":
      return "STAFF";
    case "admin":
      return "ADMIN";
    case "corporate":
      return "CORPORATE_CLIENT";
    default:
      return "CUSTOMER";
  }
}

function normalizeTicketStatus(value?: string): TicketStatus {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized === "cancelled") {
    return "CANCELLED";
  }

  if (normalized === "used") {
    return "USED";
  }

  if (normalized === "invalid") {
    return "INVALID";
  }

  return "ACTIVE";
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getEventBanner(eventType: string) {
  const normalized = eventType.toLowerCase();

  if (normalized.includes("concert")) {
    return "/assets/event-concert.svg";
  }

  if (normalized.includes("workshop")) {
    return "/assets/event-workshop.svg";
  }

  return "/assets/event-conference.svg";
}

function mapTicketCategory(category: BackendTicketCategory): TicketCategory {
  const displayName = category.name?.trim() || "General Admission";
  const normalizedCode = displayName.toUpperCase().replace(/[^A-Z]+/g, "_") || "REGULAR";
  const capacity = category.totalQty ?? category.availableQty ?? 0;
  const availableQuantity = category.availableQty ?? capacity;

  return {
    ticketCategoryId: category.categoryId,
    eventId: category.eventId,
    categoryCode: normalizedCode,
    displayName,
    unitPrice: Number(category.price ?? 0),
    currencyCode: "INR",
    capacity,
    availableQuantity,
    description: `${displayName} access`
  };
}

function mapEvent(event: BackendEvent, categories: TicketCategory[]): Event {
  const title = event.name?.trim() || "Untitled event";
  const seatCapacity = event.capacity ?? categories.reduce((sum, category) => sum + category.capacity, 0);
  const remaining = categories.reduce((sum, category) => sum + category.availableQuantity, 0);
  const sold = Math.max(seatCapacity - remaining, 0);
  const occupancyPercentage = seatCapacity > 0 ? Math.round((sold / seatCapacity) * 100) : 0;
  const eventType = normalizeEventType(event.type);

  return {
    eventId: event.eventId,
    organizerId: event.organizerId ?? "",
    title,
    slug: toSlug(title),
    subtitle: `${title} at ${event.venue ?? "the venue"}`,
    description: `${title} is now loading from the live backend API.`,
    eventType,
    status: normalizeEventStatus(event.status),
    startDateTime: event.startTime ?? new Date().toISOString(),
    endDateTime: event.endTime ?? event.startTime ?? new Date().toISOString(),
    venueName: event.venue ?? "Venue TBA",
    cityName: event.venue ?? "TBA",
    stateName: "TBA",
    bannerImageUrl: getEventBanner(eventType),
    coverTone: eventType.toLowerCase(),
    seatCapacity,
    publishedAt: normalizeEventStatus(event.status) === "PUBLISHED" ? event.startTime : undefined,
    refundPolicyId: "rpl-default-live",
    liveAttendanceCount: 0,
    noShowPercentage: 0,
    occupancyPercentage,
    ticketCategories: categories,
    tags: [eventType, event.venue ?? "Live"]
  };
}

function mapUser(user: BackendUser): User {
  return {
    userId: user.user_id,
    fullName: user.name ?? "Unnamed user",
    emailAddress: user.email ?? "",
    phoneNumber: user.phone ?? "",
    roleCode: normalizeUserRole(user.type),
    companyName: undefined,
    isTwoFactorEnabled: false,
    avatarUrl: undefined,
    lastLoginAt: new Date().toISOString(),
    accountStatus: "ACTIVE"
  };
}

function mapBooking(booking: BackendBooking, ticketIds: string[]): Booking {
  const totalAmount = Number(booking.totalCost ?? 0);
  const normalizedPaymentStatus = (booking.paymentStatus ?? "pending").toLowerCase();
  const bookingStatus = normalizedPaymentStatus === "success" ? "CONFIRMED" : "PENDING";

  return {
    bookingId: booking.bookingId,
    customerId: booking.userId,
    eventId: booking.eventId,
    bookingStatus,
    bookingChannel: "WEB",
    quantity: booking.quantity ?? ticketIds.length,
    subtotalAmount: totalAmount,
    gstAmount: 0,
    totalAmount,
    createdAt: booking.bookingTimestamp ?? new Date().toISOString(),
    ticketIds,
    paymentId: `payment-${booking.bookingId}`
  };
}

function mapTicket(ticket: BackendTicket, bookings: BackendBooking[], categories: BackendTicketCategory[]): Ticket {
  const booking = bookings.find((entry) => entry.bookingId === ticket.bookingId);
  const category = categories.find((entry) => entry.categoryId === ticket.categoryId);
  const ticketStatus = normalizeTicketStatus(ticket.status);

  return {
    ticketId: ticket.ticketId,
    bookingId: ticket.bookingId,
    eventId: category?.eventId ?? booking?.eventId ?? "",
    ticketCategoryId: ticket.categoryId,
    attendeeName: "Ticket Holder",
    qrCodeValue: ticket.qrCode ?? ticket.ticketId,
    seatLabel: "General Admission",
    ticketStatus,
    issuedAt: booking?.bookingTimestamp ?? new Date().toISOString(),
    validatedAt: ticketStatus === "USED" ? booking?.bookingTimestamp : undefined
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_PATH}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

async function getLiveUsers(): Promise<BackendUser[]> {
  try {
    return await requestJson<BackendUser[]>("/users");
  } catch {
    return [];
  }
}

async function getLiveBookings(): Promise<BackendBooking[]> {
  try {
    return await requestJson<BackendBooking[]>("/bookings");
  } catch {
    return [];
  }
}

async function getLiveTickets(): Promise<BackendTicket[]> {
  try {
    return await requestJson<BackendTicket[]>("/tickets");
  } catch {
    return [];
  }
}

async function getLiveTicketCategories(): Promise<BackendTicketCategory[]> {
  try {
    return await requestJson<BackendTicketCategory[]>("/ticket-categories");
  } catch {
    return [];
  }
}

export const emtsApi = {
  async getEvents(): Promise<Event[]> {
    try {
      const [events, ticketCategories] = await Promise.all([
        requestJson<BackendEvent[]>("/events"),
        getLiveTicketCategories()
      ]);

      return events.map((event) =>
        mapEvent(
          event,
          ticketCategories
            .filter((category) => category.eventId === event.eventId)
            .map(mapTicketCategory)
        )
      );
    } catch {
      return mockDb.events;
    }
  },

  async getPublishedEvents(): Promise<Event[]> {
    const events = await this.getEvents();
    return events.filter((event) => event.status.toUpperCase() === "PUBLISHED");
  },

  async getEventById(eventId: string): Promise<Event | null> {
    const events = await this.getEvents();
    return events.find((event) => event.eventId === eventId) ?? null;
  },

  async getUsers(): Promise<User[]> {
    const users = await getLiveUsers();
    return users.length > 0 ? users.map(mapUser) : mockDb.users;
  },

  async getUserByRole(roleCode: UserRole): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((user) => user.roleCode === roleCode) ?? null;
  },

  async getUserBookings(customerId: string): Promise<Booking[]> {
    try {
      const [bookings, tickets] = await Promise.all([getLiveBookings(), getLiveTickets()]);

      return bookings
        .filter((booking) => booking.userId === customerId)
        .map((booking) =>
          mapBooking(
            booking,
            tickets
              .filter((ticket) => ticket.bookingId === booking.bookingId)
              .map((ticket) => ticket.ticketId)
          )
        );
    } catch {
      return mockDb.bookings.filter((booking) => booking.customerId === customerId);
    }
  },

  async getBookingById(bookingId: string): Promise<Booking | null> {
    const [bookings, tickets] = await Promise.all([getLiveBookings(), getLiveTickets()]);
    const booking = bookings.find((entry) => entry.bookingId === bookingId);

    if (!booking) {
      return mockDb.bookings.find((entry) => entry.bookingId === bookingId) ?? null;
    }

    return mapBooking(
      booking,
      tickets
        .filter((ticket) => ticket.bookingId === booking.bookingId)
        .map((ticket) => ticket.ticketId)
    );
  },

  async getPayments(): Promise<Payment[]> {
    return mockDb.payments;
  },

  async getTicketsByBooking(bookingId: string): Promise<Ticket[]> {
    try {
      const [tickets, bookings, categories] = await Promise.all([
        getLiveTickets(),
        getLiveBookings(),
        getLiveTicketCategories()
      ]);

      return tickets
        .filter((ticket) => ticket.bookingId === bookingId)
        .map((ticket) => mapTicket(ticket, bookings, categories));
    } catch {
      return mockDb.tickets.filter((ticket) => ticket.bookingId === bookingId);
    }
  },

  async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const [tickets, bookings, categories] = await Promise.all([
        getLiveTickets(),
        getLiveBookings(),
        getLiveTicketCategories()
      ]);

      const ticket = tickets.find((entry) => entry.ticketId === ticketId);
      return ticket ? mapTicket(ticket, bookings, categories) : null;
    } catch {
      return mockDb.tickets.find((ticket) => ticket.ticketId === ticketId) ?? null;
    }
  },

  async getRefunds(): Promise<Refund[]> {
    return mockDb.refunds;
  },

  async getRefundPolicies(): Promise<RefundPolicy[]> {
    return mockDb.refundPolicies;
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    return mockDb.notifications.filter((notification) => notification.userId === userId);
  },

  async getExpenses(eventId?: string): Promise<Expense[]> {
    return eventId ? mockDb.expenses.filter((expense) => expense.eventId === eventId) : mockDb.expenses;
  },

  async getEntryScanLogs(eventId?: string): Promise<EntryScanLog[]> {
    return eventId ? mockDb.entryScanLogs.filter((log) => log.eventId === eventId) : mockDb.entryScanLogs;
  },

  async createEvent(payload: {
    organizerId: string;
    title: string;
    eventType: string;
    status: string;
    venueName: string;
    cityName: string;
    description: string;
    startDateTime: string;
    endDateTime: string;
    seatCapacity: number;
  }) {
    return requestJson<BackendEvent>("/events", {
      method: "POST",
      body: JSON.stringify({
        organizerId: payload.organizerId,
        name: payload.title,
        type: payload.eventType,
        status: payload.status,
        venue: payload.venueName || payload.cityName,
        startTime: payload.startDateTime,
        endTime: payload.endDateTime,
        capacity: payload.seatCapacity
      })
    });
  },

  async deleteEvent(eventId: string) {
    await requestJson(`/events/${eventId}`, { method: "DELETE" });
  },

  async initiateCheckout(payload: CheckoutRequestDto) {
    return {
      bookingReference: `preview-${payload.eventId}-${payload.ticketCategoryId}`,
      paymentGatewayUrl: "/customer/payments/success"
    };
  },

  async requestBulkBooking(payload: BulkBookingRequestDto) {
    return {
      bulkRequestId: `bulk-${payload.eventId}-${payload.quantity}`,
      paymentLinkStatus: "GENERATED"
    };
  },

  async validateTicket(qrOrTicketId: string) {
    try {
      const [tickets, bookings, categories] = await Promise.all([
        getLiveTickets(),
        getLiveBookings(),
        getLiveTicketCategories()
      ]);

      const rawTicket =
        tickets.find((entry) => entry.qrCode === qrOrTicketId) ??
        tickets.find((entry) => entry.ticketId === qrOrTicketId);

      if (!rawTicket) {
        return { outcome: "INVALID" as const, ticket: null };
      }

      const ticket = mapTicket(rawTicket, bookings, categories);

      if (ticket.ticketStatus === "CANCELLED") {
        return { outcome: "CANCELLED" as const, ticket };
      }

      if (ticket.ticketStatus === "USED") {
        return { outcome: "DUPLICATE" as const, ticket };
      }

      return { outcome: "VALID" as const, ticket };
    } catch {
      const ticket =
        mockDb.tickets.find((entry) => entry.qrCodeValue === qrOrTicketId) ??
        mockDb.tickets.find((entry) => entry.ticketId === qrOrTicketId);

      if (!ticket) {
        return { outcome: "INVALID" as const, ticket: null };
      }

      if (ticket.ticketStatus === "CANCELLED") {
        return { outcome: "CANCELLED" as const, ticket };
      }

      if (ticket.ticketStatus === "USED") {
        return { outcome: "DUPLICATE" as const, ticket };
      }

      return { outcome: "VALID" as const, ticket };
    }
  }
};
*/
