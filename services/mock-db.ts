import users from "@/mock-data/users.json";
import events from "@/mock-data/events.json";
import bookings from "@/mock-data/bookings.json";
import payments from "@/mock-data/payments.json";
import tickets from "@/mock-data/tickets.json";
import refunds from "@/mock-data/refunds.json";
import notifications from "@/mock-data/notifications.json";
import entryScanLogs from "@/mock-data/entry-scan-logs.json";
import expenses from "@/mock-data/expenses.json";
import refundPolicies from "@/mock-data/refund-policies.json";
import {
  Booking,
  EntryScanLog,
  Event,
  Expense,
  Notification,
  Payment,
  Refund,
  RefundPolicy,
  Ticket,
  User
} from "@/types/contracts";

export const mockDb = {
  users: users as unknown as User[],
  events: events as unknown as Event[],
  bookings: bookings as unknown as Booking[],
  payments: payments as unknown as Payment[],
  tickets: tickets as unknown as Ticket[],
  refunds: refunds as unknown as Refund[],
  notifications: notifications as unknown as Notification[],
  entryScanLogs: entryScanLogs as unknown as EntryScanLog[],
  expenses: expenses as unknown as Expense[],
  refundPolicies: refundPolicies as unknown as RefundPolicy[]
};
