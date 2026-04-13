export type UserRole =
  | "CUSTOMER"
  | "ORGANIZER"
  | "STAFF"
  | "ADMIN"
  | "CORPORATE_CLIENT";

export type EventType = string;
export type EventStatus = string;
export type TicketCategoryType = string;
export type BookingStatus = string;
export type PaymentStatus = string;
export type RefundStatus = "ELIGIBLE" | "REQUESTED" | "APPROVED" | "REJECTED" | "PROCESSED";
export type TicketStatus = "ACTIVE" | "USED" | "CANCELLED" | "INVALID";
export type NotificationType = string;
export type ScanResult = "VALID" | "DUPLICATE" | "CANCELLED" | "INVALID";
export type NotificationAudienceScope = "DIRECT" | "EVENT" | "ROLE" | "GLOBAL";
export type CorporateRequestStatus =
  | "submitted"
  | "approved_pending_payment"
  | "rejected"
  | "cancelled"
  | "expired"
  | "paid";

export interface User {
  userId: string;
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  roleCode: UserRole;
  companyName?: string;
  isTwoFactorEnabled: boolean;
  avatarUrl?: string;
  lastLoginAt: string;
  accountStatus: "ACTIVE" | "SUSPENDED";
}

export interface TicketCategory {
  ticketCategoryId: string;
  eventId: string;
  categoryCode: TicketCategoryType;
  displayName: string;
  unitPrice: number;
  currencyCode: string;
  capacity: number;
  availableQuantity: number;
  description: string;
  saleStartDate?: string;
  isInternalUse?: boolean;
}

export interface RefundPolicy {
  refundPolicyId: string;
  eventId?: string;
  title?: string;
  fullRefundWindowHours: number;
  partialRefundWindowHours: number;
  partialRefundPercentage: number;
  policyDescription?: string;
}

export interface Event {
  eventId: string;
  organizerId: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  eventType: EventType;
  status: EventStatus;
  startDateTime: string;
  endDateTime: string;
  venueName: string;
  cityName: string;
  stateName: string;
  bannerImageUrl: string;
  coverTone: string;
  seatCapacity: number;
  publishedAt?: string;
  refundPolicyId: string;
  liveAttendanceCount: number;
  noShowPercentage: number;
  occupancyPercentage: number;
  ticketCategories: TicketCategory[];
  tags: string[];
}

export interface Payment {
  paymentId: string;
  bookingId: string;
  paymentGatewayCode: string;
  amountPaid: number;
  currencyCode: string;
  paymentStatus: PaymentStatus;
  transactionReference: string;
  paidAt: string;
}

export interface Ticket {
  ticketId: string;
  bookingId: string;
  eventId: string;
  ticketCategoryId: string;
  attendeeName: string;
  qrCodeValue: string;
  seatLabel: string;
  ticketStatus: TicketStatus;
  issuedAt: string;
  validatedAt?: string;
}

export interface Booking {
  bookingId: string;
  customerId: string;
  eventId: string;
  bookingStatus: BookingStatus;
  bookingChannel: "WEB" | "CORPORATE";
  quantity: number;
  subtotalAmount: number;
  gstAmount: number;
  totalAmount: number;
  createdAt: string;
  ticketIds: string[];
  paymentId: string;
}

export interface Refund {
  refundId: string;
  bookingId: string;
  refundStatus: RefundStatus;
  eligibleAmount: number;
  approvedAmount: number;
  refundReason: string;
  requestedAt: string;
  processedAt?: string;
}

export interface Expense {
  expenseId: string;
  eventId: string;
  expenseTitle: string;
  amount: number;
  incurredAt?: string;
}

export interface EntryScanLog {
  entryScanLogId: string;
  eventId: string;
  ticketId: string;
  staffUserId: string;
  scannedAt: string;
  scanResult: ScanResult;
  scanChannel: "CAMERA" | "MANUAL";
}

export interface Notification {
  notificationId: string;
  eventId?: string;
  userId?: string;
  notificationType: NotificationType;
  message: string;
  createdAt: string;
  audienceScope?: NotificationAudienceScope;
  audienceRole?: string;
  metadata?: string;
  readAt?: string;
}

export interface OrganizerProfile {
  userId: string;
  orgName: string;
}

export interface CorporateProfile {
  userId: string;
  companyName: string;
  gstNumber: string;
}

export interface StaffEventAssignment {
  assignmentId: string;
  staffUserId: string;
  eventId: string;
  assignedByUserId?: string;
  assignedAt: string;
}

export interface CorporateBookingRequestItem {
  requestItemId: string;
  requestId: string;
  categoryId: string;
  requestedQty: number;
  approvedQty?: number;
  reservedQty: number;
  offeredUnitPrice?: number;
}

export interface CorporateBookingRequest {
  requestId: string;
  corporateUserId: string;
  organizerUserId: string;
  eventId: string;
  status: CorporateRequestStatus;
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
  items: CorporateBookingRequestItem[];
}

export interface EventReportCategory {
  ticketCategoryId: string;
  name: string;
  soldQuantity: number;
  activeTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  revenue: number;
}

export interface EventExpenseBucket {
  expenseId: string;
  label: string;
  amount: number;
}

export interface EventStaffReportSummary {
  assignmentId: string;
  staffUserId: string;
  staffName: string;
  staffEmail: string;
  assignedAt: string;
}

export interface EventReportSummary {
  eventId: string;
  title: string;
  venueName: string;
  startDateTime: string;
  status: string;
  seatCapacity: number;
  ticketsSold: number;
  checkedInCount: number;
  cancelledTickets: number;
  occupancyPercentage: number;
  noShowPercentage: number;
  grossRevenue: number;
  refundedAmount: number;
  totalExpenses?: number;
  netRevenue?: number;
  expenseBuckets?: EventExpenseBucket[];
  assignedStaff?: EventStaffReportSummary[];
  categories: EventReportCategory[];
}

export interface OrganizerReportData {
  organizerId: string;
  generatedAt: string;
  summary: {
    eventCount: number;
    publishedEventCount: number;
    totalBookings: number;
    totalTickets: number;
    checkedInTickets: number;
    cancelledTickets: number;
      grossRevenue: number;
      refundedAmount: number;
      averageOccupancy: number;
      totalExpenses?: number;
      netRevenue?: number;
    };
    events: EventReportSummary[];
  }

export interface ReportRecord {
  reportId: string;
  organizerId: string;
  generatedDate: string;
  data: string;
  parsedData: OrganizerReportData | null;
}

export interface LoginRequestDto {
  emailAddress: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: User;
  requiresTwoFactor: boolean;
}

export interface RegisterCustomerRequestDto {
  fullName: string;
  emailAddress: string;
  phoneNumber: string;
  password: string;
}

export interface CheckoutRequestDto {
  customerId: string;
  eventId: string;
  ticketCategoryId: string;
  quantity: number;
  paymentMethod: string;
}

export interface BulkBookingRequestDto {
  corporateClientId: string;
  eventId: string;
  ticketCategoryId: string;
  quantity: number;
  billingEntityName: string;
}
