import {
  Booking,
  CheckoutRequestDto,
  CorporateBookingRequest,
  CorporateBookingRequestItem,
  CorporateProfile,
  CheckoutConfirmationResult,
  Event,
  Notification,
  NotificationAudienceScope,
  OtpChallengeDto,
  OrganizerProfile,
  OrganizerReportData,
  Payment,
  PasswordResetCompleteDto,
  Refund,
  RefundPolicy,
  ReportRecord,
  VerifyOtpRequestDto,
  StaffEventAssignment,
  Ticket,
  TicketCategory,
  TicketStatus,
  User,
  UserRole
} from "@/types/contracts";
import { getDateTimeMillis, localDateTimeInputToBackendUtc, normalizeBackendUtcDateTime } from "@/utils/date-time";
import { isInternalUseCategoryName } from "@/utils/ticketing";

const API_BASE_PATH = "/api/emts";

interface BackendEvent {
  eventId: string;
  name: string;
  type: string;
  venue: string;
  capacity: number;
  status: string;
  organizerId: string;
  startTime: string;
  endTime: string;
}

interface BackendTicketCategory {
  categoryId: string;
  eventId: string;
  name: string;
  price: number;
  totalQty: number;
  availableQty: number;
  saleStartDate?: string;
}

interface BackendUser {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  password_hash?: string;
  type: string;
}

interface BackendBooking {
  bookingId: string;
  userId: string;
  eventId: string;
  quantity: number;
  totalCost: number;
  paymentStatus: string;
  bookingTimestamp: string;
}

interface BackendPayment {
  paymentId: string;
  amount: number;
  method: string;
  status: string;
  transactionTimestamp: string;
  bookingId: string;
}

interface BackendTicket {
  ticketId?: string;
  qrCode?: string;
  status?: string;
  categoryId: string;
  bookingId: string;
}

interface BackendRefundPolicy {
  policyId: string;
  fullRefundHours: number;
  partialRefundHours: number;
  partialRefundPct: number;
  eventId: string;
}

interface BackendNotification {
  notificationId: string;
  type: string;
  message: string;
  sentAt: string;
  eventId?: string;
  userId?: string;
  audienceScope?: NotificationAudienceScope;
  audienceRole?: string;
  metadata?: string;
  readAt?: string;
}

interface BackendLoginResponse {
  userId: string;
  name: string;
  email: string;
  phone: string;
  type: string;
}

interface BackendOtpChallengeResponse {
  challengeId: string;
  email: string;
  expiresAt: string;
  message: string;
  bookingId?: string;
  paymentId?: string;
}

interface BackendCheckoutConfirmResponse {
  bookingId: string;
  paymentId: string;
  ticketIds: string[];
}

interface TicketScanDetails {
  eventName: string;
  eventDate: string;
  categoryName: string;
  customerName: string;
  totalTickets: number;
  presentCount: number;
}

interface TicketScanResult {
  outcome: "VALID" | "DUPLICATE" | "CANCELLED" | "INVALID";
  ticket: Ticket | null;
  details: TicketScanDetails | null;
  statusLabel: string;
  message: string;
}

interface BackendReport {
  reportId: string;
  generatedDate: string;
  data: string;
  organizerId: string;
}

interface BackendOrganizer {
  userId: string;
  orgName: string;
}

interface BackendCorporate {
  userId: string;
  companyName: string;
  gstNumber: string;
}

interface BackendStaffAssignment {
  assignmentId: string;
  staffUserId: string;
  eventId: string;
  assignedByUserId?: string;
  assignedAt: string;
}

interface BackendCorporateRequestItem {
  requestItemId: string;
  requestId: string;
  categoryId: string;
  requestedQty: number;
  approvedQty?: number;
  reservedQty: number;
  offeredUnitPrice?: number;
}

interface BackendCorporateRequest {
  requestId: string;
  corporateUserId: string;
  organizerUserId: string;
  eventId: string;
  status: CorporateBookingRequest["status"];
  requestedTotalQty: number;
  offeredTotalAmount?: number;
  corporateNote?: string;
  organizerNote?: string;
  createdAt: string;
  updatedAt: string;
  decisionAt?: string;
  approvedAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  paidAt?: string;
  bookingId?: string;
  paymentId?: string;
}

interface BackendCorporateRequestView {
  request: BackendCorporateRequest;
  items: BackendCorporateRequestItem[];
}

interface CreateEventPayload {
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
  categories: Array<{
    name: string;
    price: number;
    totalQty: number;
    availableQty: number;
    saleStartDate: string;
  }>;
  refundPolicy: {
    fullRefundWindowHours: number;
    partialRefundWindowHours: number;
    partialRefundPercentage: number;
  };
}

interface BackendInternalTicketIssueResponse {
  bookingId: string;
  paymentId: string;
  categoryId: string;
  quantity: number;
}

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const toRoleCode = (value: string): UserRole => {
  switch (value.trim().toLowerCase()) {
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
};

const toBanner = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized.includes("concert")) return "/assets/event-concert.svg";
  if (normalized.includes("workshop")) return "/assets/event-workshop.svg";
  return "/assets/event-conference.svg";
};

const toTicketStatus = (status?: string): TicketStatus => {
  switch ((status ?? "booked").toLowerCase()) {
    case "used":
      return "USED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "ACTIVE";
  }
};

const safeJsonParse = <T,>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const parseQrPayload = (value: string): { qrCode?: string; ticketId?: string } | null => {
  return safeJsonParse<{ qrCode?: string; ticketId?: string }>(value);
};

