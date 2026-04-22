"use client";

import { Download, LockKeyhole, Settings2, UserCog } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { useAuth } from "@/app/providers";

export function AdminDashboard() {
  const { session } = useAuth();
  const adminUserId = session?.user.userId ?? "";
  const { data: usersData } = useAsyncResource(() => emtsApi.getUsers(), []);
  const { data: reportsData } = useAsyncResource(() => emtsApi.getReports(), []);
  const { data: eventsData } = useAsyncResource(() => emtsApi.getEvents(), []);
  const { data: notificationsData } = useAsyncResource(
    () => (adminUserId ? emtsApi.getNotificationCountForUser(adminUserId) : Promise.resolve({ total: 0, unread: 0 })),
    [adminUserId]
  );
  const users = usersData ?? [];
  const reports = reportsData ?? [];
  const events = eventsData ?? [];
  const notificationCount = notificationsData?.total ?? 0;

  return (
    <div className="grid">
      <SectionHeader
        eyebrow="Admin Control Panel"
        title="Platform supervision and access oversight"
        description="This dashboard now reflects only the backend entities that actually exist: users, events, reports, and notifications."
      />
      <div className="metrics-grid">
        <StatCard label="Users" value={`${users.length}`} caption="Live users loaded from the backend" icon={<UserCog size={20} />} />
        <StatCard label="Events" value={`${events.length}`} caption="Total events currently stored" icon={<Settings2 size={20} />} />
        <StatCard label="Reports" value={`${reports.length}`} caption="Organizer reports persisted as JSON" icon={<Download size={20} />} />
        <StatCard label="Notifications" value={`${notificationCount}`} caption="Notifications visible to this admin" icon={<LockKeyhole size={20} />} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <Card>
          <div className="eyebrow">Role Distribution</div>
          <div className="grid">
            {["CUSTOMER", "ORGANIZER", "STAFF", "ADMIN", "CORPORATE_CLIENT"].map((role) => (
              <div key={role} className="pill" style={{ justifyContent: "space-between" }}>
                <span>{role}</span>
                <strong>{users.filter((user) => user.roleCode === role).length}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="eyebrow">Backend Coverage</div>
          <div className="grid">
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>User management</span>
              <strong>Available</strong>
            </div>
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>Event deletion and creation</span>
              <strong>Available</strong>
            </div>
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>Event update</span>
              <strong>Not exposed</strong>
            </div>
            <div className="pill" style={{ justifyContent: "space-between" }}>
              <span>JDBC auth / OTP</span>
              <strong>Pending</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
