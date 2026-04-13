"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { formatDateTime } from "@/utils/format";

export function NotificationsCenter() {
  const { session } = useAuth();
  const userId = session?.user.userId ?? "";
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const { data, isLoading } = useAsyncResource(() => emtsApi.getNotificationsForUser(userId), [userId, refreshKey]);
  const notifications = data ?? [];

  const markOneAsRead = async (notificationId: string) => {
    if (!userId) return;
    await emtsApi.markNotificationAsRead(notificationId, userId);
    setRefreshKey((current) => current + 1);
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    await emtsApi.markAllNotificationsAsRead(userId);
    setMessage("All notifications marked as read.");
    setRefreshKey((current) => current + 1);
  };

  return (
    <Card>
      <div className="eyebrow">Notifications</div>
      <h2 className="section-title">Updates visible to your account</h2>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <p className="muted" style={{ margin: 0 }}>
          Direct alerts, role updates, event notices, and general announcements appear here.
        </p>
        <Button type="button" variant="secondary" onClick={markAllAsRead} disabled={notifications.length === 0}>
          Mark all as read
        </Button>
      </div>
      {isLoading && <p className="muted">Loading notifications...</p>}
      {message && <div className="badge">{message}</div>}
      <div className="grid">
        {notifications.map((notification) => (
          <div key={notification.notificationId} className="card" style={{ padding: 18, borderRadius: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <h3 style={{ margin: "0 0 6px" }}>{notification.eventId ?? "General notification"}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  {notification.message}
                </p>
              </div>
              <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
                <div className="badge">{notification.notificationType}</div>
                {!notification.readAt && (
                  <Button type="button" variant="secondary" onClick={() => markOneAsRead(notification.notificationId)}>
                    Mark read
                  </Button>
                )}
              </div>
            </div>
            <div className="muted" style={{ marginTop: 12 }}>
              {formatDateTime(notification.createdAt)}
              {notification.readAt ? ` · Read ${formatDateTime(notification.readAt)}` : ""}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