const createSecretQrCode = (ticketId: string) => `${generateId("qr")}-${ticketId}`;

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
    const message = await response.text();
    const parsedError = safeJsonParse<{ message?: string; error?: string }>(message);
    const resolvedMessage = parsedError?.message || parsedError?.error || message;
    const normalizedPath = path.toLowerCase();
    if (normalizedPath === "/users/login" && (response.status === 401 || response.status === 500)) {
      throw new Error("Invalid email or password.");
    }

    throw new Error(resolvedMessage || `Request failed for ${path}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  if (!text.trim()) {
    return null as T;
  }

  return JSON.parse(text) as T;
}

const getAllUsersRaw = () => requestJson<BackendUser[]>("/users");
const getAllEventsRaw = () => requestJson<BackendEvent[]>("/events");
const getAllCategoriesRaw = () => requestJson<BackendTicketCategory[]>("/ticket-categories");
const getAllPoliciesRaw = () => requestJson<BackendRefundPolicy[]>("/refund-policies");
const getAllBookingsRaw = () => requestJson<BackendBooking[]>("/bookings");
const getAllPaymentsRaw = () => requestJson<BackendPayment[]>("/payments");
const getAllTicketsRaw = () => requestJson<BackendTicket[]>("/tickets");
const getAllNotificationsRaw = () => requestJson<BackendNotification[]>("/notifications");
const getUserRawById = (userId: string) => requestJson<BackendUser>(`/users/${userId}`);
const getTicketRawById = (ticketId: string) => requestJson<BackendTicket>(`/tickets/${ticketId}`);
const getOrganizerProfileRaw = (userId: string) => requestJson<BackendOrganizer>(`/organizers/${userId}`);
const getCorporateProfileRaw = (userId: string) => requestJson<BackendCorporate>(`/corporates/${userId}`);

function mapUser(user: BackendUser): User {
  return {
    userId: user.user_id,
    fullName: user.name,
    emailAddress: user.email,
    phoneNumber: user.phone,
    roleCode: toRoleCode(user.type),
    isTwoFactorEnabled: user.type === "organizer" || user.type === "admin",
    lastLoginAt: new Date().toISOString(),
    accountStatus: "ACTIVE"
  };
}

function mapCategory(category: BackendTicketCategory): TicketCategory {
  return {
    ticketCategoryId: category.categoryId,
    eventId: category.eventId,
    categoryCode: category.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
    displayName: category.name,
    unitPrice: Number(category.price),
    currencyCode: "INR",
    capacity: category.totalQty,
    availableQuantity: category.availableQty,
    description: `${category.name} category`,
    saleStartDate: normalizeBackendUtcDateTime(category.saleStartDate),
    isInternalUse: isInternalUseCategoryName(category.name)
  };
}

function mapRefundPolicy(policy: BackendRefundPolicy): RefundPolicy {
  return {
    refundPolicyId: policy.policyId,
    eventId: policy.eventId,
    title: "Refund policy",
    fullRefundWindowHours: policy.fullRefundHours,
    partialRefundWindowHours: policy.partialRefundHours,
    partialRefundPercentage: policy.partialRefundPct,
    policyDescription: `Full refund until ${policy.fullRefundHours}h, partial refund until ${policy.partialRefundHours}h.`
  };
}

function mapNotification(notification: BackendNotification): Notification {
  return {
    notificationId: notification.notificationId,
    eventId: notification.eventId,
    userId: notification.userId,
    notificationType: notification.type,
    message: notification.message,
    createdAt: normalizeBackendUtcDateTime(notification.sentAt),
    audienceScope: notification.audienceScope,
    audienceRole: notification.audienceRole,
    metadata: notification.metadata,
    readAt: notification.readAt
  };
}

function mapStaffAssignment(assignment: BackendStaffAssignment): StaffEventAssignment {
  return {
    assignmentId: assignment.assignmentId,
    staffUserId: assignment.staffUserId,
    eventId: assignment.eventId,
    assignedByUserId: assignment.assignedByUserId,
    assignedAt: normalizeBackendUtcDateTime(assignment.assignedAt)
  };
}

function mapCorporateRequestItem(item: BackendCorporateRequestItem): CorporateBookingRequestItem {
  return {
    requestItemId: item.requestItemId,
    requestId: item.requestId,
    categoryId: item.categoryId,
    requestedQty: item.requestedQty,
    approvedQty: item.approvedQty,
    reservedQty: item.reservedQty,
    offeredUnitPrice: item.offeredUnitPrice
  };
}

function mapCorporateRequest(view: BackendCorporateRequestView): CorporateBookingRequest {
  return {
    ...view.request,
    createdAt: normalizeBackendUtcDateTime(view.request.createdAt),
    updatedAt: normalizeBackendUtcDateTime(view.request.updatedAt),
    decisionAt: normalizeBackendUtcDateTime(view.request.decisionAt),
    approvedAt: normalizeBackendUtcDateTime(view.request.approvedAt),
    expiresAt: normalizeBackendUtcDateTime(view.request.expiresAt),
    cancelledAt: normalizeBackendUtcDateTime(view.request.cancelledAt),
    paidAt: normalizeBackendUtcDateTime(view.request.paidAt),
    items: view.items.map(mapCorporateRequestItem)
  };
}

function mapAuthenticatedUser(user: BackendLoginResponse): User {
  return {
    userId: user.userId,
    fullName: user.name,
    emailAddress: user.email,
    phoneNumber: user.phone,
    roleCode: toRoleCode(user.type),
    isTwoFactorEnabled: false,
    lastLoginAt: new Date().toISOString(),
    accountStatus: "ACTIVE"
  };
}

function mapOtpChallenge(response: BackendOtpChallengeResponse): OtpChallengeDto {
  return {
    challengeId: response.challengeId,
    email: response.email,
    expiresAt: normalizeBackendUtcDateTime(response.expiresAt),
    message: response.message,
    bookingId: response.bookingId,
    paymentId: response.paymentId
  };
}

function mapReport(report: BackendReport): ReportRecord {
  return {
    reportId: report.reportId,
    organizerId: report.organizerId,
    generatedDate: normalizeBackendUtcDateTime(report.generatedDate),
    data: report.data,
    parsedData: safeJsonParse<OrganizerReportData>(report.data)
  };
}

function buildEvent(event: BackendEvent, categories: TicketCategory[], policies: BackendRefundPolicy[]): Event {
  const available = categories.reduce((sum, category) => sum + category.availableQuantity, 0);
  const sold = Math.max(event.capacity - available, 0);
  const policy = policies.find((entry) => entry.eventId === event.eventId);

  return {
    eventId: event.eventId,
    organizerId: event.organizerId,
    title: event.name,
    slug: slugify(event.name),
    subtitle: `${event.type} at ${event.venue}`,
    description: `${event.name} is scheduled at ${event.venue}.`,
    eventType: event.type.toUpperCase(),
    status: event.status,
    startDateTime: normalizeBackendUtcDateTime(event.startTime),
    endDateTime: normalizeBackendUtcDateTime(event.endTime),
    venueName: event.venue,
    cityName: event.venue,
    stateName: "",
    bannerImageUrl: toBanner(event.type),
    coverTone: event.type.toLowerCase(),
    seatCapacity: event.capacity,
    publishedAt: event.status.toLowerCase() === "published" ? normalizeBackendUtcDateTime(event.startTime) : undefined,
    refundPolicyId: policy?.policyId ?? "",
    liveAttendanceCount: 0,
    noShowPercentage: 0,
    occupancyPercentage: event.capacity > 0 ? (sold / event.capacity) * 100 : 0,
    ticketCategories: categories,
    tags: [event.type, event.status]
  };
}

function mapBooking(booking: BackendBooking, ticketIds: string[]): Booking {
  return {
    bookingId: booking.bookingId,
    customerId: booking.userId,
    eventId: booking.eventId,
    bookingStatus: booking.paymentStatus,
    bookingChannel: "WEB",
    quantity: booking.quantity,
    subtotalAmount: Number(booking.totalCost),
    gstAmount: 0,
    totalAmount: Number(booking.totalCost),
    createdAt: normalizeBackendUtcDateTime(booking.bookingTimestamp),
    ticketIds,
    paymentId: `payment-${booking.bookingId}`
  };
}

function mapPayment(payment: BackendPayment): Payment {
  return {
    paymentId: payment.paymentId,
    bookingId: payment.bookingId,
    paymentGatewayCode: payment.method,
    amountPaid: Number(payment.amount),
    currencyCode: "INR",
    paymentStatus: payment.status,
    transactionReference: payment.paymentId,
    paidAt: normalizeBackendUtcDateTime(payment.transactionTimestamp)
  };
}

function mapTicket(ticket: BackendTicket, bookings: BackendBooking[], categories: BackendTicketCategory[]): Ticket {
  const booking = bookings.find((entry) => entry.bookingId === ticket.bookingId);
  const category = categories.find((entry) => entry.categoryId === ticket.categoryId);
  return {
    ticketId: ticket.ticketId ?? "",
    bookingId: ticket.bookingId,
    eventId: category?.eventId ?? booking?.eventId ?? "",
    ticketCategoryId: ticket.categoryId,
    attendeeName: "Ticket Holder",
    qrCodeValue: ticket.qrCode ?? "",
    seatLabel: category?.name ?? "General",
    ticketStatus: toTicketStatus(ticket.status),
    issuedAt: normalizeBackendUtcDateTime(booking?.bookingTimestamp) || new Date().toISOString(),
    validatedAt: (ticket.status ?? "").toLowerCase() === "used" ? normalizeBackendUtcDateTime(booking?.bookingTimestamp) : undefined
  };
}

async function buildTicketScanDetails(ticket: Ticket): Promise<TicketScanDetails | null> {
  const [booking, event, category, allBookings, allTickets] = await Promise.all([
    requestJson<BackendBooking>(`/bookings/${ticket.bookingId}`),
    requestJson<BackendEvent>(`/events/${ticket.eventId}`),
    requestJson<BackendTicketCategory>(`/ticket-categories/${ticket.ticketCategoryId}`),
    getAllBookingsRaw(),
    getAllTicketsRaw()
  ]).catch(() => [null, null, null, [] as BackendBooking[], [] as BackendTicket[]] as const);

  if (!booking || !event || !category) {
    return null;
  }

  const bookingUser = await getUserRawById(booking.userId).catch(() => null);
  const eventBookingIds = new Set(allBookings.filter((entry) => entry.eventId === event.eventId).map((entry) => entry.bookingId));
  const eventTickets = allTickets.filter((entry) => eventBookingIds.has(entry.bookingId));
  const presentCount = eventTickets.filter((entry) => (entry.status ?? "").toLowerCase() === "used").length;

  return {
    eventName: event.name,
    eventDate: normalizeBackendUtcDateTime(event.startTime),
    categoryName: category.name,
    customerName: bookingUser?.name ?? "Customer",
    totalTickets: eventTickets.length,
    presentCount
  };
}

function ensureQuantity(category: BackendTicketCategory, quantity: number) {
  if (quantity <= 0) throw new Error("Quantity must be at least 1.");
  if (quantity > category.availableQty) throw new Error("Requested quantity exceeds remaining tickets.");
}

function getCancellationOutcome(event: Event, policy: RefundPolicy) {
  const now = Date.now();
  const eventStart = getDateTimeMillis(event.startDateTime);
  const eventEnd = getDateTimeMillis(event.endDateTime);

  if (now >= eventEnd) {
    return { allowed: false, mode: "closed" as const };
  }

  const hoursToEvent = (eventStart - now) / (1000 * 60 * 60);
  if (hoursToEvent >= policy.fullRefundWindowHours) {
    return { allowed: true, mode: "full" as const };
  }

  if (hoursToEvent >= policy.partialRefundWindowHours) {
    return { allowed: true, mode: "partial" as const };
  }

  return { allowed: true, mode: "none" as const };
}

export const emtsApi = {
  async getUsers(): Promise<User[]> {
    return (await getAllUsersRaw()).map(mapUser);
  },

  async getUserByRole(roleCode: UserRole): Promise<User | null> {
    return (await this.getUsers()).find((user) => user.roleCode === roleCode) ?? null;
  },

  async updateUserRole(userId: string, roleCode: UserRole): Promise<User> {
    const currentUser = (await getAllUsersRaw()).find((user) => user.user_id === userId);
    if (!currentUser) {
      throw new Error("User not found.");
    }

    const backendRole =
      roleCode === "CORPORATE_CLIENT"
        ? "corporate"
        : roleCode.toLowerCase();

    const updated = await requestJson<BackendUser>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        ...currentUser,
        type: backendRole
      })
    });

    return mapUser(updated);
  },

  async createCustomerAccount(payload: { fullName: string; emailAddress: string; phoneNumber: string; password: string }): Promise<OtpChallengeDto> {
    return mapOtpChallenge(await requestJson<BackendOtpChallengeResponse>("/auth/register/start", {
      method: "POST",
      body: JSON.stringify({
        fullName: payload.fullName.trim(),
        email: payload.emailAddress.trim(),
        phone: payload.phoneNumber.trim(),
        password: payload.password
      })
    }));
  },

  async verifyCustomerRegistration(payload: VerifyOtpRequestDto): Promise<User> {
    const response = await requestJson<BackendLoginResponse>("/auth/register/verify", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return mapAuthenticatedUser(response);
  },

  async login(emailAddress: string, password: string): Promise<User> {
    const response = await requestJson<BackendLoginResponse>("/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: emailAddress.trim(),
        password
      })
    });

    return mapAuthenticatedUser(response);
  },

  async startPasswordReset(emailAddress: string): Promise<OtpChallengeDto> {
    return mapOtpChallenge(await requestJson<BackendOtpChallengeResponse>("/auth/password-reset/start", {
      method: "POST",
      body: JSON.stringify({ email: emailAddress.trim() })
    }));
  },

  async completePasswordReset(payload: PasswordResetCompleteDto): Promise<void> {
    await requestJson("/auth/password-reset/complete", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async getEvents(): Promise<Event[]> {
    const [events, categories, policies] = await Promise.all([
      getAllEventsRaw(),
      getAllCategoriesRaw(),
      getAllPoliciesRaw()
    ]);

    return events.map((event) =>
      buildEvent(
        event,
        categories.filter((category) => category.eventId === event.eventId).map(mapCategory),
        policies
      )
    );
  },

  async getPublishedEvents(): Promise<Event[]> {
    return (await this.getEvents()).filter((event) => event.status.toLowerCase() === "published");
  },

  async getEventById(eventId: string): Promise<Event | null> {
    return (await this.getEvents()).find((event) => event.eventId === eventId) ?? null;
  },

  async getRefundPolicies(): Promise<RefundPolicy[]> {
    return (await getAllPoliciesRaw()).map(mapRefundPolicy);
  },

  async getRefundPolicyByEvent(eventId: string): Promise<RefundPolicy | null> {
    return (await this.getRefundPolicies()).find((policy) => policy.eventId === eventId) ?? null;
  },

  async getBookings(): Promise<Booking[]> {
    const [bookings, tickets] = await Promise.all([getAllBookingsRaw(), getAllTicketsRaw()]);
    return bookings.map((booking) =>
      mapBooking(
        booking,
        tickets.filter((ticket) => ticket.bookingId === booking.bookingId).map((ticket) => ticket.ticketId ?? "")
      )
    );
  },

  async getUserBookings(customerId: string): Promise<Booking[]> {
    return (await this.getBookings()).filter((booking) => booking.customerId === customerId);
  },

  async getBookingById(bookingId: string): Promise<Booking | null> {
    return (await this.getBookings()).find((booking) => booking.bookingId === bookingId) ?? null;
  },

  async getPayments(): Promise<Payment[]> {
    return (await getAllPaymentsRaw()).map(mapPayment);
  },

  async getPaymentByBooking(bookingId: string): Promise<Payment | null> {
    return (await this.getPayments()).find((payment) => payment.bookingId === bookingId) ?? null;
  },

  async getTickets(): Promise<Ticket[]> {
    const [tickets, bookings, categories] = await Promise.all([
      getAllTicketsRaw(),
      getAllBookingsRaw(),
      getAllCategoriesRaw()
    ]);
    return tickets.map((ticket) => mapTicket(ticket, bookings, categories));
  },

  async getTicketsByBooking(bookingId: string): Promise<Ticket[]> {
    return (await this.getTickets()).filter((ticket) => ticket.bookingId === bookingId);
  },

  async getTicketById(ticketId: string): Promise<Ticket | null> {
    return (await this.getTickets()).find((ticket) => ticket.ticketId === ticketId) ?? null;
  },

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return (await requestJson<BackendNotification[]>(`/notifications/visible/${userId}`)).map(mapNotification);
  },

  async markNotificationAsRead(notificationId: string, userId: string): Promise<Notification> {
    return mapNotification(await requestJson<BackendNotification>(`/notifications/${notificationId}/read?userId=${encodeURIComponent(userId)}`, { method: "PATCH" }));
  },

  async markAllNotificationsAsRead(userId: string): Promise<Notification[]> {
    return (await requestJson<BackendNotification[]>(`/notifications/visible/${userId}/read-all`, { method: "PATCH" })).map(mapNotification);
  },

  async getReports(): Promise<ReportRecord[]> {
    return (await requestJson<BackendReport[]>("/reports")).map(mapReport);
  },

  async getReportsByOrganizer(organizerId: string): Promise<ReportRecord[]> {
    return (await requestJson<BackendReport[]>(`/reports/organizer/${organizerId}`)).map(mapReport);
  },

  async getOrganizerProfiles(): Promise<OrganizerProfile[]> {
    return requestJson<BackendOrganizer[]>("/organizers");
  },

  async getCorporateProfiles(): Promise<CorporateProfile[]> {
    return requestJson<BackendCorporate[]>("/corporates");
  },

  async getOrganizerProfile(userId: string): Promise<OrganizerProfile | null> {
    return getOrganizerProfileRaw(userId).catch(() => null);
  },

  async upsertOrganizerProfile(userId: string, orgName: string): Promise<OrganizerProfile> {
    return requestJson<BackendOrganizer>(`/organizers/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        userId,
        orgName: orgName.trim()
      })
    });
  },

  async getCorporateProfile(userId: string): Promise<CorporateProfile | null> {
    return getCorporateProfileRaw(userId).catch(() => null);
  },

  async upsertCorporateProfile(userId: string, companyName: string, gstNumber: string): Promise<CorporateProfile> {
    return requestJson<BackendCorporate>(`/corporates/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        userId,
        companyName: companyName.trim(),
        gstNumber: gstNumber.trim()
      })
    });
  },

  async getStaffAssignmentsByUser(staffUserId: string): Promise<StaffEventAssignment[]> {
    return (await requestJson<BackendStaffAssignment[]>(`/staff-assignments/staff/${staffUserId}`)).map(mapStaffAssignment);
  },

  async getStaffAssignmentsByEvent(eventId: string): Promise<StaffEventAssignment[]> {
    return (await requestJson<BackendStaffAssignment[]>(`/staff-assignments/event/${eventId}`)).map(mapStaffAssignment);
  },

  async assignStaffToEvent(payload: { staffUserId: string; eventId: string; assignedByUserId?: string }): Promise<StaffEventAssignment> {
    return mapStaffAssignment(await requestJson<BackendStaffAssignment>("/staff-assignments", {
      method: "POST",
      body: JSON.stringify({
        assignmentId: generateId("assignment"),
        staffUserId: payload.staffUserId,
        eventId: payload.eventId,
        assignedByUserId: payload.assignedByUserId
      })
    }));
  },

  async issueInternalTickets(payload: {
    eventId: string;
    userId: string;
    type: "Staff" | "Internal" | "VIP";
    quantity: number;
    createdByUserId?: string;
  }): Promise<BackendInternalTicketIssueResponse> {
    return requestJson<BackendInternalTicketIssueResponse>("/internal-tickets/issue", {
      method: "POST",
      body: JSON.stringify({
        eventId: payload.eventId,
        userId: payload.userId,
        type: payload.type,
        quantity: payload.quantity,
        createdByUserId: payload.createdByUserId
      })
    });
  },

  async getCorporateRequestsForCorporate(corporateUserId: string): Promise<CorporateBookingRequest[]> {
    return (await requestJson<BackendCorporateRequestView[]>(`/corporate-booking-requests/corporate/${corporateUserId}`)).map(mapCorporateRequest);
  },

  async getCorporateRequestsForOrganizer(organizerUserId: string): Promise<CorporateBookingRequest[]> {
    return (await requestJson<BackendCorporateRequestView[]>(`/corporate-booking-requests/organizer/${organizerUserId}`)).map(mapCorporateRequest);
  },

  async createCorporateRequest(payload: {
    corporateUserId: string;
    eventId: string;
    corporateNote?: string;
    items: Array<{ categoryId: string; quantity: number }>;
  }): Promise<CorporateBookingRequest> {
    const categories = await getAllCategoriesRaw();
    for (const item of payload.items) {
      const category = categories.find((entry) => entry.categoryId === item.categoryId);
      if (!category) {
        throw new Error("One of the requested categories no longer exists.");
      }
      if (isInternalUseCategoryName(category.name)) {
        throw new Error("Internal usage categories cannot be requested through the corporate workflow.");
      }
    }

    return mapCorporateRequest(await requestJson<BackendCorporateRequestView>("/corporate-booking-requests", {
      method: "POST",
      body: JSON.stringify({
        requestId: generateId("corp-request"),
        corporateUserId: payload.corporateUserId,
        eventId: payload.eventId,
        corporateNote: payload.corporateNote,
        items: payload.items
      })
    }));
  },

  async approveCorporateRequest(payload: {
    requestId: string;
    organizerNote?: string;
    expiresAt: string;
    items: Array<{ categoryId: string; quantity: number; offeredUnitPrice: number }>;
  }): Promise<CorporateBookingRequest> {
    return mapCorporateRequest(await requestJson<BackendCorporateRequestView>(`/corporate-booking-requests/${payload.requestId}/approve`, {
      method: "POST",
      body: JSON.stringify({
        organizerNote: payload.organizerNote,
        expiresAt: payload.expiresAt,
        items: payload.items
      })
    }));
  },

  async rejectCorporateRequest(requestId: string, organizerNote?: string): Promise<CorporateBookingRequest> {
    return mapCorporateRequest(await requestJson<BackendCorporateRequestView>(`/corporate-booking-requests/${requestId}/reject`, {
      method: "POST",
      body: JSON.stringify({ organizerNote })
    }));
  },

  async cancelCorporateRequest(requestId: string): Promise<CorporateBookingRequest> {
    return mapCorporateRequest(await requestJson<BackendCorporateRequestView>(`/corporate-booking-requests/${requestId}/cancel`, { method: "POST" }));
  },

  async sendCorporatePaymentOtp(requestId: string, method: string): Promise<OtpChallengeDto> {
    return mapOtpChallenge(await requestJson<BackendOtpChallengeResponse>(`/corporate-booking-requests/${requestId}/payment-otp`, {
      method: "POST",
      body: JSON.stringify({ method })
    }));
  },

  async payCorporateRequest(requestId: string, method: string, verification?: VerifyOtpRequestDto): Promise<CorporateBookingRequest> {
    return mapCorporateRequest(await requestJson<BackendCorporateRequestView>(`/corporate-booking-requests/${requestId}/pay`, {
      method: "POST",
      body: JSON.stringify({ method, challengeId: verification?.challengeId, otpCode: verification?.otpCode })
    }));
  },

  async createEvent(payload: CreateEventPayload): Promise<Event> {
    const created = await requestJson<BackendEvent>("/events", {
      method: "POST",
      body: JSON.stringify({
        eventId: generateId("event"),
        organizerId: payload.organizerId,
        name: payload.title.trim(),
        type: payload.eventType.trim(),
        venue: payload.venueName.trim(),
        capacity: payload.seatCapacity,
        status: payload.status.trim(),
        startTime: localDateTimeInputToBackendUtc(payload.startDateTime),
        endTime: localDateTimeInputToBackendUtc(payload.endDateTime)
      })
    });

    await Promise.all(
      payload.categories.map((category) =>
        requestJson("/ticket-categories", {
          method: "POST",
          body: JSON.stringify({
            categoryId: generateId("category"),
            eventId: created.eventId,
            name: category.name.trim(),
            price: category.price,
            totalQty: category.totalQty,
            availableQty: category.availableQty,
            saleStartDate: localDateTimeInputToBackendUtc(category.saleStartDate)
          })
        })
      )
    );

    await requestJson("/refund-policies", {
      method: "POST",
      body: JSON.stringify({
        policyId: generateId("policy"),
        eventId: created.eventId,
        fullRefundHours: payload.refundPolicy.fullRefundWindowHours,
        partialRefundHours: payload.refundPolicy.partialRefundWindowHours,
        partialRefundPct: payload.refundPolicy.partialRefundPercentage
      })
    });

    const event = await this.getEventById(created.eventId);
    if (!event) throw new Error("Event was created but could not be reloaded.");
    return event;
  },

  async deleteEvent(eventId: string) {
    const [bookings, tickets, payments] = await Promise.all([
      getAllBookingsRaw(),
      getAllTicketsRaw(),
      getAllPaymentsRaw()
    ]);

    const eventBookings = bookings.filter((booking) => booking.eventId === eventId);
    const bookingIds = new Set(eventBookings.map((booking) => booking.bookingId));
    const eventTickets = tickets.filter((ticket) => bookingIds.has(ticket.bookingId));
    const eventPayments = payments.filter((payment) => bookingIds.has(payment.bookingId));

    for (const ticket of eventTickets) {
      if ((ticket.status ?? "").toLowerCase() !== "cancelled") {
        await this.updateTicketStatus(ticket.ticketId ?? "", "cancelled");
      }
    }

    for (const payment of eventPayments) {
      const normalized = payment.status.toLowerCase();
      if (!normalized.startsWith("refunded") && normalized !== "no_refund") {
        await this.processRefund(payment.paymentId);
      }
    }

    for (const booking of eventBookings) {
      await requestJson("/bookings", {
        method: "POST",
        body: JSON.stringify({
          bookingId: booking.bookingId,
          userId: booking.userId,
          eventId: booking.eventId,
          quantity: booking.quantity,
          totalCost: booking.totalCost,
          paymentStatus: "cancelled",
          bookingTimestamp: booking.bookingTimestamp
        })
      });
    }

    await requestJson(`/events/${eventId}`, { method: "DELETE" });
  },

  async createReport(report: OrganizerReportData): Promise<ReportRecord> {
    const created = await requestJson<BackendReport>("/reports", {
      method: "POST",
      body: JSON.stringify({
        reportId: generateId("report"),
        organizerId: report.organizerId,
        generatedDate: report.generatedAt,
        data: JSON.stringify(report)
      })
    });
    return mapReport(created);
  },

  async updateReport(reportId: string, report: OrganizerReportData, generatedDate?: string): Promise<ReportRecord> {
    const updated = await requestJson<BackendReport>(`/reports/${reportId}`, {
      method: "PUT",
      body: JSON.stringify({
        reportId,
        organizerId: report.organizerId,
        generatedDate: generatedDate ?? report.generatedAt,
        data: JSON.stringify(report)
      })
    });
    return mapReport(updated);
  },

  async deleteReport(reportId: string): Promise<void> {
    await requestJson(`/reports/${reportId}`, { method: "DELETE" });
  },

  async createNotification(payload: {
    eventId?: string;
    userId?: string;
    type: string;
    message: string;
    audienceScope?: NotificationAudienceScope;
    audienceRole?: string;
    metadata?: string;
    createdByUserId?: string;
  }): Promise<Notification> {
    const created = await requestJson<BackendNotification>("/notifications", {
      method: "POST",
      body: JSON.stringify({
        notificationId: generateId("notification"),
        eventId: payload.eventId,
        userId: payload.userId,
        type: payload.type,
        message: payload.message,
        audienceScope: payload.audienceScope,
        audienceRole: payload.audienceRole,
        metadata: payload.metadata,
        createdByUserId: payload.createdByUserId
      })
    });
    return mapNotification(created);
  },

  async createPayment(payload: { bookingId: string; amount: number; method: string }): Promise<Payment> {
    const created = await requestJson<BackendPayment>("/payments", {
      method: "POST",
      body: JSON.stringify({
        paymentId: generateId("payment"),
        amount: payload.amount,
        method: payload.method,
        status: "pending",
        bookingId: payload.bookingId
      })
    });
    return mapPayment(created);
  },

  async updatePaymentStatus(paymentId: string, status: string): Promise<Payment> {
    return mapPayment(
      await requestJson<BackendPayment>(`/payments/${paymentId}/status?status=${encodeURIComponent(status)}`, {
        method: "PATCH"
      })
    );
  },

  async processRefund(paymentId: string): Promise<Payment> {
    return mapPayment(await requestJson<BackendPayment>(`/payments/refund/${paymentId}`, { method: "POST" }));
  },

  async upsertTicketCategory(category: BackendTicketCategory): Promise<TicketCategory> {
    return mapCategory(await requestJson<BackendTicketCategory>("/ticket-categories", { method: "POST", body: JSON.stringify(category) }));
  },

  async createTicket(payload: { bookingId: string; categoryId: string; status?: string }): Promise<Ticket> {
    const ticketId = generateId("ticket");
    const created = await requestJson<BackendTicket>("/tickets", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        ticketId,
        qrCode: createSecretQrCode(ticketId)
      })
    });
    const [bookings, categories] = await Promise.all([getAllBookingsRaw(), getAllCategoriesRaw()]);
    return mapTicket(created, bookings, categories);
  },

  async updateTicketStatus(ticketId: string, status: "booked" | "used" | "cancelled"): Promise<Ticket> {
    const created = await requestJson<BackendTicket>(`/tickets/${ticketId}/status?status=${status}`, { method: "PATCH" });
    const [bookings, categories] = await Promise.all([getAllBookingsRaw(), getAllCategoriesRaw()]);
    return mapTicket(created, bookings, categories);
  },

  async initiateCheckout(payload: CheckoutRequestDto): Promise<OtpChallengeDto> {
    return mapOtpChallenge(await requestJson<BackendOtpChallengeResponse>("/checkout/start", {
      method: "POST",
      body: JSON.stringify(payload)
    }));
  },

  async confirmCheckout(payload: VerifyOtpRequestDto & { bookingId: string; paymentId: string }): Promise<CheckoutConfirmationResult> {
    return requestJson<BackendCheckoutConfirmResponse>("/checkout/confirm", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  async cancelTicket(ticketId: string) {
    const ticket = await this.getTicketById(ticketId);
    if (!ticket) throw new Error("Ticket not found.");
    if (ticket.ticketStatus === "CANCELLED") throw new Error("Ticket is already cancelled.");
    if (ticket.ticketStatus === "USED") throw new Error("Used tickets cannot be cancelled.");

    const [booking, payment, event, policy, categories] = await Promise.all([
      this.getBookingById(ticket.bookingId),
      this.getPaymentByBooking(ticket.bookingId),
      this.getEventById(ticket.eventId),
      this.getRefundPolicyByEvent(ticket.eventId),
      getAllCategoriesRaw()
    ]);

    if (!booking || !payment || !event || !policy) {
      throw new Error("Cancellation data is incomplete for this ticket.");
    }

    const cancellationOutcome = getCancellationOutcome(event, policy);
    if (!cancellationOutcome.allowed) {
      throw new Error("Tickets can no longer be cancelled after the event has ended.");
    }

    const updatedTicket = await this.updateTicketStatus(ticket.ticketId, "cancelled");
    const category = categories.find((entry) => entry.categoryId === ticket.ticketCategoryId);

    if (category) {
      await this.upsertTicketCategory({ ...category, availableQty: category.availableQty + 1 });
    }

    const updatedPayment =
      cancellationOutcome.mode === "none"
        ? await this.updatePaymentStatus(payment.paymentId, "no_refund")
        : await this.processRefund(payment.paymentId);

    await this.createNotification({
      eventId: ticket.eventId,
      userId: booking.customerId,
      type: "refund",
      message:
        cancellationOutcome.mode === "none"
          ? `Ticket ${ticket.ticketId} was cancelled. The seat was released back to inventory, but no refund applied because the refund window has closed.`
          : `Ticket ${ticket.ticketId} was cancelled. Payment status: ${updatedPayment.paymentStatus}.`,
      audienceScope: "DIRECT"
    });

    const refund: Refund = {
      refundId: updatedPayment.paymentId,
      bookingId: booking.bookingId,
      refundStatus:
        updatedPayment.paymentStatus.startsWith("refunded")
          ? "PROCESSED"
          : updatedPayment.paymentStatus === "no_refund"
            ? "REJECTED"
            : "REJECTED",
      eligibleAmount: payment.amountPaid,
      approvedAmount: updatedPayment.amountPaid,
      refundReason: cancellationOutcome.mode === "none" ? "Ticket cancellation after refund window closed" : "Ticket cancellation",
      requestedAt: new Date().toISOString(),
      processedAt: new Date().toISOString()
    };

    return { ticket: updatedTicket, payment: updatedPayment, refund };
  },

  async cancelBooking(bookingId: string) {
    const tickets = await this.getTicketsByBooking(bookingId);
    if (tickets.length === 0) {
      throw new Error("No tickets were found for this booking.");
    }

    const [payment, booking, event, policy, categories] = await Promise.all([
      this.getPaymentByBooking(bookingId),
      this.getBookingById(bookingId),
      this.getEventById(tickets[0].eventId),
      this.getRefundPolicyByEvent(tickets[0].eventId),
      getAllCategoriesRaw()
    ]);
    const eventId = tickets[0].eventId;

    if (!payment || !booking || !event || !policy) {
      throw new Error("Cancellation data is incomplete for this booking.");
    }

    const activeTickets = tickets.filter((ticket) => ticket.ticketStatus === "ACTIVE");
    if (activeTickets.length === 0) {
      throw new Error("No active tickets remain in this booking.");
    }

    const cancellationOutcome = getCancellationOutcome(event, policy);
    if (!cancellationOutcome.allowed) {
      throw new Error("Tickets can no longer be cancelled after the event has ended.");
    }

    const cancelledTickets = [];
    const releaseCounts: Record<string, number> = {};
    for (const ticket of activeTickets) {
      const updatedTicket = await this.updateTicketStatus(ticket.ticketId, "cancelled");
      releaseCounts[ticket.ticketCategoryId] = (releaseCounts[ticket.ticketCategoryId] ?? 0) + 1;
      cancelledTickets.push(updatedTicket);
    }

    await Promise.all(
      Object.entries(releaseCounts).map(async ([categoryId, releasedCount]) => {
        const category = categories.find((entry) => entry.categoryId === categoryId);
        if (category) {
          await this.upsertTicketCategory({ ...category, availableQty: category.availableQty + releasedCount });
        }
      })
    );

    const updatedPayment =
      cancellationOutcome.mode === "none"
        ? await this.updatePaymentStatus(payment.paymentId, "no_refund")
        : await this.processRefund(payment.paymentId);

    await this.createNotification({
      eventId,
      userId: booking?.customerId,
      type: "refund",
      message:
        cancellationOutcome.mode === "none"
          ? `Booking ${bookingId} was cancelled. The seats were released back to inventory, but no refund applied because the refund window has closed.`
          : `Booking ${bookingId} was cancelled and all associated tickets were refunded where eligible.`,
      audienceScope: "DIRECT"
    });

    return { bookingId, payment: updatedPayment, tickets: cancelledTickets };
  },

  async generateOrganizerReport(organizerId: string): Promise<ReportRecord> {
    const [existingReports, events, bookings, payments, tickets, users] = await Promise.all([
      this.getReportsByOrganizer(organizerId).catch(() => []),
      this.getEvents(),
      this.getBookings(),
      this.getPayments(),
      this.getTickets(),
      this.getUsers()
    ]);

    const latestExistingReport = existingReports[0]?.parsedData ?? null;
    const previousEventState = Object.fromEntries(
      (latestExistingReport?.events ?? []).map((event) => [event.eventId, event])
    );
    const organizerEvents = events.filter((event) => event.organizerId === organizerId);
    const assignmentsByEvent = Object.fromEntries(
      await Promise.all(
        organizerEvents.map(async (event) => [
          event.eventId,
          await this.getStaffAssignmentsByEvent(event.eventId).catch(() => [])
        ])
      )
    );
    const eventSummaries = organizerEvents.map((event) => {
      const eventBookings = bookings.filter((booking) => booking.eventId === event.eventId);
      const eventTickets = tickets.filter((ticket) => ticket.eventId === event.eventId);
      const eventPayments = payments.filter((payment) => eventBookings.some((booking) => booking.bookingId === payment.bookingId));
      const checkedInCount = eventTickets.filter((ticket) => ticket.ticketStatus === "USED").length;
      const cancelledTickets = eventTickets.filter((ticket) => ticket.ticketStatus === "CANCELLED").length;
      const previous = previousEventState[event.eventId];
      const expenseBuckets = previous?.expenseBuckets ?? [];
      const totalExpenses = expenseBuckets.reduce((sum: number, bucket: { amount: number }) => sum + bucket.amount, 0);
      const assignedStaff = ((assignmentsByEvent[event.eventId] ?? []) as StaffEventAssignment[]).map((assignment) => {
        const staffUser = users.find((user) => user.userId === assignment.staffUserId);
        return {
          assignmentId: assignment.assignmentId,
          staffUserId: assignment.staffUserId,
          staffName: staffUser?.fullName ?? assignment.staffUserId,
          staffEmail: staffUser?.emailAddress ?? "",
          assignedAt: assignment.assignedAt
        };
      });

      return {
        eventId: event.eventId,
        title: event.title,
        venueName: event.venueName,
        startDateTime: event.startDateTime,
        status: event.status,
        seatCapacity: event.seatCapacity,
        ticketsSold: Math.max(event.seatCapacity - event.ticketCategories.reduce((sum, category) => sum + category.availableQuantity, 0), 0),
        checkedInCount,
        cancelledTickets,
        occupancyPercentage: event.occupancyPercentage,
        noShowPercentage: eventTickets.length > 0 ? ((eventTickets.length - checkedInCount - cancelledTickets) / eventTickets.length) * 100 : 0,
        grossRevenue: eventPayments.reduce((sum, payment) => sum + payment.amountPaid, 0),
        refundedAmount: eventPayments.filter((payment) => payment.paymentStatus.startsWith("refunded")).reduce((sum, payment) => sum + payment.amountPaid, 0),
        totalExpenses,
        netRevenue: eventPayments.reduce((sum, payment) => sum + payment.amountPaid, 0) - totalExpenses,
        expenseBuckets,
        assignedStaff,
        categories: event.ticketCategories.map((category) => {
          const categoryTickets = eventTickets.filter((ticket) => ticket.ticketCategoryId === category.ticketCategoryId);
          const soldQuantity = categoryTickets.filter((ticket) => ticket.ticketStatus !== "CANCELLED").length;
          return {
            ticketCategoryId: category.ticketCategoryId,
            name: category.displayName,
            capacity: category.capacity,
            availableQuantity: category.availableQuantity,
            soldQuantity,
            activeTickets: categoryTickets.filter((ticket) => ticket.ticketStatus === "ACTIVE").length,
            usedTickets: categoryTickets.filter((ticket) => ticket.ticketStatus === "USED").length,
            cancelledTickets: categoryTickets.filter((ticket) => ticket.ticketStatus === "CANCELLED").length,
            revenue: soldQuantity * category.unitPrice
          };
        })
      };
    });

    return this.createReport({
      organizerId,
      generatedAt: new Date().toISOString(),
      summary: {
        eventCount: organizerEvents.length,
        publishedEventCount: organizerEvents.filter((event) => event.status.toLowerCase() === "published").length,
        totalBookings: bookings.filter((booking) => organizerEvents.some((event) => event.eventId === booking.eventId)).length,
        totalTickets: eventSummaries.reduce((sum, event) => sum + event.ticketsSold, 0),
        checkedInTickets: eventSummaries.reduce((sum, event) => sum + event.checkedInCount, 0),
        cancelledTickets: eventSummaries.reduce((sum, event) => sum + event.cancelledTickets, 0),
        grossRevenue: eventSummaries.reduce((sum, event) => sum + event.grossRevenue, 0),
        refundedAmount: eventSummaries.reduce((sum, event) => sum + event.refundedAmount, 0),
        averageOccupancy: eventSummaries.length > 0 ? eventSummaries.reduce((sum, event) => sum + event.occupancyPercentage, 0) / eventSummaries.length : 0,
        totalExpenses: eventSummaries.reduce((sum, event) => sum + (event.totalExpenses ?? 0), 0),
        netRevenue: eventSummaries.reduce((sum, event) => sum + (event.netRevenue ?? 0), 0)
      },
      events: eventSummaries
    });
  },

  async validateTicket(qrOrTicketId: string, expectedEventId?: string) {
    const scannedPayload = parseQrPayload(qrOrTicketId);
    const ticketId = scannedPayload?.ticketId ?? qrOrTicketId.trim();
    if (!ticketId) {
      return {
        outcome: "INVALID" as const,
        ticket: null,
        details: null,
        statusLabel: "Invalid ticket",
        message: "The QR payload does not include a valid ticket ID."
      } satisfies TicketScanResult;
    }

    let backendTicket: BackendTicket;
    try {
      backendTicket = await getTicketRawById(ticketId);
    } catch {
      return {
        outcome: "INVALID" as const,
        ticket: null,
        details: null,
        statusLabel: "Ticket not found",
        message: "No ticket matches the scanned ticket ID."
      } satisfies TicketScanResult;
    }

    const qrMatches = scannedPayload
      ? scannedPayload.ticketId === (backendTicket.ticketId ?? "") && scannedPayload.qrCode === (backendTicket.qrCode ?? "")
      : qrOrTicketId.trim() === (backendTicket.qrCode ?? "") || qrOrTicketId.trim() === backendTicket.ticketId;

    if (!qrMatches) {
      return {
        outcome: "INVALID" as const,
        ticket: null,
        details: null,
        statusLabel: "Invalid QR",
        message: "The scanned QR code does not match the stored ticket payload."
      } satisfies TicketScanResult;
    }

    const [bookings, categories] = await Promise.all([getAllBookingsRaw(), getAllCategoriesRaw()]);
    const ticket = mapTicket(backendTicket, bookings, categories);
    const details = await buildTicketScanDetails(ticket);

    if (expectedEventId && ticket.eventId !== expectedEventId) {
      return {
        outcome: "INVALID" as const,
        ticket,
        details,
        statusLabel: "Wrong event",
        message: "This ticket does not belong to the selected event."
      } satisfies TicketScanResult;
    }

    if (ticket.ticketStatus === "CANCELLED") {
      return {
        outcome: "CANCELLED" as const,
        ticket,
        details,
        statusLabel: "Cancelled",
        message: "This ticket was cancelled and cannot be used for entry."
      } satisfies TicketScanResult;
    }

    if (ticket.ticketStatus === "USED") {
      return {
        outcome: "DUPLICATE" as const,
        ticket,
        details,
        statusLabel: "Already used",
        message: "This ticket has already been marked present."
      } satisfies TicketScanResult;
    }

    return {
      outcome: "VALID" as const,
      ticket,
      details,
      statusLabel: "Entry allowed",
      message: "Ticket is valid and ready to be marked present."
    } satisfies TicketScanResult;
  },

  async markTicketPresent(ticketId: string) {
    return this.updateTicketStatus(ticketId, "used");
  },

  async scanAndMarkTicket(qrPayload: string, expectedEventId?: string): Promise<TicketScanResult> {
    const validation = await this.validateTicket(qrPayload, expectedEventId);

    if (validation.outcome !== "VALID" || !validation.ticket) {
      return validation;
    }

    const updatedTicket = await this.markTicketPresent(validation.ticket.ticketId);
    const details = await buildTicketScanDetails(updatedTicket);

    return {
      outcome: "VALID",
      ticket: updatedTicket,
      details,
      statusLabel: "Present",
      message: "Ticket validated and attendee marked present."
    };
  }
};
