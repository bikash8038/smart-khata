"use client";

import React, { useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile, Account, Category, Transaction, WorkspaceLocale } from "../types/workspace";
import { formatAdToBs } from "../../../lib/nepali-date";
import "../styles/bank-statement.css";

interface BankStatementViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  user: User;
  userProfile?: UserProfile | null;
  fromDate: string;
  toDate: string;
  accountFilter: string;
  query: string;
  typeFilter: string;
  formatMoney?: (value: number) => string;
  t: Record<string, string>;
  locale: WorkspaceLocale;
}

export function BankStatementView({
  transactions,
  accounts,
  categories,
  user,
  userProfile,
  fromDate,
  toDate,
  accountFilter,
  query,
  typeFilter,
  t,
  locale,
}: BankStatementViewProps) {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Determine Selected Account info
  const selectedAccount = useMemo(() => {
    if (accountFilter === "all") return null;
    return accounts.find((a) => a.id === accountFilter) || null;
  }, [accounts, accountFilter]);

  const accountHolderName = useMemo(() => {
    return (
      userProfile?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      (locale === "ne" ? "खातावाला" : "Account Holder")
    ).toUpperCase();
  }, [userProfile, user, locale]);

  const accountDisplayName = useMemo(() => {
    if (selectedAccount) {
      return selectedAccount.name;
    }
    return locale === "ne" ? "एकीकृत (सबै खाताहरू)" : "Consolidated (All Accounts)";
  }, [selectedAccount, locale]);

  // Format amount with commas and 2 decimals, without currency prefix for table cells
  const formatAmountValue = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // 1. Filter transactions by Account and Query
  const accountTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Account filter
      if (accountFilter !== "all") {
        const isFrom = tx.account_id === accountFilter;
        const isTo = tx.to_account_id === accountFilter;
        if (!isFrom && !isTo) return false;
      }

      // Type filter
      if (typeFilter !== "all" && tx.kind !== typeFilter) {
        return false;
      }

      // Query filter
      if (query.trim()) {
        const q = query.toLowerCase();
        const note = (tx.note || "").toLowerCase();
        const cat = categories.find((c) => c.id === tx.category_id);
        const catNe = (cat?.name_ne || "").toLowerCase();
        const catEn = (cat?.name_en || "").toLowerCase();
        if (!note.includes(q) && !catNe.includes(q) && !catEn.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, accountFilter, typeFilter, query, categories]);

  // Determine Effective Date Range
  const { effectiveFromDate, effectiveToDate } = useMemo(() => {
    let minDate = fromDate;
    let maxDate = toDate;

    if (!minDate) {
      const dates = accountTransactions.map((t) => t.transaction_date).sort();
      minDate = dates[0] || new Date().toISOString().slice(0, 10);
    }
    if (!maxDate) {
      const dates = accountTransactions.map((t) => t.transaction_date).sort();
      maxDate = dates[dates.length - 1] || new Date().toISOString().slice(0, 10);
    }

    return {
      effectiveFromDate: minDate,
      effectiveToDate: maxDate,
    };
  }, [accountTransactions, fromDate, toDate]);

  // 2. Compute baseline Opening Balance as of effectiveFromDate
  const openingBalance = useMemo(() => {
    // Initial opening balance of accounts
    let base = 0;
    if (selectedAccount) {
      base = Number(selectedAccount.opening_balance || 0);
    } else {
      base = accounts.reduce((sum, a) => sum + Number(a.opening_balance || 0), 0);
    }

    // Add/subtract all transactions prior to effectiveFromDate
    transactions.forEach((tx) => {
      if (tx.transaction_date < effectiveFromDate) {
        if (selectedAccount) {
          if (tx.kind === "income" && tx.account_id === selectedAccount.id) {
            base += Number(tx.amount);
          } else if (tx.kind === "expense" && tx.account_id === selectedAccount.id) {
            base -= Number(tx.amount);
          } else if (tx.kind === "transfer") {
            if (tx.account_id === selectedAccount.id) {
              base -= Number(tx.amount);
            }
            if (tx.to_account_id === selectedAccount.id) {
              base += Number(tx.amount);
            }
          }
        } else {
          // Consolidated
          if (tx.kind === "income") {
            base += Number(tx.amount);
          } else if (tx.kind === "expense") {
            base -= Number(tx.amount);
          }
        }
      }
    });

    return base;
  }, [selectedAccount, accounts, transactions, effectiveFromDate]);

  // 3. Prepare filtered transactions within date range and calculate running balance forward
  const { statementRows, totalWithdraw, totalDeposit, closingBalance } = useMemo(() => {
    const periodTxs = accountTransactions
      .filter(
        (tx) =>
          tx.transaction_date >= effectiveFromDate &&
          tx.transaction_date <= effectiveToDate
      )
      .sort(
        (a, b) =>
          a.transaction_date.localeCompare(b.transaction_date) ||
          (a.created_at ?? "").localeCompare(b.created_at ?? "") ||
          a.id.localeCompare(b.id)
      );

    let runningBal = openingBalance;
    let sumWithdraw = 0;
    let sumDeposit = 0;
    const rows: Array<{
      id: string;
      date: string;
      fullDateTime: string;
      descMain: string;
      descSub: string;
      withdraw: number | null;
      deposit: number | null;
      balance: number;
    }> = [];

    for (const tx of periodTxs) {
      let isWithdraw = false;
      let isDeposit = false;
      const amount = Number(tx.amount);

      if (selectedAccount) {
        if (tx.kind === "income" && tx.account_id === selectedAccount.id) {
          isDeposit = true;
        } else if (tx.kind === "expense" && tx.account_id === selectedAccount.id) {
          isWithdraw = true;
        } else if (tx.kind === "transfer") {
          if (tx.account_id === selectedAccount.id) {
            isWithdraw = true;
          } else if (tx.to_account_id === selectedAccount.id) {
            isDeposit = true;
          }
        }
      } else {
        if (tx.kind === "income") isDeposit = true;
        else if (tx.kind === "expense") isWithdraw = true;
      }

      if (isDeposit) {
        runningBal += amount;
        sumDeposit += amount;
      } else if (isWithdraw) {
        runningBal -= amount;
        sumWithdraw += amount;
      }

      // Format description
      const category = categories.find((c) => c.id === tx.category_id);
      const catName = category
        ? locale === "ne"
          ? category.name_ne
          : category.name_en || category.name_ne
        : "";

      const descMain = tx.note || catName || (tx.kind === "transfer" ? (locale === "ne" ? "मौज्दात स्थानान्तरण" : "Transfer") : (locale === "ne" ? "विवरण नखुलेको" : "General Transaction"));
      let descSub = "";

      if (tx.kind === "transfer") {
        const fromAcc = accounts.find((a) => a.id === tx.account_id)?.name || "Account";
        const toAcc = accounts.find((a) => a.id === tx.to_account_id)?.name || "Account";
        descSub = `${fromAcc} ➔ ${toAcc}`;
      } else if (tx.note && catName) {
        descSub = catName;
      }

      // Format full date & time (e.g. 2026-08-30 07:52:29)
      let timeStr = "00:00:00";
      if (tx.created_at) {
        try {
          const d = new Date(tx.created_at);
          timeStr = d.toTimeString().split(" ")[0];
        } catch {
          // ignore
        }
      }
      const fullDateTime = `${tx.transaction_date} ${timeStr}`;

      rows.push({
        id: tx.id,
        date: tx.transaction_date,
        fullDateTime,
        descMain,
        descSub,
        withdraw: isWithdraw ? amount : null,
        deposit: isDeposit ? amount : null,
        balance: runningBal,
      });
    }

    return {
      statementRows: rows,
      totalWithdraw: sumWithdraw,
      totalDeposit: sumDeposit,
      closingBalance: runningBal,
    };
  }, [
    accountTransactions,
    effectiveFromDate,
    effectiveToDate,
    openingBalance,
    selectedAccount,
    categories,
    accounts,
    locale,
  ]);

  // Display rows sorted according to user selection
  const displayRows = useMemo(() => {
    if (sortOrder === "desc") {
      return [...statementRows].reverse();
    }
    return statementRows;
  }, [statementRows, sortOrder]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = ["S.N", "Transaction Date", "Description", "Withdraw", "Deposit", "Balance"];
    const lines = [
      `Electronic Account Statement`,
      `Account Holder: ${accountHolderName}`,
      `Account: ${accountDisplayName}`,
      `Period: ${effectiveFromDate} to ${effectiveToDate}`,
      `Opening Balance: ${formatAmountValue(openingBalance)}`,
      `Closing Balance: ${formatAmountValue(closingBalance)}`,
      "",
      headers.join(","),
      `0,${effectiveFromDate},Opening Balance,-,-,${formatAmountValue(openingBalance)}`,
      ...statementRows.map((r, idx) =>
        [
          idx + 1,
          `"${r.fullDateTime}"`,
          `"${r.descMain} ${r.descSub ? `(${r.descSub})` : ""}"`,
          r.withdraw ? formatAmountValue(r.withdraw) : "-",
          r.deposit ? formatAmountValue(r.deposit) : "-",
          formatAmountValue(r.balance),
        ].join(",")
      ),
      `-,${effectiveToDate},Closing Balance,-,-,${formatAmountValue(closingBalance)}`,
      `Total,-,-,${formatAmountValue(totalWithdraw)},${formatAmountValue(totalDeposit)},${formatAmountValue(closingBalance)}`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Statement_${accountDisplayName.replace(/\s+/g, "_")}_${effectiveFromDate}_to_${effectiveToDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bank-statement-wrapper">
      {/* Top Action Bar (hidden on print) */}
      <div className="statement-actions-bar">
        <div className="statement-actions-left">
          <span>
            {locale === "ne" ? "कारोबार सङ्ख्या:" : "Total Records:"} <b>{statementRows.length}</b>
          </span>
          <span>•</span>
          <span>
            {locale === "ne" ? "क्रम:" : "Order:"}{" "}
            <button
              type="button"
              className="see-more"
              style={{ padding: "2px 6px", fontSize: "0.8rem" }}
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              {sortOrder === "desc"
                ? locale === "ne"
                  ? "नयाँ पहिले (Newest First) ⬇"
                  : "Newest First ⬇"
                : locale === "ne"
                ? "पुरानो पहिले (Oldest First) ⬆"
                : "Oldest First ⬆"}
            </button>
          </span>
        </div>

        <div className="statement-actions-right">
          <button
            type="button"
            className="statement-btn statement-btn-secondary"
            onClick={handleExportCsv}
            title={t.exportCsv || "Export CSV"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Excel / CSV</span>
          </button>

          <button
            type="button"
            className="statement-btn statement-btn-primary"
            onClick={handlePrint}
            title={t.printStatement || "Print Statement"}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>{t.printStatement || "Print / PDF"}</span>
          </button>
        </div>
      </div>

      {/* Main Statement Paper (Matches Laxmi Sunrise Bank Statement Design) */}
      <div className="statement-paper">
        {/* Statement Header */}
        <header className="statement-doc-header">
          <div className="statement-brand-logo-wrap">
            <svg className="statement-brand-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5 10 5 10-5-5-2.5-5 2.5z" />
            </svg>
            <h1 className="statement-brand-title">
              {selectedAccount ? selectedAccount.name : "Smart Khata"}
            </h1>
          </div>
          <h2 className="statement-main-title">
            {t.electronicStatement || "Electronic Account Statement"}
          </h2>
        </header>

        {/* Statement Metadata Grid */}
        <section className="statement-meta-grid">
          {/* Left Column */}
          <div className="statement-meta-col">
            <div className="statement-meta-row">
              <span className="statement-meta-label">
                {t.accountHolder || "Account Holder's"} <span className="statement-meta-colon">:</span>
              </span>
              <span className="statement-meta-val highlight">{accountHolderName}</span>
            </div>

            <div className="statement-meta-row">
              <span className="statement-meta-label">
                {t.accountNumber || "Account Name/No"} <span className="statement-meta-colon">:</span>
              </span>
              <span className="statement-meta-val">{accountDisplayName}</span>
            </div>

            <div className="statement-meta-row">
              <span className="statement-meta-label">
                {t.accountInterestRate || "Account Interest Rate"} <span className="statement-meta-colon">:</span>
              </span>
              <span className="statement-meta-val">-</span>
            </div>

            <div className="statement-meta-row">
              <span className="statement-meta-label">
                {t.accruedInterest || "Accrued Interest"} <span className="statement-meta-colon">:</span>
              </span>
              <span className="statement-meta-val">-</span>
            </div>

            <div className="statement-meta-row">
              <span className="statement-meta-label">
                {t.currencyCode || "Currency Code"} <span className="statement-meta-colon">:</span>
              </span>
              <span className="statement-meta-val">NPR</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="statement-meta-col">
            <div className="statement-meta-row">
              <span className="statement-meta-label">
                {t.fromDateLabel || "From Date"} <span className="statement-meta-colon">:</span>
              </span>
              <span className="statement-meta-val">
                {effectiveFromDate} <small style={{ color: "#64748b" }}>({formatAdToBs(effectiveFromDate, locale)})</small>
              </span>
            </div>

            <div className="statement-meta-row">
              <span className="statement-meta-label">
                {t.toDateLabel || "To Date"} <span className="statement-meta-colon">:</span>
              </span>
              <span className="statement-meta-val">
                {effectiveToDate} <small style={{ color: "#64748b" }}>({formatAdToBs(effectiveToDate, locale)})</small>
              </span>
            </div>

            <div className="statement-meta-row" style={{ marginTop: "0.2rem" }}>
              <span className="statement-meta-label">
                {t.openingBalanceLabel || "Opening Balance"} <span className="statement-meta-colon">:</span>
              </span>
              <span className="statement-meta-val highlight">{formatAmountValue(openingBalance)}</span>
            </div>

            <div className="statement-meta-row">
              <span className="statement-meta-label">
                {t.closingBalanceLabel || "Closing Balance"} <span className="statement-meta-colon">:</span>
              </span>
              <span className="statement-meta-val highlight" style={{ color: "#b91c1c" }}>
                {formatAmountValue(closingBalance)}
              </span>
            </div>
          </div>
        </section>

        {/* Statement Table */}
        <div className="statement-table-container">
          <table className="statement-table">
            <thead>
              <tr>
                <th className="col-sn">{t.sn || "S.N"}</th>
                <th className="col-date">{t.transactionDate || "Transaction Date"}</th>
                <th className="col-desc">{t.description || "Description"}</th>
                <th className="col-amount">{t.withdraw || "Withdraw"}</th>
                <th className="col-amount">{t.deposit || "Deposit"}</th>
                <th className="col-balance">{t.balance || "Balance"}</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance Row */}
              <tr className="statement-special-row">
                <td className="col-sn">-</td>
                <td className="col-date">{effectiveFromDate}</td>
                <td className="col-desc">
                  <div className="col-desc-main">{t.openingBalanceLabel || "Opening Balance"}</div>
                </td>
                <td className="col-amount"><span className="amount-dash">-</span></td>
                <td className="col-amount"><span className="amount-dash">-</span></td>
                <td className="col-balance">{formatAmountValue(openingBalance)}</td>
              </tr>

              {/* Transaction Rows */}
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                    {t.noResults || "No transactions recorded in this period."}
                  </td>
                </tr>
              ) : (
                displayRows.map((row, idx) => {
                  const serialNum = sortOrder === "desc" ? statementRows.length - idx : idx + 1;
                  return (
                    <tr key={row.id}>
                      <td className="col-sn">{serialNum}</td>
                      <td className="col-date">{row.fullDateTime}</td>
                      <td className="col-desc">
                        <div className="col-desc-main">{row.descMain}</div>
                        {row.descSub && <div className="col-desc-sub">{row.descSub}</div>}
                      </td>
                      <td className="col-amount" style={{ color: row.withdraw ? "#dc2626" : "inherit" }}>
                        {row.withdraw ? formatAmountValue(row.withdraw) : <span className="amount-dash">-</span>}
                      </td>
                      <td className="col-amount" style={{ color: row.deposit ? "#16a34a" : "inherit" }}>
                        {row.deposit ? formatAmountValue(row.deposit) : <span className="amount-dash">-</span>}
                      </td>
                      <td className="col-balance">{formatAmountValue(row.balance)}</td>
                    </tr>
                  );
                })
              )}

              {/* Closing Balance Row */}
              <tr className="statement-special-row">
                <td className="col-sn">-</td>
                <td className="col-date">{effectiveToDate}</td>
                <td className="col-desc">
                  <div className="col-desc-main">{t.closingBalanceLabel || "Closing Balance"}</div>
                </td>
                <td className="col-amount"><span className="amount-dash">-</span></td>
                <td className="col-amount"><span className="amount-dash">-</span></td>
                <td className="col-balance" style={{ color: "#b91c1c" }}>
                  {formatAmountValue(closingBalance)}
                </td>
              </tr>
            </tbody>

            {/* Summary Footer */}
            <tfoot>
              <tr className="statement-summary-footer">
                <td colSpan={3} style={{ textAlign: "right", paddingRight: "1rem" }}>
                  <strong>{t.statementSummary || "Total Period Summary:"}</strong>
                </td>
                <td className="col-amount" style={{ color: "#dc2626" }}>
                  <b>{formatAmountValue(totalWithdraw)}</b>
                </td>
                <td className="col-amount" style={{ color: "#16a34a" }}>
                  <b>{formatAmountValue(totalDeposit)}</b>
                </td>
                <td className="col-balance">
                  <b>{formatAmountValue(closingBalance)}</b>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Statement Footer Notice */}
        <footer className="statement-footer-notice">
          <span>Smart Khata • {t.privateSummary || "Secure Financial Ledger"}</span>
          <span>{locale === "ne" ? "मिति तयार गरिएको:" : "Generated on:"} {new Date().toISOString().slice(0, 10)}</span>
        </footer>
      </div>
    </div>
  );
}
