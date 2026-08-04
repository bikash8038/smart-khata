"use client";

import React, { useState } from "react";
import { NepaliDatePicker } from "../../../components/ui/NepaliDatePicker";

interface Account {
  id: string;
  name: string;
}

interface TransactionToolbarProps {
  t: Record<string, string>;
  locale: "en" | "ne";
  accounts: Account[];
  query: string;
  typeFilter: "all" | "income" | "expense";
  accountFilter: string;
  fromDate: string;
  toDate: string;
  onQuery: (value: string) => void;
  onType: (value: "all" | "income" | "expense") => void;
  onAccount: (value: string) => void;
  onFromDate: (value: string) => void;
  onToDate: (value: string) => void;
  onResetFilters?: () => void;
}

export function TransactionToolbar({
  t,
  locale,
  accounts,
  query,
  typeFilter,
  accountFilter,
  fromDate,
  toDate,
  onQuery,
  onType,
  onAccount,
  onFromDate,
  onToDate,
  onResetFilters,
}: TransactionToolbarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Temporary local state inside modal before clicking Apply
  const [tempAccount, setTempAccount] = useState(accountFilter);
  const [tempFromDate, setTempFromDate] = useState(fromDate);
  const [tempToDate, setTempToDate] = useState(toDate);
  const [tempType, setTempType] = useState(typeFilter);

  const openModal = () => {
    setTempAccount(accountFilter);
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setTempType(typeFilter);
    setIsModalOpen(true);
  };

  const handleApplyModal = () => {
    onAccount(tempAccount);
    onFromDate(tempFromDate);
    onToDate(tempToDate);
    onType(tempType);
    setIsModalOpen(false);
  };

  const handleReset = () => {
    setTempAccount("all");
    setTempFromDate("");
    setTempToDate("");
    setTempType("all");
    onAccount("all");
    onFromDate("");
    onToDate("");
    onType("all");
    onQuery("");
    if (onResetFilters) onResetFilters();
    setIsModalOpen(false);
  };

  const activeFilterCount =
    (accountFilter !== "all" ? 1 : 0) +
    (fromDate ? 1 : 0) +
    (toDate ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (query ? 1 : 0);

  const selectedAccountName =
    accountFilter === "all"
      ? locale === "ne"
        ? "सबै खाताहरू"
        : "All Accounts"
      : accounts.find((a) => a.id === accountFilter)?.name || (locale === "ne" ? "खाता" : "Account");

  return (
    <div className="transaction-toolbar-container">
      {/* Desktop & Main Toolbar */}
      <div className="transaction-toolbar">
        {/* Search Input */}
        <div className="search-input-wrapper">
          <svg
            className="toolbar-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={t.search}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="search-clear-button"
              onClick={() => onQuery("")}
            >
              {t.clear}
            </button>
          )}
        </div>

        {/* Account Selector (Desktop) */}
        <div className="filter-select-wrapper desktop-only-filter">
          <select
            value={accountFilter}
            onChange={(e) => onAccount(e.target.value)}
            title={locale === "ne" ? "खाता छान्नुहोस्" : "Select Account"}
          >
            <option value="all">
              {locale === "ne" ? "सबै खाताहरू (All Accounts)" : "All Accounts"}
            </option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Type Selector (Desktop) */}
        <div className="filter-select-wrapper desktop-only-filter">
          <select
            value={typeFilter}
            onChange={(event) => onType(event.target.value as "all" | "income" | "expense")}
          >
            <option value="all">{t.allTransactions}</option>
            <option value="income">{t.income}</option>
            <option value="expense">{t.expense}</option>
          </select>
        </div>

        {/* Mobile / Responsive Filter Trigger Button */}
        <button
          type="button"
          className={`statement-filter-trigger-btn ${activeFilterCount > 0 ? "active" : ""}`}
          onClick={openModal}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>{locale === "ne" ? "फिल्टर" : "Filter"}</span>
          {activeFilterCount > 0 && (
            <span className="filter-count-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* Filter Summary Strip if filters active */}
      {activeFilterCount > 0 && (
        <div className="active-filters-bar">
          <span className="active-filter-chip">
            {locale === "ne" ? "खाता:" : "Account:"} <strong>{selectedAccountName}</strong>
          </span>
          {fromDate && (
            <span className="active-filter-chip">
              {locale === "ne" ? "देखि:" : "From:"} <strong>{fromDate}</strong>
            </span>
          )}
          {toDate && (
            <span className="active-filter-chip">
              {locale === "ne" ? "सम्म:" : "To:"} <strong>{toDate}</strong>
            </span>
          )}
          {typeFilter !== "all" && (
            <span className="active-filter-chip">
              {locale === "ne" ? "प्रकार:" : "Type:"}{" "}
              <strong>{typeFilter === "income" ? t.income : t.expense}</strong>
            </span>
          )}
          <button type="button" className="clear-all-filters-btn" onClick={handleReset}>
            {locale === "ne" ? "सबै हटाउनुहोस्" : "Clear All"}
          </button>
        </div>
      )}

      {/* Mobile Statement Filter Modal Overlay (Matches Screenshot 1) */}
      {isModalOpen && (
        <div className="statement-filter-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="statement-filter-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="statement-filter-header">
              <h3>{locale === "ne" ? "फिल्टर" : "FILTER"}</h3>
              <button
                type="button"
                className="statement-filter-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="statement-filter-body">
              {/* Account Dropdown */}
              <div className="statement-filter-field">
                <label>{locale === "ne" ? "खाताबाट (From Account)" : "From Account"}</label>
                <select
                  value={tempAccount}
                  onChange={(e) => setTempAccount(e.target.value)}
                >
                  <option value="all">
                    {locale === "ne" ? "सबै खाताहरू (All Accounts)" : "All Accounts"}
                  </option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Date & To Date Pickers using exact NepaliDatePicker */}
              <div className="statement-filter-row-2col">
                <div className="statement-filter-field">
                  <label>{locale === "ne" ? "शुरु मिति (From Date)" : "From Date"}</label>
                  <NepaliDatePicker
                    value={tempFromDate}
                    onChange={(val) => setTempFromDate(val)}
                    locale={locale}
                    name="fromDate"
                  />
                </div>

                <div className="statement-filter-field">
                  <label>{locale === "ne" ? "अन्तिम मिति (To Date)" : "To Date"}</label>
                  <NepaliDatePicker
                    value={tempToDate}
                    onChange={(val) => setTempToDate(val)}
                    locale={locale}
                    name="toDate"
                  />
                </div>
              </div>

              {/* Transaction Type Filter */}
              <div className="statement-filter-field">
                <label>{locale === "ne" ? "कारोबार प्रकार" : "Transaction Type"}</label>
                <select
                  value={tempType}
                  onChange={(e) => setTempType(e.target.value as "all" | "income" | "expense")}
                >
                  <option value="all">{t.allTransactions}</option>
                  <option value="income">{t.income}</option>
                  <option value="expense">{t.expense}</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="statement-filter-actions">
              <button
                type="button"
                className="statement-filter-reset-btn"
                onClick={handleReset}
              >
                {locale === "ne" ? "रिसेट" : "Reset"}
              </button>
              <button
                type="button"
                className="statement-filter-apply-btn"
                onClick={handleApplyModal}
              >
                {locale === "ne" ? "लागू गर्नुहोस् (Apply)" : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
