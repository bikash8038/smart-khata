"use client";

import React, { useState } from "react";
import type { Loan, LoanPayment } from "./FinanceModule";

interface LoanDetailsModalProps {
  loan: Loan;
  onClose: () => void;
  onAddPayment?: (loanId: string, payment: Omit<LoanPayment, "id">) => Promise<void>;
  formatMoney: (val: number) => string;
  t: Record<string, string>;
}

export interface LedgerRow {
  date: string;
  description: string;
  interestAccrued?: number;
  interestPaid?: number;
  principalChange?: number;
  remainingInterest: number;
  remainingPrincipal: number;
  isCapitalization?: boolean;
}

export function calculateLoanStatement(loan: Loan, todayStr: string) {
  const initialPrincipal = Number(loan.principal_amount) || 0;
  const rate = Number(loan.rate) || 0;
  const rateType = loan.rate_type || "percent";
  const startDateStr = loan.start_date || (loan as any).created_at?.slice(0, 10) || todayStr;
  const payments: LoanPayment[] = loan.payments || [];

  const events: Array<{
    date: string;
    type: "loan_start" | "capital_add" | "annual_capitalization" | "principal" | "interest";
    amount: number;
    note?: string;
  }> = [{ date: startDateStr, type: "loan_start", amount: initialPrincipal }];

  payments.forEach((p) => {
    events.push({
      date: p.date,
      type: p.type,
      amount: Number(p.amount) || 0,
      note: p.note,
    });
  });

  // If compound rate type, generate yearly anniversary events
  if (rateType === "compound" && rate > 0) {
    try {
      const [sYear, sMonth, sDay] = startDateStr.split("-").map(Number);
      let currYear = sYear + 1;
      while (true) {
        const mStr = String(sMonth).padStart(2, "0");
        const dStr = String(sDay).padStart(2, "0");
        const annivStr = `${currYear}-${mStr}-${dStr}`;
        if (annivStr > todayStr) break;
        events.push({
          date: annivStr,
          type: "annual_capitalization",
          amount: 0,
        });
        currYear++;
      }
    } catch {
      // fallback
    }
  }

  // Sort events chronologically
  events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.type === "loan_start") return -1;
    if (a.type === "capital_add") return -1;
    if (a.type === "annual_capitalization") return -1;
    return 0;
  });

  function calcInterest(principal: number, fromDateStr: string, toDateStr: string) {
    if (principal <= 0 || fromDateStr >= toDateStr || rate <= 0 || rateType === "none") {
      return 0;
    }
    const fromD = new Date(fromDateStr);
    const toD = new Date(toDateStr);
    const diffTime = toD.getTime() - fromD.getTime();
    const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    if (rateType === "percent" || rateType === "compound") {
      return (principal * (rate / 100) / 365) * days;
    } else if (rateType === "per_thousand") {
      let months = (toD.getFullYear() - fromD.getFullYear()) * 12 + (toD.getMonth() - fromD.getMonth());
      if (toD.getDate() < fromD.getDate()) months--;
      const monthInt = (principal / 1000) * rate * Math.max(0, months);
      const remDays = Math.max(0, days - months * 30);
      const dayInt = (principal / 1000) * (rate / 30) * remDays;
      return monthInt + dayInt;
    }
    return 0;
  }

  const ledgerRows: LedgerRow[] = [];
  let currentPrincipal = 0;
  let currentInterestBalance = 0;
  let totalInterestAccrued = 0;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  let totalCapitalAdded = 0;
  let lastDate = "";

  for (const ev of events) {
    if (lastDate && lastDate !== ev.date) {
      const periodInterest = calcInterest(currentPrincipal, lastDate, ev.date);
      if (periodInterest > 0.005) {
        currentInterestBalance += periodInterest;
        totalInterestAccrued += periodInterest;
        ledgerRows.push({
          date: ev.date,
          description: `${lastDate} देखि ${ev.date} सम्मको ब्याज`,
          interestAccrued: periodInterest,
          remainingInterest: currentInterestBalance,
          remainingPrincipal: currentPrincipal,
        });
      }
    }

    if (ev.type === "loan_start") {
      currentPrincipal += ev.amount;
      ledgerRows.push({
        date: ev.date,
        description: "ऋण सुरु भयो (Initial Loan)",
        remainingInterest: currentInterestBalance,
        remainingPrincipal: currentPrincipal,
      });
    } else if (ev.type === "capital_add") {
      currentPrincipal += ev.amount;
      totalCapitalAdded += ev.amount;
      ledgerRows.push({
        date: ev.date,
        description: "थप सावाँ रकम (Capital Added)",
        principalChange: ev.amount,
        remainingInterest: currentInterestBalance,
        remainingPrincipal: currentPrincipal,
      });
    } else if (ev.type === "annual_capitalization") {
      if (currentInterestBalance > 0.005) {
        const capAmount = currentInterestBalance;
        currentPrincipal += capAmount;
        totalCapitalAdded += capAmount;
        currentInterestBalance = 0;
        ledgerRows.push({
          date: ev.date,
          description: "वार्षिक पुँजीकरण (पाकेको ब्याज सावाँमा गाभियो)",
          principalChange: capAmount,
          remainingInterest: 0,
          remainingPrincipal: currentPrincipal,
          isCapitalization: true,
        });
      }
    } else if (ev.type === "principal") {
      currentPrincipal -= ev.amount;
      totalPrincipalPaid += ev.amount;
      ledgerRows.push({
        date: ev.date,
        description: "सावाँ भुक्तानी (Principal Repayment)",
        principalChange: -ev.amount,
        remainingInterest: currentInterestBalance,
        remainingPrincipal: currentPrincipal,
      });
    } else if (ev.type === "interest") {
      const interestPaidNow = Math.min(ev.amount, currentInterestBalance);
      const principalAdjustment = ev.amount - interestPaidNow;
      if (interestPaidNow > 0) {
        currentInterestBalance -= interestPaidNow;
        totalInterestPaid += interestPaidNow;
        ledgerRows.push({
          date: ev.date,
          description: "ब्याज भुक्तानी (Interest Repayment)",
          interestPaid: interestPaidNow,
          remainingInterest: currentInterestBalance,
          remainingPrincipal: currentPrincipal,
        });
      }
      if (principalAdjustment > 0) {
        currentPrincipal -= principalAdjustment;
        totalPrincipalPaid += principalAdjustment;
        ledgerRows.push({
          date: ev.date,
          description: "ब्याजबाट सावाँमा सारिएको (Excess Interest to Principal)",
          principalChange: -principalAdjustment,
          remainingInterest: currentInterestBalance,
          remainingPrincipal: currentPrincipal,
        });
      }
    }
    lastDate = ev.date;
  }

  if (lastDate && lastDate < todayStr) {
    const interestTillToday = calcInterest(currentPrincipal, lastDate, todayStr);
    if (interestTillToday > 0.005) {
      currentInterestBalance += interestTillToday;
      totalInterestAccrued += interestTillToday;
      ledgerRows.push({
        date: todayStr,
        description: `${lastDate} देखि ${todayStr} (आजसम्म) को ब्याज`,
        interestAccrued: interestTillToday,
        remainingInterest: currentInterestBalance,
        remainingPrincipal: currentPrincipal,
      });
    }
  }

  // Calculate Duration
  let durationStr = "0 दिन";
  try {
    const sD = new Date(startDateStr);
    const eD = new Date(todayStr);
    let years = eD.getFullYear() - sD.getFullYear();
    let months = eD.getMonth() - sD.getMonth();
    let days = eD.getDate() - sD.getDate();
    if (days < 0) {
      months--;
      days += new Date(eD.getFullYear(), eD.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    const parts = [];
    if (years > 0) parts.push(`${years} वर्ष`);
    if (months > 0) parts.push(`${months} महिना`);
    if (days >= 0) parts.push(`${days} दिन`);
    durationStr = parts.join(", ") || "० दिन";
  } catch {
    durationStr = "N/A";
  }

  const finalTotalPrincipal = initialPrincipal + totalCapitalAdded;
  const remainingPrincipal = Math.max(0, currentPrincipal);
  const remainingInterest = Math.max(0, currentInterestBalance);
  const totalRemaining = remainingPrincipal + remainingInterest;

  return {
    initialPrincipal,
    finalTotalPrincipal,
    totalPrincipalPaid,
    totalInterestPaid,
    totalInterestAccrued,
    remainingPrincipal,
    remainingInterest,
    totalRemaining,
    durationStr,
    ledgerRows,
  };
}

export function LoanDetailsModal({
  loan,
  onClose,
  onAddPayment,
  formatMoney,
  t,
}: LoanDetailsModalProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const statement = calculateLoanStatement(loan, todayStr);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentType, setPaymentType] = useState<"principal" | "interest" | "capital_add">("principal");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const rateTypeBadge =
    loan.rate_type === "compound"
      ? { label: `${loan.rate || 0}% (वार्षिक चक्रीय)`, bg: "#6f42c1", color: "#fff" }
      : loan.rate_type === "per_thousand"
      ? { label: `रु. ${loan.rate || 0} (मासिक प्रतिहजार)`, bg: "#0d6efd", color: "#fff" }
      : loan.rate_type === "none"
      ? { label: "०% ब्याज", bg: "#6c757d", color: "#fff" }
      : { label: `${loan.rate || 0}% (साधारण वार्षिक)`, bg: "#198754", color: "#fff" };

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onAddPayment || !paymentAmount || Number(paymentAmount) <= 0) return;
    setSavingPayment(true);
    try {
      await onAddPayment(loan.id, {
        date: paymentDate,
        type: paymentType,
        amount: Number(paymentAmount),
        note: paymentNote,
      });
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentNote("");
    } catch {
      // handled in parent
    } finally {
      setSavingPayment(false);
    }
  }

  return (
    <div className="loan-modal-backdrop" onClick={onClose}>
      <div className="loan-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="loan-modal-header">
          <div className="loan-modal-title">
            <span className="loan-modal-icon">👁️</span>
            <div>
              <h3>{loan.person_name}</h3>
              <p className="loan-modal-subtitle">
                <span className={`direction-badge ${loan.direction}`}>
                  {loan.direction === "borrowed" ? t.borrowedLoan || "📥 लिएको ऋण" : t.lentLoan || "📤 दिएको ऋण"}
                </span>
                <span
                  style={{
                    marginLeft: "8px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    backgroundColor: rateTypeBadge.bg,
                    color: rateTypeBadge.color,
                  }}
                >
                  {rateTypeBadge.label}
                </span>
              </p>
            </div>
          </div>
          <button type="button" className="loan-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="loan-modal-body">
          {/* Quick Metrics Cards */}
          <div className="loan-metrics-grid">
            <div className="loan-metric-box primary">
              <span>{t.principalAmount || "सुरु सावाँ"}</span>
              <strong>{formatMoney(statement.initialPrincipal)}</strong>
            </div>
            <div className="loan-metric-box success">
              <span>{t.totalOutstanding || "बाँकी सावाँ"}</span>
              <strong>{formatMoney(statement.remainingPrincipal)}</strong>
            </div>
            <div className="loan-metric-box info">
              <span>{t.accruedInterest || "पाकेको ब्याज"}</span>
              <strong>{formatMoney(statement.totalInterestAccrued)}</strong>
            </div>
            <div className="loan-metric-box danger">
              <span>{t.totalPayable || "कुल बाँकी रकम"}</span>
              <strong style={{ color: "#dc3545" }}>{formatMoney(statement.totalRemaining)}</strong>
            </div>
          </div>

          {/* Loan Metadata Row */}
          <div className="loan-info-summary-bar">
            <div>
              <small>{t.loanStartDate || "सुरु मिति"}:</small>
              <b>{loan.start_date || (loan as any).created_at?.slice(0, 10) || "N/A"}</b>
            </div>
            <div>
              <small>{t.loanDuration || "कुल अवधि"}:</small>
              <b>{statement.durationStr}</b>
            </div>
            <div>
              <small>{t.dueDateLabel || "भाका मिति"}:</small>
              <b>{loan.due_date || "N/A"}</b>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="loan-actions-bar">
            <h4>{t.ledgerStatement || "ऋणको विस्तृत खाता (लेजर)"}</h4>
            {onAddPayment && (
              <button
                type="button"
                className="primary-button"
                style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                onClick={() => setShowPaymentForm(!showPaymentForm)}
              >
                {showPaymentForm ? "✕ फारम बन्द" : "+ भुक्तानी / सावाँ थप्नुहोस्"}
              </button>
            )}
          </div>

          {/* Add Payment Sub-form */}
          {showPaymentForm && (
            <form className="loan-inline-payment-form" onSubmit={handlePaymentSubmit}>
              <h5>नयाँ भुक्तानी वा सावाँ थप विवरण</h5>
              <div className="loan-form-grid">
                <label>
                  प्रकार (Type)
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                  >
                    <option value="principal">सावाँ भुक्तानी (Principal Payment)</option>
                    <option value="interest">ब्याज भुक्तानी (Interest Payment)</option>
                    <option value="capital_add">थप सावाँ रकम (Capital Top-up)</option>
                  </select>
                </label>
                <label>
                  रकम (Amount)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </label>
                <label>
                  मिति (Date)
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </label>
                <label>
                  कैफियत (Note)
                  <input
                    type="text"
                    placeholder="जस्तै: नगद, इसेवा, बैंक"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </label>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setShowPaymentForm(false)}
                >
                  रद्द
                </button>
                <button type="submit" className="primary-button" disabled={savingPayment}>
                  {savingPayment ? "सेभ हुँदैछ..." : "सेभ गर्नुहोस्"}
                </button>
              </div>
            </form>
          )}

          {/* Detailed Ledger Table */}
          <div className="loan-ledger-table-wrapper">
            <table className="loan-ledger-table">
              <thead>
                <tr>
                  <th>मिति</th>
                  <th>विवरण</th>
                  <th>ब्याज गणना</th>
                  <th>ब्याज भुक्तानी</th>
                  <th>सावाँ भुक्तानी/थप</th>
                  <th>बाँकी ब्याज</th>
                  <th>बाँकी सावाँ</th>
                </tr>
              </thead>
              <tbody>
                {statement.ledgerRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={row.isCapitalization ? "loan-row-capitalization" : ""}
                  >
                    <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{row.date}</td>
                    <td>
                      {row.isCapitalization ? (
                        <span className="capitalization-tag">
                          ⚡ {row.description}
                        </span>
                      ) : (
                        row.description
                      )}
                    </td>
                    <td style={{ color: "#0d6efd", fontWeight: 600 }}>
                      {row.interestAccrued ? `+ ${formatMoney(row.interestAccrued)}` : ""}
                    </td>
                    <td style={{ color: "#198754", fontWeight: 600 }}>
                      {row.interestPaid ? `- ${formatMoney(row.interestPaid)}` : ""}
                    </td>
                    <td
                      style={{
                        color:
                          row.principalChange && row.principalChange > 0
                            ? "#6f42c1"
                            : "#dc3545",
                        fontWeight: 600,
                      }}
                    >
                      {row.principalChange
                        ? row.principalChange > 0
                          ? `+ ${formatMoney(row.principalChange)}`
                          : `- ${formatMoney(Math.abs(row.principalChange))}`
                        : ""}
                    </td>
                    <td style={{ fontWeight: 700, color: "#0d6efd" }}>
                      {formatMoney(row.remainingInterest)}
                    </td>
                    <td style={{ fontWeight: 700, color: "#dc3545" }}>
                      {formatMoney(row.remainingPrincipal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>
                    <b>जम्मा (Total)</b>
                  </td>
                  <td style={{ color: "#0d6efd", fontWeight: 700 }}>
                    + {formatMoney(statement.totalInterestAccrued)}
                  </td>
                  <td style={{ color: "#198754", fontWeight: 700 }}>
                    - {formatMoney(statement.totalInterestPaid)}
                  </td>
                  <td style={{ color: "#dc3545", fontWeight: 700 }}>
                    - {formatMoney(statement.totalPrincipalPaid)}
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatMoney(statement.remainingInterest)}</td>
                  <td style={{ fontWeight: 700 }}>{formatMoney(statement.remainingPrincipal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="loan-modal-footer">
          <button type="button" className="primary-button" onClick={onClose}>
            {t.close || "बन्द गर्नुहोस्"}
          </button>
        </div>
      </div>
    </div>
  );
}
