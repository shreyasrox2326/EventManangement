"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/app/providers";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { emtsApi } from "@/services/live-api";
import { useAsyncResource } from "@/services/use-async-resource";
import { User, UserRole } from "@/types/contracts";

const roleOptions: UserRole[] = ["CUSTOMER", "ORGANIZER", "STAFF", "ADMIN", "CORPORATE_CLIENT"];

type SearchField = "fullName" | "emailAddress" | "phoneNumber" | "userId";
type MatchMode = "contains" | "exact";
type RoleFilter = UserRole | "ALL";

const fieldLabels: Record<SearchField, string> = {
  fullName: "Name",
  emailAddress: "Email",
  phoneNumber: "Phone",
  userId: "User ID"
};

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  ORGANIZER: "Organizer",
  STAFF: "Staff",
  ADMIN: "Admin",
  CORPORATE_CLIENT: "Corporate Client"
};

const userDetailPillStyle = {
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  width: "100%"
} as const;

const userDetailValueStyle = {
  flex: "1 1 180px",
  minWidth: 0,
  overflowWrap: "anywhere",
  textAlign: "right"
} as const;

function matchesUser(user: User, field: SearchField, query: string, matchMode: MatchMode) {
  const value = String(user[field] ?? "").trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return false;
  }

  return matchMode === "exact" ? value === normalizedQuery : value.includes(normalizedQuery);
}

