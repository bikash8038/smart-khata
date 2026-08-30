"use client";

import React, { useState, useMemo } from "react";
import type { Loan, LoanPayment } from "./FinanceModule";
import { LoanDetailsModal, calculateLoanStatement } from "./LoanDetailsModal";

interface LoanListProps {
  items: Loan[];
  onDelete: (id: string) => void;
  onAddPayment?: (loanId: string, payment: Omit<LoanPayment, "id">) => Promise<void>;
  formatMoney: (value: number) => string;
  t: Record<string, string>;
}

export function LoanList({ items, onDelete, onAddPayment, formatMoney, t }: LoanListProps) {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalBorrowedPrincipal = 0;
    let totalBorrowedOutstanding = 0;
    let totalBorrowedAccrued = 0;

    let totalLentPrincipal = 0;
    let totalLentOutstanding = 0;
    let totalLentAccrued = 0;

    items.forEach((loan) => {
      const stmt = calculateLoanStatement(loan, todayStr);
      if (loan.direction === "borrowed") {
        totalBorrowedPrincipal += Number(loan.principal_amount) || 0;
        totalBorrowedOutstanding += stmt.remainingPrincipal;
        totalBorrowedAccrued += stmt.totalInterestAccrued;
      } else {
        totalLentPrincipal += Number(loan.principal_amount) || 0;
        totalLentOutstanding += stmt.remainingPrincipal;
        totalLentAccrued += stmt.totalInterestAccrued;
      }
    });

    return {
      totalBorrowedPrincipal,
      totalBorrowedOutstanding,
      totalBorrowedAccrued,
      totalLentPrincipal,
      totalLentOutstanding,
      totalLentAccrued,
    };
  }, [items, todayStr]);

  if (items.length === 0) {
    return (
      <section className="record-panel">
        <p className="empty-state">{t.noLoans || "No loans or EMIs added yet."}</p>
      </section>
    );
  }

  return (
    <section className="record-panel loan-management-panel">
      {/* Top Loan Summary Cards */}
      <div className="loan-dashboard-summary-grid">
        <div className="loan-summary-card borrowed">
          <div className="loan-summary-card-header">
            <span>📥 {t.borrowedLoan || "लिएको ऋण (Borrowed)"}</span>
            <small>{items.filter((i) => i.direction === "borrowed").length} Records</small>
          </div>
          <div className="loan-summary-card-body">
            <div>
              <label>{t.principalAmount || "सुरु सावाँ"}:</label>
              <strong>{formatMoney(summary.totalBorrowedPrincipal)}</strong>
            </div>
            <div>
              <label>{t.totalOutstanding || "बाँकी सावाँ"}:</label>
              <strong style={{ color: "#dc3545" }}>{formatMoney(summary.totalBorrowedOutstanding)}</strong>
            </div>
            <div>
              <label>{t.accruedInterest || "पाकेको ब्याज"}:</label>
              <strong style={{ color: "#0d6efd" }}>{formatMoney(summary.totalBorrowedAccrued)}</strong>
            </div>
          </div>
        </div>

        <div className="loan-summary-card lent">
          <div className="loan-summary-card-header">
            <span>📤 {t.lentLoan || "दिएको ऋण (Lent)"}</span>
            <small>{items.filter((i) => i.direction === "lent").length} Records</small>
          </div>
          <div className="loan-summary-card-body">
            <div>
              <label>{t.principalAmount || "सुरु सावाँ"}:</label>
              <strong>{formatMoney(summary.totalLentPrincipal)}</strong>
            </div>
            <div>
              <label>{t.totalOutstanding || "उठ्न बाँकी सावाँ"}:</label>
              <strong style={{ color: "#198754" }}>{formatMoney(summary.totalLentOutstanding)}</strong>
            </div>
            <div>
              <label>{t.accruedInterest || "पाकेको ब्याज"}:</label>
              <strong style={{ color: "#0d6efd" }}>{formatMoney(summary.totalLentAccrued)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="loan-list-header-row">
        <h2>{t.loanDetails || "ऋण तथा किस्ता विवरण"}</h2>
        <span className="loan-count-badge">{items.length} {t.loans || "ऋणहरू"}</span>
      </div>

      <div className="loan-list-rows">
        {items.map((item) => {
          const stmt = calculateLoanStatement(item, todayStr);
          const rateBadge =
            item.rate_type === "compound"
              ? { text: `${item.rate || 0}% (वार्षिक चक्रीय)`, bg: "#6f42c1" }
              : item.rate_type === "per_thousand"
              ? { text: `रु. ${item.rate || 0} (प्रतिहजार)`, bg: "#0d6efd" }
              : item.rate_type === "none"
              ? { text: "०% ब्याज", bg: "#6c757d" }
              : { text: `${item.rate || 0}% (साधारण)`, bg: "#198754" };

          return (
            <article className="record-row loan-record-row" key={item.id}>
              <div className="loan-item-primary" onClick={() => setSelectedLoan(item)} style={{ cursor: "pointer" }}>
                <div className="loan-item-title-row">
                  <strong className="loan-person-name">{item.person_name}</strong>
                  <span className={`direction-badge ${item.direction}`}>
                    {item.direction === "borrowed" ? t.borrowedLoan || "📥 लिएको" : t.lentLoan || "📤 दिएको"}
                  </span>
                  <span
                    className="loan-rate-chip"
                    style={{ backgroundColor: rateBadge.bg, color: "#fff" }}
                    title="ब्याजदर प्रणाली"
                  >
                    {rateBadge.text}
                  </span>
                </div>
                <p className="loan-item-meta">
                  {item.start_date && (
                    <span>📅 {t.loanStartDate || "सुरु"}: {item.start_date}</span>
                  )}
                  {item.due_date && (
                    <span> · ⏰ {t.dueDateLabel || "भाका"}: {item.due_date}</span>
                  )}
                  <span> · ⏳ {stmt.durationStr}</span>
                </p>
              </div>

              <div className="record-amount-actions">
                <div className="loan-amounts" onClick={() => setSelectedLoan(item)} style={{ cursor: "pointer" }}>
                  <b className="loan-outstanding-text">
                    {formatMoney(stmt.totalRemaining)} <small style={{ fontWeight: 500, fontSize: "0.8rem", color: "#6c757d" }}>{t.totalOutstanding || "कुल बाँकी"}</small>
                  </b>
                  <small className="principal-label">
                    ({t.principalAmount || "सावाँ"}: {formatMoney(stmt.remainingPrincipal)} | {t.accruedInterest || "ब्याज"}: {formatMoney(stmt.remainingInterest)})
                  </small>
                </div>

                <span className="row-actions loan-actions-group">
                  {/* Eye Button for View Details */}
                  <button
                    type="button"
                    className="action-btn-eye"
                    onClick={() => setSelectedLoan(item)}
                    title={t.viewLoanDetails || "विस्तृत विवरण हेर्नुहोस्"}
                    aria-label={t.viewLoanDetails || "विस्तृत विवरण हेर्नुहोस्"}
                  >
                    <svg className="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="btn-eye-text">{t.viewLoanDetails || "हेर्नुहोस्"}</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    className="action-btn-red"
                    onClick={() => onDelete(item.id)}
                    title={t.remove || "हटाउनुहोस्"}
                    aria-label={t.remove || "हटाउनुहोस्"}
                  >
                    <svg className="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* View Details Modal */}
      {selectedLoan && (
        <LoanDetailsModal
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
          onAddPayment={onAddPayment}
          formatMoney={formatMoney}
          t={t}
        />
      )}
    </section>
  );
}
