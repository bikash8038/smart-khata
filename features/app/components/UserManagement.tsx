"use client";

import React, { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import type { UserProfile } from "../types/workspace";

interface UserManagementProps {
  user: User;
  locale: "en" | "ne";
  t: Record<string, string>;
  currentUserRole: "admin" | "super_admin";
}

export function UserManagement({ user, locale, t, currentUserRole }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const loadUsers = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setUsers((data ?? []) as UserProfile[]);
    } catch {
      setNotice({
        text: locale === "ne" ? "प्रयोगकर्ता विवरणहरू लोड गर्न सकिएन।" : "Failed to load user profiles.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (targetUserId: string, newRole: "user" | "admin" | "super_admin") => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      // 1. Call RPC function to update user role
      const { error: rpcError } = await supabase.rpc("update_user_role", {
        target_user_id: targetUserId,
        new_role: newRole,
      });

      if (rpcError) throw rpcError;

      // 2. Insert audit log manually
      await supabase.from("admin_audit_logs").insert({
        actor_id: user.id,
        action: "update_role",
        target_type: "profile",
        target_id: targetUserId,
        metadata: { new_role: newRole },
      });

      // 3. Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );

      setNotice({
        text: t.userRoleUpdated || "User role updated successfully.",
        type: "success",
      });
    } catch (err: any) {
      setNotice({
        text: t.errorRoleUpdate || "Failed to update user role.",
        type: "error",
      });
    }
  };

  // Clear notice after 3 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredUsers = users.filter((u) => {
    const term = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (u.full_name ?? "").toLowerCase().includes(term) ||
      (u.email ?? "").toLowerCase().includes(term);

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale === "ne" ? "ne-NP" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="user-management-section">
      {notice && (
        <div className={`workspace-notice ${notice.type === "error" ? "error-notice" : ""}`}>
          <span className="notice-text">{notice.text}</span>
          <button type="button" className="notice-close" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="transaction-toolbar user-management-toolbar">
        <div className="search-input-wrapper">
          <svg className="toolbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={t.searchUsers || "Search users by name or email..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear-button" onClick={() => setSearchQuery("")}>
              {locale === "ne" ? "हटाउनुहोस्" : "Clear"}
            </button>
          )}
        </div>

        <div className="filter-select-wrapper">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">{t.allRoles || "All Roles"}</option>
            <option value="user">{locale === "ne" ? "प्रयोगकर्ता" : "User"}</option>
            <option value="admin">{locale === "ne" ? "एडमिन" : "Admin"}</option>
            <option value="super_admin">{locale === "ne" ? "सुपर एडमिन" : "Super Admin"}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="page-skeleton">
          <p>{locale === "ne" ? "प्रयोगकर्ता सूची लोड हुँदैछ..." : "Loading user directory..."}</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <p>{t.noUsersFound || "No users matched the criteria."}</p>
        </div>
      ) : (
        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>{t.fullName || "Full Name"}</th>
                <th>{t.emailLabel || "Email"}</th>
                <th>{t.role || "Role"}</th>
                <th>{t.joinedDate || "Joined Date"}</th>
                {currentUserRole === "super_admin" && <th>{t.actions || "Actions"}</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((profile) => (
                <tr key={profile.id} className={profile.id === user.id ? "current-user-row" : ""}>
                  <td className="user-name-cell">
                    <strong>{profile.full_name || (locale === "ne" ? "नाम नभएको" : "Unnamed User")}</strong>
                    {profile.id === user.id && <span className="current-user-badge">{locale === "ne" ? "तपाईं" : "You"}</span>}
                  </td>
                  <td>{profile.email || "-"}</td>
                  <td>
                    <span className={`user-role-badge ${profile.role}`}>
                      {profile.role === "super_admin"
                        ? (locale === "ne" ? "सुपर एडमिन" : "Super Admin")
                        : profile.role === "admin"
                        ? (locale === "ne" ? "एडमिन" : "Admin")
                        : (locale === "ne" ? "प्रयोगकर्ता" : "User")}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(profile.created_at)}</td>
                  {currentUserRole === "super_admin" && (
                    <td className="actions-cell">
                      {profile.id !== user.id ? (
                        <div className="role-actions-dropdown">
                          <select
                            value={profile.role}
                            aria-label={t.role}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value as any)}
                          >
                            <option value="user">{t.demoteUser || "Make User"}</option>
                            <option value="admin">{t.promoteAdmin || "Make Admin"}</option>
                            <option value="super_admin">{t.promoteSuperAdmin || "Make Super Admin"}</option>
                          </select>
                        </div>
                      ) : (
                        <span className="no-actions-text">{locale === "ne" ? "परिवर्तन गर्न नमिल्ने" : "Cannot edit self"}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
