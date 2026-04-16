"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers";
import { AttendanceDonutChart } from "@/components/charts/AttendanceDonutChart";
import { OccupancyBarChart } from "@/components/charts/OccupancyBarChart";
import { RevenueAreaChart } from "@/components/charts/RevenueAreaChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { OrganizerReportData } from "@/types/contracts";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatCurrency, formatDateTime, formatPercentage } from "@/utils/format";
import { isInternalUseCategoryName } from "@/utils/ticketing";

const chartWindowSequence = [5, 10, "all"] as const;

const downloadFile = (filename: string, contents: string, mimeType: string) => {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const toCsv = (rows: Array<Record<string, string | number>>) => {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const escapeValue = (value: string | number) => `"${String(value ?? "").replaceAll(`"`, `""`)}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeValue(row[header] ?? "")).join(","))].join("\n");
};

const buildReportText = (data: OrganizerReportData) =>
  [
    `Organizer report`,
    `Generated: ${formatDateTime(data.generatedAt)}`,
    ``,
    `Summary`,
    `Events: ${data.summary.eventCount}`,
    `Bookings: ${data.summary.totalBookings}`,
    `Tickets sold: ${data.summary.totalTickets}`,
    `Checked in: ${data.summary.checkedInTickets}`,
    `Gross revenue: ${formatCurrency(data.summary.grossRevenue)}`,
    `Expenses: ${formatCurrency(data.summary.totalExpenses ?? 0)}`,
    `Net revenue: ${formatCurrency(data.summary.netRevenue ?? data.summary.grossRevenue)}`,
    ``,
    `Events`,
    ...data.events.map((event) =>
      `${event.title} | ${formatDateTime(event.startDateTime)} | Occupancy ${formatPercentage(event.occupancyPercentage)} | Revenue ${formatCurrency(event.grossRevenue)} | Expenses ${formatCurrency(event.totalExpenses ?? 0)} | Net ${formatCurrency(event.netRevenue ?? event.grossRevenue)}`
    )
  ].join("\n");

export function ReportsDashboard() {
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const organizerId = session?.user.userId ?? "u2";
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedReportId, setSelectedReportId] = useState("");
  const [selectedEventFilter, setSelectedEventFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingExpenses, setIsSavingExpenses] = useState(false);
  const [chartWindow, setChartWindow] = useState<(typeof chartWindowSequence)[number]>(5);
  const [selectedAttendanceScope, setSelectedAttendanceScope] = useState("all");
  const [excludeInternalUsage, setExcludeInternalUsage] = useState(true);
  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const { data: reportsData, isLoading, error } = useAsyncResource(() => emtsApi.getReportsByOrganizer(organizerId), [organizerId, refreshKey]);
  const reports = reportsData ?? [];

  useEffect(() => {
    if (!selectedReportId && reports[0]?.reportId) {
      setSelectedReportId(reports[0].reportId);
    }
  }, [reports, selectedReportId]);

  useEffect(() => {
    const requestedEventId = searchParams.get("eventId");
    if (requestedEventId) {
      setSelectedEventFilter(requestedEventId);
    }
  }, [searchParams]);

  const selectedReport = reports.find((report) => report.reportId === selectedReportId) ?? reports[0] ?? null;
  const selectedData = selectedReport?.parsedData ?? null;
  const visibleCategoriesForEvent = (event: OrganizerReportData["events"][number]) =>
    excludeInternalUsage
      ? event.categories.filter((category) => !isInternalUseCategoryName(category.name))
      : event.categories;
  const filteredEvents = useMemo(() => {
    if (!selectedData) {
      return [];
    }

    const sorted = [...selectedData.events]
      .map((event) => {
        const visibleCategories = visibleCategoriesForEvent(event);
        const visibleCapacity = visibleCategories.reduce((sum, category) => sum + category.capacity, 0);
        const visibleSold = visibleCategories.reduce((sum, category) => sum + category.soldQuantity, 0);
        const visibleUsed = visibleCategories.reduce((sum, category) => sum + category.usedTickets, 0);
        const visibleCancelled = visibleCategories.reduce((sum, category) => sum + category.cancelledTickets, 0);

        return {
          ...event,
          seatCapacity: visibleCapacity,
          ticketsSold: visibleSold,
          checkedInCount: visibleUsed,
          cancelledTickets: visibleCancelled,
          grossRevenue: event.grossRevenue,
          netRevenue: event.grossRevenue - (event.totalExpenses ?? 0),
          occupancyPercentage: visibleCapacity > 0 ? (visibleSold / visibleCapacity) * 100 : 0,
          noShowPercentage: visibleSold > 0 ? Math.max(((visibleSold - visibleUsed - visibleCancelled) / visibleSold) * 100, 0) : 0,
          categories: visibleCategories
        };
      })
      .sort((left, right) => new Date(left.startDateTime).getTime() - new Date(right.startDateTime).getTime());

    return selectedEventFilter === "all" ? sorted : sorted.filter((event) => event.eventId === selectedEventFilter);
  }, [excludeInternalUsage, selectedData, selectedEventFilter]);

  const chartEvents =
    chartWindow === "all"
      ? filteredEvents
      : filteredEvents.slice(-chartWindow);

  const selectedExpenseEvent = selectedEventFilter === "all" ? null : filteredEvents[0] ?? null;
  const attendanceScopes = useMemo(() => {
    if (!selectedExpenseEvent) {
      return [{ value: "all", label: "All categories" }];
    }

    return [
      { value: "all", label: "All categories" },
      ...selectedExpenseEvent.categories.map((category) => ({
        value: category.ticketCategoryId,
        label: category.name
      }))
    ];
  }, [selectedExpenseEvent]);

  useEffect(() => {
    if (!attendanceScopes.some((scope) => scope.value === selectedAttendanceScope)) {
      setSelectedAttendanceScope("all");
    }
  }, [attendanceScopes, selectedAttendanceScope]);

  const attendanceBreakdown = useMemo(() => {
    if (selectedExpenseEvent) {
      const selectedCategory =
        selectedAttendanceScope === "all"
          ? null
          : selectedExpenseEvent.categories.find((category) => category.ticketCategoryId === selectedAttendanceScope) ?? null;

      const capacity = selectedCategory
        ? selectedCategory.capacity
        : selectedExpenseEvent.categories.reduce((sum, category) => sum + category.capacity, 0);
      const sold = selectedCategory
        ? selectedCategory.soldQuantity
        : selectedExpenseEvent.categories.reduce((sum, category) => sum + category.soldQuantity, 0);
      const attended = selectedCategory
        ? selectedCategory.usedTickets
        : selectedExpenseEvent.categories.reduce((sum, category) => sum + category.usedTickets, 0);

      return {
        label: selectedCategory ? `${selectedCategory.name} attendance` : "Event attendance",
        capacity,
        sold,
        attended
      };
    }

    const capacity = filteredEvents.reduce((sum, event) => sum + event.seatCapacity, 0);
    const sold = filteredEvents.reduce((sum, event) => sum + event.ticketsSold, 0);
    const attended = filteredEvents.reduce((sum, event) => sum + event.checkedInCount, 0);

    return {
      label: "Attendance across selected events",
      capacity,
      sold,
      attended
    };
  }, [filteredEvents, selectedAttendanceScope, selectedExpenseEvent]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage("");

    try {
      const created = await emtsApi.generateOrganizerReport(organizerId);
      setSelectedReportId(created.reportId);
      setRefreshKey((current) => current + 1);
      setMessage("Report generated.");
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReport) return;
    setIsDeleting(true);
    setMessage("");
    try {
      await emtsApi.deleteReport(selectedReport.reportId);
      setSelectedReportId("");
      setRefreshKey((current) => current + 1);
      setMessage("Report deleted.");
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to delete report.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cycleChartWindow = () => {
    const currentIndex = chartWindowSequence.indexOf(chartWindow);
    setChartWindow(chartWindowSequence[(currentIndex + 1) % chartWindowSequence.length]);
  };

  const exportJson = () => {
    if (!selectedData || !selectedReport) return;
    downloadFile(`report_${selectedReport.reportId}.json`, JSON.stringify(selectedData, null, 2), "application/json");
  };

  const exportText = () => {
    if (!selectedData || !selectedReport) return;
    downloadFile(`report_${selectedReport.reportId}.txt`, buildReportText(selectedData), "text/plain;charset=utf-8");
  };

  const exportEventsCsv = () => {
    if (!selectedData || !selectedReport) return;
    const csv = toCsv(
      filteredEvents.map((event) => ({
        event_name: event.title,
        event_id: event.eventId,
        date: formatDateTime(event.startDateTime),
        venue: event.venueName,
        status: event.status,
        capacity: event.seatCapacity,
        tickets_sold: event.ticketsSold,
        checked_in: event.checkedInCount,
        seats_unsold: Math.max(event.seatCapacity - event.ticketsSold, 0),
        sold_not_attended: Math.max(event.ticketsSold - event.checkedInCount, 0),
        cancelled: event.cancelledTickets,
        occupancy_percent: Number(event.occupancyPercentage.toFixed(0)),
        no_show_percent: Number(event.noShowPercentage.toFixed(0)),
        gross_revenue: event.grossRevenue,
        refunded_amount: event.refundedAmount,
        total_expenses: event.totalExpenses ?? 0,
        net_revenue: event.netRevenue ?? event.grossRevenue
      }))
    );
    downloadFile(`report_${selectedReport.reportId}_events.csv`, csv, "text/csv;charset=utf-8");
  };

  const exportCategoriesCsv = () => {
    if (!selectedData || !selectedReport) return;
    const csv = toCsv(
      filteredEvents.flatMap((event) =>
        event.categories.map((category) => ({
        event_name: event.title,
        event_id: event.eventId,
        category_name: category.name,
        category_id: category.ticketCategoryId,
        category_capacity: category.capacity,
        available_quantity: category.availableQuantity,
        sold: category.soldQuantity,
        active: category.activeTickets,
        used: category.usedTickets,
        sold_not_attended: Math.max(category.soldQuantity - category.usedTickets, 0),
        cancelled: category.cancelledTickets,
        revenue: category.revenue
      }))
      )
    );
    downloadFile(`report_${selectedReport.reportId}_categories.csv`, csv, "text/csv;charset=utf-8");
  };

  const exportStaffCsv = () => {
    if (!selectedData || !selectedReport) return;
    const csv = toCsv(
      selectedData.events.flatMap((event) =>
        (event.assignedStaff ?? []).map((staff) => ({
          event_name: event.title,
          event_id: event.eventId,
          staff_name: staff.staffName,
          staff_email: staff.staffEmail,
          staff_user_id: staff.staffUserId,
          assigned_at: formatDateTime(staff.assignedAt),
          event_checked_in_tickets: event.checkedInCount
        }))
      )
    );
    downloadFile(`report_${selectedReport.reportId}_staff.csv`, csv, "text/csv;charset=utf-8");
  };

  const saveExpenses = async (nextData: OrganizerReportData) => {
    if (!selectedReport) return;
    setIsSavingExpenses(true);
    setMessage("");
    try {
      await emtsApi.updateReport(selectedReport.reportId, nextData, selectedReport.generatedDate);
      setRefreshKey((current) => current + 1);
      setMessage("Expenses updated.");
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to save expenses.");
    } finally {
      setIsSavingExpenses(false);
    }
  };

  const addExpenseBucket = async () => {
    if (!selectedData || !selectedExpenseEvent) return;
    const amount = Number(expenseAmount);
    if (!expenseLabel.trim() || !Number.isFinite(amount) || amount < 0) {
      setMessage("Enter a valid expense label and amount.");
      return;
    }

    const nextEvents = selectedData.events.map((event) =>
      event.eventId === selectedExpenseEvent.eventId
        ? {
            ...event,
            expenseBuckets: [
              ...(event.expenseBuckets ?? []),
              {
                expenseId: `${event.eventId}-${Date.now()}`,
                label: expenseLabel.trim(),
                amount
              }
            ]
          }
        : event
    ).map((event) => {
      const totalExpenses = (event.expenseBuckets ?? []).reduce((sum, bucket) => sum + bucket.amount, 0);
      return {
        ...event,
        totalExpenses,
        netRevenue: event.grossRevenue - totalExpenses
      };
    });

    const nextData: OrganizerReportData = {
      ...selectedData,
      events: nextEvents,
      summary: {
        ...selectedData.summary,
        totalExpenses: nextEvents.reduce((sum, event) => sum + (event.totalExpenses ?? 0), 0),
        netRevenue: nextEvents.reduce((sum, event) => sum + (event.netRevenue ?? event.grossRevenue), 0)
      }
    };

    await saveExpenses(nextData);
    setExpenseLabel("");
    setExpenseAmount("");
  };

  const removeExpenseBucket = async (expenseId: string) => {
    if (!selectedData || !selectedExpenseEvent) return;

    const nextEvents = selectedData.events.map((event) =>
      event.eventId === selectedExpenseEvent.eventId
        ? {
            ...event,
            expenseBuckets: (event.expenseBuckets ?? []).filter((bucket) => bucket.expenseId !== expenseId)
          }
        : event
    ).map((event) => {
      const totalExpenses = (event.expenseBuckets ?? []).reduce((sum, bucket) => sum + bucket.amount, 0);
      return {
        ...event,
        totalExpenses,
        netRevenue: event.grossRevenue - totalExpenses
      };
    });

    const nextData: OrganizerReportData = {
      ...selectedData,
      events: nextEvents,
      summary: {
        ...selectedData.summary,
        totalExpenses: nextEvents.reduce((sum, event) => sum + (event.totalExpenses ?? 0), 0),
        netRevenue: nextEvents.reduce((sum, event) => sum + (event.netRevenue ?? event.grossRevenue), 0)
      }
    };

    await saveExpenses(nextData);
  };

  return (
    <div className="grid">
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="eyebrow">Reports</div>
            <h2 className="section-title">Organizer reports</h2>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate report"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleDelete} disabled={!selectedReport || isDeleting}>
              {isDeleting ? "Deleting..." : "Delete report"}
            </Button>
          </div>
        </div>
        {error && <div className="badge">{error}</div>}
        {message && <div className="badge">{message}</div>}
        {isLoading && reports.length === 0 ? (
          <div className="muted">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="muted">No reports yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Generated</th>
                <th>Events</th>
                <th>Revenue</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.reportId}>
                  <td className="mono">{report.reportId}</td>
                  <td>{formatDateTime(report.generatedDate)}</td>
                  <td>{report.parsedData?.summary.eventCount ?? 0}</td>
                  <td>{formatCurrency(report.parsedData?.summary.grossRevenue ?? 0)}</td>
                  <td>
                    <button type="button" onClick={() => setSelectedReportId(report.reportId)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--accent)" }}>
                      {selectedReportId === report.reportId ? "Viewing" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {selectedData && (
        <>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div className="eyebrow">Exports</div>
                <h3 style={{ margin: "6px 0" }}>Download this report</h3>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button type="button" variant="secondary" onClick={exportJson}>JSON</Button>
                <Button type="button" variant="secondary" onClick={exportText}>Text</Button>
                <Button type="button" variant="secondary" onClick={exportEventsCsv}>Events CSV</Button>
                <Button type="button" variant="secondary" onClick={exportCategoriesCsv}>Categories CSV</Button>
                <Button type="button" variant="secondary" onClick={exportStaffCsv}>Staff CSV</Button>
              </div>
            </div>
          </Card>

          <div className="metrics-grid">
            <Card>
              <div className="eyebrow">Summary</div>
              <h3 style={{ marginBottom: 6 }}>Gross revenue</h3>
              <strong>{formatCurrency(selectedData.summary.grossRevenue)}</strong>
            </Card>
            <Card>
              <div className="eyebrow">Summary</div>
              <h3 style={{ marginBottom: 6 }}>Expenses</h3>
              <strong>{formatCurrency(selectedData.summary.totalExpenses ?? 0)}</strong>
            </Card>
            <Card>
              <div className="eyebrow">Summary</div>
              <h3 style={{ marginBottom: 6 }}>Net revenue</h3>
              <strong>{formatCurrency(selectedData.summary.netRevenue ?? selectedData.summary.grossRevenue)}</strong>
            </Card>
            <Card>
              <div className="eyebrow">Summary</div>
              <h3 style={{ marginBottom: 6 }}>Average occupancy</h3>
              <strong>{formatPercentage(selectedData.summary.averageOccupancy)}</strong>
            </Card>
          </div>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div className="eyebrow">View</div>
                <h3 style={{ margin: "6px 0" }}>Report filters</h3>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <select className="select" value={selectedEventFilter} onChange={(event) => setSelectedEventFilter(event.target.value)} style={{ minWidth: 240 }}>
                  <option value="all">All events</option>
                  {[...selectedData.events]
                    .sort((left, right) => new Date(left.startDateTime).getTime() - new Date(right.startDateTime).getTime())
                    .map((event) => (
                    <option key={event.eventId} value={event.eventId}>
                      {event.title}
                    </option>
                  ))}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={excludeInternalUsage} onChange={(event) => setExcludeInternalUsage(event.target.checked)} />
                  <span className="muted">Exclude internal/staff</span>
                </label>
                <Button type="button" variant="secondary" onClick={cycleChartWindow}>
                  Charts: {chartWindow === "all" ? "All" : `Last ${chartWindow}`}
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Card>
              <div className="eyebrow">Revenue</div>
              <h3 style={{ marginBottom: 6 }}>Revenue by event</h3>
              <RevenueAreaChart
                data={chartEvents.map((event) => ({
                  label: event.title.length > 12 ? `${event.title.slice(0, 12)}...` : event.title,
                  fullLabel: event.title,
                  value: event.grossRevenue
                }))}
              />
            </Card>
            <Card>
              <div className="eyebrow">Occupancy</div>
              <h3 style={{ marginBottom: 6 }}>Occupancy by event</h3>
              <OccupancyBarChart
                data={chartEvents.map((event) => ({
                  label: event.title.length > 12 ? `${event.title.slice(0, 12)}...` : event.title,
                  fullLabel: event.title,
                  value: Number(event.occupancyPercentage.toFixed(1))
                }))}
              />
            </Card>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Card>
              <div className="eyebrow">Attendance</div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                <h3 style={{ marginBottom: 0 }}>Attendance against capacity</h3>
                <select
                  className="select"
                  value={selectedAttendanceScope}
                  onChange={(event) => setSelectedAttendanceScope(event.target.value)}
                  disabled={!selectedExpenseEvent}
                  style={{ minWidth: 220 }}
                >
                  {attendanceScopes.map((scope) => (
                    <option key={scope.value} value={scope.value}>
                      {scope.label}
                    </option>
                  ))}
                </select>
              </div>
              <AttendanceDonutChart
                capacity={attendanceBreakdown.capacity}
                sold={attendanceBreakdown.sold}
                attended={attendanceBreakdown.attended}
                centerLabel="Attended / Capacity"
                centerValue={`${attendanceBreakdown.attended} / ${attendanceBreakdown.capacity}`}
              />
              <div className="details-list" style={{ marginTop: 8 }}>
                <div className="details-row">
                  <div className="details-key">View</div>
                  <div className="details-value">{attendanceBreakdown.label}</div>
                </div>
                <div className="details-row">
                  <div className="details-key">Capacity</div>
                  <div className="details-value">{attendanceBreakdown.capacity}</div>
                </div>
                <div className="details-row">
                  <div className="details-key">Sold</div>
                  <div className="details-value">{attendanceBreakdown.sold}</div>
                </div>
                <div className="details-row">
                  <div className="details-key">Attended</div>
                  <div className="details-value">{attendanceBreakdown.attended}</div>
                </div>
              </div>
            </Card>
            <Card>
              <div className="eyebrow">Events</div>
              <h3 style={{ marginBottom: 16 }}>Reported events</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Occupancy</th>
                    <th>Revenue</th>
                    <th>Expenses</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.eventId}>
                      <td>{event.title}</td>
                      <td>{formatDateTime(event.startDateTime)}</td>
                      <td>{formatPercentage(Number(event.occupancyPercentage.toFixed(1)))}</td>
                      <td>{formatCurrency(event.grossRevenue)}</td>
                      <td>{formatCurrency(event.totalExpenses ?? 0)}</td>
                      <td>{formatCurrency(event.netRevenue ?? event.grossRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {selectedExpenseEvent && (
            <Card>
              <div className="eyebrow">Expenses</div>
              <h3 style={{ marginBottom: 16 }}>Expense tracker for {selectedExpenseEvent.title}</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Bucket</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedExpenseEvent.expenseBuckets ?? []).map((bucket) => (
                    <tr key={bucket.expenseId}>
                      <td>{bucket.label}</td>
                      <td>{formatCurrency(bucket.amount)}</td>
                      <td>
                        <button type="button" onClick={() => removeExpenseBucket(bucket.expenseId)} style={{ background: "none", border: 0, color: "var(--danger)", cursor: "pointer" }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(selectedExpenseEvent.expenseBuckets ?? []).length === 0 && (
                    <tr>
                      <td colSpan={3} className="muted">No expenses added yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 180px auto", gap: 12, marginTop: 16 }}>
                <input className="input" value={expenseLabel} onChange={(event) => setExpenseLabel(event.target.value)} placeholder="Expense bucket" />
                <input className="input" type="number" min={0} step="0.01" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} placeholder="Amount" />
                <Button type="button" onClick={addExpenseBucket} disabled={isSavingExpenses}>
                  {isSavingExpenses ? "Saving..." : "Add expense"}
                </Button>
              </div>
            </Card>
          )}

          <Card>
            <div className="eyebrow">Category Breakdown</div>
            <h3 style={{ marginBottom: 16 }}>Revenue and attendance by ticket category</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Category</th>
                  <th>Capacity</th>
                  <th>Sold</th>
                  <th>Used</th>
                  <th>Sold not attended</th>
                  <th>Cancelled</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.flatMap((event) =>
                  event.categories.map((category) => (
                    <tr key={`${event.eventId}-${category.ticketCategoryId}`}>
                      <td>{event.title}</td>
                      <td>{category.name}</td>
                      <td>{category.capacity}</td>
                      <td>{category.soldQuantity}</td>
                      <td>{category.usedTickets}</td>
                      <td>{Math.max(category.soldQuantity - category.usedTickets, 0)}</td>
                      <td>{category.cancelledTickets}</td>
                      <td>{formatCurrency(category.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          <Card>
            <div className="eyebrow">Staff Assignments</div>
            <h3 style={{ marginBottom: 16 }}>Assigned staff by event</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Staff</th>
                  <th>Email</th>
                  <th>Assigned</th>
                  <th>Checked in at event</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.flatMap((event) =>
                  (event.assignedStaff ?? []).map((staff) => (
                    <tr key={`${event.eventId}-${staff.assignmentId}`}>
                      <td>{event.title}</td>
                      <td>{staff.staffName}</td>
                      <td>{staff.staffEmail}</td>
                      <td>{formatDateTime(staff.assignedAt)}</td>
                      <td>{event.checkedInCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
