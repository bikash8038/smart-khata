"use client";

import React from "react";

type PersonalPage = "dashboard" | "transactions" | "accounts" | "categories";
type PlanningPage = "budgets" | "loans" | "goals" | "reports" | "notifications";
type Page = PersonalPage | PlanningPage;

interface MobileBottomNavProps {
  page: Page;
  setPage: (page: Page) => void;
  t: Record<string, string>;
  onOpenMoreMenu: () => void;
}

export function MobileBottomNav({ page, setPage, t, onOpenMoreMenu }: MobileBottomNavProps) {
  // Check if active page is a primary tab
  const isDashboardActive = page === "dashboard";
  const isTransactionsActive = page === "transactions";
  const isAccountsActive = page === "accounts";

  return (
    <div className="mobile-bottom-nav-container">
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {/* Dashboard Tab */}
        <button
          type="button"
          className={`nav-tab ${isDashboardActive ? "active" : ""}`}
          onClick={() => setPage("dashboard")}
        >
          <span className="tab-icon-wrapper">
            {isDashboardActive ? (
              <svg className="nav-icon-svg filled" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            ) : (
              <svg className="nav-icon-svg outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            )}
          </span>
          <span className="tab-text">{t.dashboard}</span>
        </button>

        {/* Transactions Tab */}
        <button
          type="button"
          className={`nav-tab ${isTransactionsActive ? "active" : ""}`}
          onClick={() => setPage("transactions")}
        >
          <span className="tab-icon-wrapper">
            {isTransactionsActive ? (
              <svg className="nav-icon-svg filled" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h2v2H4zm0 5h2v2H4zm0 5h2v2H4zm4-10h12v2H8zm0 5h12v2H8zm0 5h12v2H8z" />
              </svg>
            ) : (
              <svg className="nav-icon-svg outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            )}
          </span>
          <span className="tab-text">{t.transactions}</span>
        </button>

        {/* Accounts Tab */}
        <button
          type="button"
          className={`nav-tab ${isAccountsActive ? "active" : ""}`}
          onClick={() => setPage("accounts")}
        >
          <span className="tab-icon-wrapper">
            {isAccountsActive ? (
              <svg className="nav-icon-svg filled" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 12H4v-2h16v2zm0-4H4V8h16v2z" />
              </svg>
            ) : (
              <svg className="nav-icon-svg outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            )}
          </span>
          <span className="tab-text">{t.accounts}</span>
        </button>

        {/* More/Menu Tab */}
        <button
          type="button"
          className="nav-tab"
          onClick={onOpenMoreMenu}
        >
          <span className="tab-icon-wrapper">
            <svg className="nav-icon-svg outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </span>
          <span className="tab-text">{t.moreMenu || "More"}</span>
        </button>
      </nav>
    </div>
  );
}
