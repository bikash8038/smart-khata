"use client";

import React from "react";

interface TransactionToolbarProps {
  t: Record<string, string>;
  query: string;
  typeFilter: "all" | "income" | "expense";
  onQuery: (value: string) => void;
  onType: (value: "all" | "income" | "expense") => void;
}

export function TransactionToolbar({
  t,
  query,
  typeFilter,
  onQuery,
  onType,
}: TransactionToolbarProps) {
  return (
    <div className="transaction-toolbar">
      <div className="search-input-wrapper">
        <svg className="toolbar-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      
      <div className="filter-select-wrapper">
        <select
          value={typeFilter}
          onChange={(event) => onType(event.target.value as "all" | "income" | "expense")}
        >
          <option value="all">{t.allTransactions}</option>
          <option value="income">{t.income}</option>
          <option value="expense">{t.expense}</option>
        </select>
      </div>
      
    </div>
  );
}
