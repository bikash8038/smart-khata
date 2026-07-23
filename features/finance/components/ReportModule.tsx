"use client";

import React, { useMemo, useState } from "react";

interface ReportModuleProps {
  income: number;
  expense: number;
  count: number;
  transactions: Array<{ kind: "income" | "expense" | "transfer"; amount: number; transaction_date: string }>;
  formatMoney: (value: number) => string;
  t: Record<string, string>;
}

export function ReportModule({ income, expense, count, transactions, formatMoney, t }: ReportModuleProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const filtered = useMemo(() => transactions.filter((item) => (!from || item.transaction_date >= from) && (!to || item.transaction_date <= to)), [transactions, from, to]);
  const totals = useMemo(() => filtered.reduce((value, item) => ({ income: value.income + (item.kind === "income" ? Number(item.amount) : 0), expense: value.expense + (item.kind === "expense" ? Number(item.amount) : 0) }), { income: 0, expense: 0 }), [filtered]);
  const displayIncome = from || to ? totals.income : income;
  const displayExpense = from || to ? totals.expense : expense;
  const displayCount = from || to ? filtered.length : count;
  const savings = displayIncome - displayExpense;

  function downloadCsv() {
    const csv = ["Date,Type,Amount", ...filtered.map((item) => `${item.transaction_date},${item.kind},${Number(item.amount)}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = "smart-khata-report.csv"; link.click(); URL.revokeObjectURL(url);
  }
  
  return (
    <div className="report-module">
      <section className="summary-grid">
        <article className="summary-card income">
          <div className="summary-card-header">
            <p>{t.totalIncome}</p>
            <span className="summary-icon">📈</span>
          </div>
          <strong>{formatMoney(displayIncome)}</strong>
        </article>
        
        <article className="summary-card expense">
          <div className="summary-card-header">
            <p>{t.totalExpense}</p>
            <span className="summary-icon">📉</span>
          </div>
          <strong>{formatMoney(displayExpense)}</strong>
        </article>
        
        <article className={`summary-card savings ${savings >= 0 ? "positive" : "negative"}`}>
          <div className="summary-card-header">
            <p>{t.savingsLoss}</p>
            <span className="summary-icon">✦</span>
          </div>
          <strong>{formatMoney(savings)}</strong>
          <small className="trend-label">
            {savings >= 0 ? t.onTrackMsg : t.cutSpendingMsg}
          </small>
        </article>
      </section>
      
      <section className="record-panel">
        <div className="report-header"><h2>{t.reportDetails}</h2><button type="button" className="outline-button" onClick={downloadCsv}>Export CSV</button></div>
        <div className="report-filters">
          <label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
          <label>To<input type="date" min={from || undefined} value={to} onChange={(event) => setTo(event.target.value)} /></label>
        </div>
        <p className="empty-state">
          {t.reportDescription.replace("{count}", String(displayCount))}
        </p>
      </section>
    </div>
  );
}