export function UserManagementPage() {
  const { session } = useAuth();
  const currentUserId = session?.user.userId ?? "";
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [searchField, setSearchField] = useState<SearchField>("emailAddress");
  const [matchMode, setMatchMode] = useState<MatchMode>("contains");
  const [showAll, setShowAll] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [submittedField, setSubmittedField] = useState<SearchField>("emailAddress");
  const [submittedMatchMode, setSubmittedMatchMode] = useState<MatchMode>("contains");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [submittedRoleFilter, setSubmittedRoleFilter] = useState<RoleFilter>("ALL");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [pendingRole, setPendingRole] = useState<UserRole>("CUSTOMER");
  const [isUpdatingUserId, setIsUpdatingUserId] = useState<string | null>(null);
  const { data, isLoading, error } = useAsyncResource(
    () => {
      if (!showAll && !submittedQuery.trim()) {
        return Promise.resolve([]);
      }
      return emtsApi.searchUsers({
        query: submittedQuery,
        roleCode: submittedRoleFilter === "ALL" ? undefined : submittedRoleFilter,
        size: showAll ? 100 : 50
      });
    },
    [refreshKey, showAll, submittedQuery, submittedRoleFilter]
  );

  const users = useMemo(
    () => (data ?? []).filter((user) => user.userId !== currentUserId),
    [currentUserId, data]
  );

  const results = useMemo(() => {
    if (!submittedQuery.trim()) {
      return users;
    }
    return users.filter((user) => matchesUser(user, submittedField, submittedQuery, submittedMatchMode));
  }, [submittedField, submittedMatchMode, submittedQuery, users]);

  const selectedUser = useMemo(
    () => results.find((user) => user.userId === selectedUserId) ?? null,
    [results, selectedUserId]
  );

  useEffect(() => {
    if (!selectedUser && results[0]) {
      setSelectedUserId(results[0].userId);
      setPendingRole(results[0].roleCode);
      return;
    }

    if (selectedUser) {
      setPendingRole(selectedUser.roleCode);
    }
  }, [results, selectedUser]);

  const handleSearch = () => {
    setShowAll(false);
    setSubmittedQuery(query);
    setSubmittedField(searchField);
    setSubmittedMatchMode(matchMode);
    setSubmittedRoleFilter(roleFilter);
    setMessage("");
  };

  const handleShowAll = () => {
    setShowAll(true);
    setSubmittedQuery("");
    setSubmittedRoleFilter(roleFilter);
    setMessage("");
  };

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.userId);
    setPendingRole(user.roleCode);
    setMessage("");
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) {
      return;
    }

    setIsUpdatingUserId(selectedUser.userId);
    setMessage("");

    try {
      await emtsApi.updateUserRole(selectedUser.userId, pendingRole);
      setMessage("Role updated successfully. The user will receive a notification.");
      setRefreshKey((current) => current + 1);
    } catch (nextError) {
      setMessage(nextError instanceof Error ? nextError.message : "Unable to update user role.");
    } finally {
      setIsUpdatingUserId(null);
    }
  };

  return (
    <div className="grid">
      <Card style={{ padding: 24 }}>
        <div className="eyebrow">Manage Users</div>
        <h2 className="section-title">Find an account, then assign its role</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Search by exact or partial match, open the user record, and change the assigned role there.
        </p>

        <div className="grid" style={{ gridTemplateColumns: "minmax(0, 2fr) repeat(2, minmax(0, 1fr))", gap: 14, marginTop: 18 }}>
          <label>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Search
            </div>
            <input
              className="input"
              placeholder="Enter name, email, phone, or user ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Search Field
            </div>
            <select className="select" value={searchField} onChange={(event) => setSearchField(event.target.value as SearchField)}>
              {Object.entries(fieldLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Match Mode
            </div>
            <select className="select" value={matchMode} onChange={(event) => setMatchMode(event.target.value as MatchMode)}>
              <option value="contains">Contains</option>
              <option value="exact">Exact</option>
            </select>
          </label>
          <label>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Role Filter
            </div>
            <select className="select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}>
              <option value="ALL">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
          <Button type="button" onClick={handleSearch}>
            <Search size={16} />
            Search users
          </Button>
          <Button type="button" variant="secondary" onClick={handleShowAll}>
            <Users size={16} />
            Show all
          </Button>
        </div>
      </Card>

      {error && <div className="badge" style={{ color: "var(--danger)" }}>{error}</div>}
      {message && <div className="badge">{message}</div>}

      <div className="two-column">
        <Card style={{ padding: 24 }}>
          <div className="eyebrow">{showAll ? "All Users" : "Search Results"}</div>
          <h3 style={{ margin: "8px 0 16px" }}>
            {showAll
              ? `${results.length} account${results.length === 1 ? "" : "s"}`
              : submittedQuery.trim()
                ? `${results.length} match${results.length === 1 ? "" : "es"}`
                : "Run a search to see matching accounts"}
          </h3>

          {isLoading && <p className="muted">Loading live users...</p>}

          <div className="grid" style={{ gap: 12 }}>
            {results.map((user) => {
              const isSelected = user.userId === selectedUserId;
              return (
                <button
                  key={user.userId}
                  type="button"
                  className="card"
                  onClick={() => handleSelectUser(user)}
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    textAlign: "left",
                    cursor: "pointer",
                    color: "var(--text)",
                    borderColor: isSelected ? "var(--accent-admin)" : "var(--line)",
                    background: isSelected ? "color-mix(in srgb, var(--accent-admin) 10%, var(--surface-strong))" : undefined
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{user.fullName}</div>
                      <div className="muted" style={{ marginTop: 4 }}>{user.emailAddress}</div>
                    </div>
                    <div className="badge">{roleLabels[user.roleCode]}</div>
                  </div>
                  <div className="muted" style={{ marginTop: 10, fontSize: "0.92rem" }}>
                    {user.phoneNumber} · {user.userId}
                  </div>
                </button>
              );
            })}

            {!isLoading && results.length === 0 && (
              <div className="card" style={{ padding: 18, borderRadius: 18 }}>
                <div className="muted">
                  {showAll
                    ? "No users are available."
                    : "No users matched your search."}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <div className="eyebrow">User Details</div>
          <h3 style={{ margin: "8px 0 16px" }}>Open a result to manage its role</h3>

          {!selectedUser && <p className="muted">Select a user from the results list to view details and assign a role.</p>}

          {selectedUser && (
            <div className="grid" style={{ gap: 14 }}>
              <div className="pill" style={userDetailPillStyle}>
                <span>Name</span>
                <strong style={userDetailValueStyle}>{selectedUser.fullName}</strong>
              </div>
              <div className="pill" style={userDetailPillStyle}>
                <span>Email</span>
                <strong style={userDetailValueStyle}>{selectedUser.emailAddress}</strong>
              </div>
              <div className="pill" style={userDetailPillStyle}>
                <span>Phone</span>
                <strong style={userDetailValueStyle}>{selectedUser.phoneNumber}</strong>
              </div>
              <div className="pill" style={userDetailPillStyle}>
                <span>User ID</span>
                <strong style={userDetailValueStyle}>{selectedUser.userId}</strong>
              </div>

              <label>
                <div className="eyebrow" style={{ marginBottom: 8 }}>
                  Assigned Role
                </div>
                <select className="select" value={pendingRole} onChange={(event) => setPendingRole(event.target.value as UserRole)}>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="card" style={{ padding: 16, borderRadius: 18 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--accent-admin)", fontWeight: 700 }}>
                  <ShieldCheck size={18} />
                  Role change notification
                </div>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Updating this role will notify the user through the notifications system.
                </p>
              </div>

              <Button
                type="button"
                disabled={isUpdatingUserId === selectedUser.userId || pendingRole === selectedUser.roleCode}
                onClick={handleUpdateRole}
              >
                {isUpdatingUserId === selectedUser.userId ? "Updating..." : "Update role"}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
