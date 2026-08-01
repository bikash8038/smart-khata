/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";

interface ProfileSettingsProps {
  user: User;
  locale: "en" | "ne";
  t: Record<string, string>;
  onSignOut: () => void;
}

export function ProfileSettings({ user, locale, t, onSignOut }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "security">("details");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState(user.email ?? "");
  const [role, setRole] = useState("user");
  const [joinedDate, setJoinedDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [isVerified, setIsVerified] = useState(false);
  const [scheduledDeletionDate, setScheduledDeletionDate] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // File Upload State
  const [selectedFileName, setSelectedFileName] = useState("");

  // Delete account confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmDeletePassword, setConfirmDeletePassword] = useState("");
  const [confirmDeletePasswordVisible, setConfirmDeletePasswordVisible] = useState(false);
  const [savingDeletion, setSavingDeletion] = useState(false);

  const loadProfile = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);

    try {
      // Robust select query checking if extra columns are supported
      let result = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at, username, avatar_url, is_verified, status, scheduled_deletion_date")
        .eq("id", user.id)
        .single();

      if (result.error && result.error.code === "42703") {
        // Fallback to basic columns if migration 0009 hasn't run yet
        const fallbackResult = await supabase
          .from("profiles")
          .select("id, full_name, role, created_at")
          .eq("id", user.id)
          .single();

        if (fallbackResult.error) throw fallbackResult.error;

        const fallbackProfile = fallbackResult.data;
        result = {
          data: {
            id: fallbackProfile.id,
            full_name: fallbackProfile.full_name,
            role: fallbackProfile.role,
            created_at: fallbackProfile.created_at,
            email: user.email,
            username: user.email?.split("@")[0] || "user",
            avatar_url: "",
            is_verified: false,
            status: "Active",
            scheduled_deletion_date: null,
          },
          error: null,
        } as unknown as typeof result;
      } else if (result.error) {
        throw result.error;
      }

      const profile = result.data;
      if (profile) {
        setFullName(profile.full_name || "");
        setUsername(profile.username || "");
        setAvatarUrl(profile.avatar_url || "");
        setEmail(profile.email || user.email || "");
        setRole(profile.role || "user");
        setJoinedDate(profile.created_at || "");
        setStatus(profile.status || "Active");
        setIsVerified(!!profile.is_verified);
        setScheduledDeletionDate(profile.scheduled_deletion_date || null);
      }
    } catch {
      setNotice({
        text: locale === "ne" ? "प्रोफाइल लोड गर्न असफल भयो।" : "Failed to load profile settings.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    // Convert file to Base64 to store in database safely
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSavingDetails(true);
    const usernameRegex = /^[a-z0-9._]+$/;
    if (username && !usernameRegex.test(username)) {
      setNotice({
        text: locale === "ne"
          ? "युजरनेममा साना अंग्रेजी अक्षर, अंक, थोप्लो (.) र अन्डरस्कोर (_) मात्र राख्न मिल्छ।"
          : "Username can only contain lowercase letters, numbers, dot (.) and underscore (_).",
        type: "error",
      });
      setSavingDetails(false);
      return;
    }

    try {

      // Check if username and avatar_url can be updated
      // We try updating the full schema, and fallback to just full_name if it errors out
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) {
        const isSchemaMismatch = error.code === "42703" || 
                                 error.code?.includes("PGRST") || 
                                 error.message?.includes("avatar_url") || 
                                 error.message?.includes("schema cache");

        if (isSchemaMismatch) {
          // Fallback update
          const fallback = await supabase
            .from("profiles")
            .update({
              full_name: fullName,
            })
            .eq("id", user.id);

          if (fallback.error) throw fallback.error;

          // Update auth user metadata
          await supabase.auth.updateUser({
            data: { full_name: fullName },
          });

          setNotice({
            text: locale === "ne"
              ? "पूरा नाम सुरक्षित भयो। युजरनेम र तस्बिर परिवर्तन गर्न कृपया Supabase SQL Editor मा नयाँ माइग्रेसन (0009) रन गर्नुहोस्।"
              : "Full name updated. Please run the SQL migration (0009) in your Supabase SQL Editor to enable usernames and profile pictures.",
            type: "error",
          });
          return;
        } else {
          throw error;
        }
      }

      // Also update auth user metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl },
      });

      setNotice({
        text: t.saveSuccess || "Profile updated successfully.",
        type: "success",
      });
    } catch (err) {
      const error = err as Error;
      setNotice({
        text: error.message || (locale === "ne" ? "अपडेट गर्न असफल भयो।" : "Failed to update profile details."),
        type: "error",
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setNotice({
        text: locale === "ne" ? "नयाँ पासवर्डहरू मेल खाएनन्।" : "New passwords do not match.",
        type: "error",
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setNotice({
        text: t.passwordChangeSuccess || "Password changed successfully.",
        type: "success",
      });
    } catch (err) {
      const error = err as Error;
      setNotice({
        text: error.message || (t.passwordChangeError || "Failed to change password."),
        type: "error",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSavingDeletion(true);
    try {
      // 1. Validate user password by attempting to sign in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: confirmDeletePassword,
      });

      if (authError) {
        setNotice({
          text: t.incorrectPassword || "Incorrect password. Please try again.",
          type: "error",
        });
        setSavingDeletion(false);
        return;
      }

      // 2. Password is valid. Schedule deletion
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          status: "Pending Deletion",
          scheduled_deletion_date: deletionDate.toISOString(),
        })
        .eq("id", user.id);

      if (dbError) throw dbError;

      setIsDeleteModalOpen(false);
      setConfirmDeletePassword("");
      alert(t.deleteScheduled || "Account deletion scheduled. You will be logged out.");
      onSignOut();
    } catch (err) {
      const error = err as Error;
      setNotice({
        text: error.message || "Failed to request account deletion.",
        type: "error",
      });
    } finally {
      setSavingDeletion(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
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

  if (loading) {
    return (
      <div className="page-skeleton">
        <p>{locale === "ne" ? "प्रोफाइल लोड हुँदैछ..." : "Loading profile settings..."}</p>
      </div>
    );
  }

  // Get initial fallback
  const firstLetter = (fullName || email || "U").slice(0, 1).toUpperCase();

  return (
    <div className="profile-settings-container">
      {notice && (
        <div className={`workspace-notice ${notice.type === "error" ? "error-notice" : ""}`}>
          <span className="notice-text">{notice.text}</span>
          <button type="button" className="notice-close" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      <h1 className="profile-page-title">{t.profileSettings || "Profile Settings"}</h1>

      <div className="profile-grid">
        {/* Left Column: Avatar & Metadata */}
        <div className="profile-card profile-info-card">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="avatar-image" />
              ) : (
                <div className="avatar-initial">{firstLetter}</div>
              )}
            </div>
            <h2 className="profile-name">{fullName || (locale === "ne" ? "नाम नभएको" : "Unnamed")}</h2>
            <p className="profile-username">@{username || (email.split("@")[0])}</p>

            <span className="profile-badge-role">
              {role === "super_admin"
                ? (locale === "ne" ? "सुपर एडमिन" : "SUPER ADMIN")
                : role === "admin"
                ? (locale === "ne" ? "एडमिन" : "ADMIN")
                : (locale === "ne" ? "प्रयोगकर्ता" : "USER")}
            </span>

            {isVerified && (
              <span className="profile-badge-verified">
                ✓ {t.verifiedAccount || "VERIFIED ACCOUNT"}
              </span>
            )}
          </div>

          <div className="profile-meta-details">
            <div className="meta-row">
              <span className="meta-label">{t.emailLabel || "Email"}</span>
              <span className="meta-value text-ellipsis" title={email}>{email}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">{t.joinedLabel || "Joined"}</span>
              <span className="meta-value">{formatDate(joinedDate)}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">{t.statusLabel || "Status"}</span>
              <span className="meta-value status-active">
                <span className="status-dot" style={{ backgroundColor: status === "Pending Deletion" ? "#ef4444" : "#22c55e", boxShadow: status === "Pending Deletion" ? "0 0 8px #ef4444" : "0 0 8px #22c55e" }}></span>
                {status === "Pending Deletion" 
                  ? (locale === "ne" ? "मेटाउन बाँकी" : "Pending Deletion") 
                  : (locale === "ne" ? "सक्रिय" : "Active")}
              </span>
            </div>
            {status === "Pending Deletion" && scheduledDeletionDate && (
              <div className="meta-row" style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: "-4px" }}>
                <span className="meta-label">{locale === "ne" ? "मेटाउने मिति" : "Deletion Date"}</span>
                <span className="meta-value">{formatDate(scheduledDeletionDate)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Tabs */}
        <div className="profile-card profile-tabs-card">
          <div className="profile-tabs-header">
            <button
              type="button"
              className={`profile-tab-button ${activeTab === "details" ? "active" : ""}`}
              onClick={() => setActiveTab("details")}
            >
              {t.personalDetails || "Personal Details"}
            </button>
            <button
              type="button"
              className={`profile-tab-button ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              {t.securityPassword || "Security & Password"}
            </button>
          </div>

          <div className="profile-tabs-content">
            {activeTab === "details" && (
              <form onSubmit={handleUpdateDetails} className="profile-form">
                <div className="form-group">
                  <label htmlFor="fullName">{t.fullName || "Full Name"}</label>
                  <input
                    type="text"
                    id="fullName"
                    placeholder={locale === "ne" ? "आफ्नो पूरा नाम हाल्नुहोस्" : "Enter your full name"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="username">{t.usernameLabel || "Username"}</label>
                  <input
                    type="text"
                    id="username"
                    placeholder={locale === "ne" ? "आफ्नो युजरनेम हाल्नुहोस्" : "Enter your username"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    pattern="^[a-z0-9._]+$"
                    title={locale === "ne" ? "युजरनेममा साना अंग्रेजी अक्षर, अंक, थोप्लो (.) र अन्डरस्कोर (_) मात्र राख्न मिल्छ।" : "Username can only contain lowercase letters, numbers, dot (.) and underscore (_)."}
                  />
                </div>

                <div className="form-group">
                  <label>{t.profilePicture || "Profile Picture"}</label>
                  <div className="file-upload-wrapper">
                    <label htmlFor="avatar-file" className="file-upload-label">
                      {t.chooseFile || "Choose Image File"}
                    </label>
                    <input
                      type="file"
                      id="avatar-file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: "none" }}
                    />
                    <span className="file-name-text">
                      {selectedFileName || (t.noFileChosen || "No file chosen")}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="primary-button profile-submit-btn"
                  disabled={savingDetails}
                >
                  {savingDetails 
                    ? (locale === "ne" ? "सुरक्षित हुँदैछ..." : "Updating...") 
                    : (t.updateProfileInfo || "Update Profile Info")}
                </button>
              </form>
            )}

            {activeTab === "security" && (
              <div className="security-settings">
                <form onSubmit={handleChangePassword} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">{t.currentPassword || "Current Password"} <span className="required-star">*</span></label>
                    <div className="password-input-wrapper">
                      <input
                        type={showCurrent ? "text" : "password"}
                        id="currentPassword"
                        placeholder={locale === "ne" ? "आफ्नो हालको पासवर्ड हाल्नुहोस्" : "Enter your current password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowCurrent(!showCurrent)}
                      >
                        {showCurrent ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">{t.newPassword || "New Password"} <span className="required-star">*</span></label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNew ? "text" : "password"}
                        id="newPassword"
                        placeholder={locale === "ne" ? "नयाँ पासवर्ड हाल्नुहोस्" : "Enter new password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNew(!showNew)}
                      >
                        {showNew ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmNewPassword">{t.confirmNewPassword || "Confirm New Password"} <span className="required-star">*</span></label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirm ? "text" : "password"}
                        id="confirmNewPassword"
                        placeholder={locale === "ne" ? "नयाँ पासवर्ड पुनः हाल्नुहोस्" : "Confirm your new password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirm(!showConfirm)}
                      >
                        {showConfirm ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="primary-button profile-submit-btn"
                    disabled={savingPassword}
                  >
                    {savingPassword 
                      ? (locale === "ne" ? "परिवर्तन हुँदैछ..." : "Changing...") 
                      : (t.changePasswordBtn || "Change Password")}
                  </button>
                </form>

                <div className="account-deletion-divider" />

                <div className="account-deletion-section">
                  <h3 className="deletion-title">{t.deleteAccountTitle || "Account Deletion"}</h3>
                  <p className="deletion-desc">
                    {t.deleteAccountDesc || "Requesting account deletion will schedule your account and all associated data for permanent removal in 30 days."}
                  </p>
                  <button
                    type="button"
                    className="outline-button deletion-btn"
                    onClick={handleDeleteAccount}
                  >
                    {t.deleteAccountBtn || "Delete Account"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => { setIsDeleteModalOpen(false); setConfirmDeletePassword(""); }}>
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
            style={{ maxWidth: "500px", overflow: "hidden" }}
          >
            <div className="delete-modal-header">
              <h3>{t.deleteAccountRequest}</h3>
              <button
                type="button"
                className="delete-modal-close-btn"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setConfirmDeletePassword("");
                }}
              >
                ×
              </button>
            </div>
            <div className="delete-modal-body">
              <p className="delete-warning-text">{t.deleteWarningPermanent}</p>
              <ul className="delete-bullet-list">
                <li>{t.deleteBullet1}</li>
                <li>{t.deleteBullet2}</li>
                <li>{t.deleteBullet3}</li>
              </ul>
              
              <div className="form-group margin-top-md">
                <label htmlFor="confirm-del-pass">{t.confirmPasswordRequired} <span className="required-star">*</span></label>
                <div className="password-input-wrapper">
                  <input
                    type={confirmDeletePasswordVisible ? "text" : "password"}
                    id="confirm-del-pass"
                    placeholder={t.enterCurrentPassword}
                    value={confirmDeletePassword}
                    onChange={(e) => setConfirmDeletePassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setConfirmDeletePasswordVisible(!confirmDeletePasswordVisible)}
                  >
                    {confirmDeletePasswordVisible ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
              
              <p className="delete-confirm-prompt">{t.areYouSureDelete}</p>
            </div>
            <div className="delete-modal-footer">
              <button
                type="button"
                className="outline-button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setConfirmDeletePassword("");
                }}
              >
                {t.cancel}
              </button>
              <button
                type="button"
                className="primary-button deletion-confirm-submit-btn"
                onClick={handleConfirmDeleteAccount}
                disabled={!confirmDeletePassword || savingDeletion}
              >
                {savingDeletion ? "..." : t.requestDeletionBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
