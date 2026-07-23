"use client";

import React, { useMemo } from "react";

interface Category {
  id: string;
  name_ne: string;
  kind: "income" | "expense";
}

interface Transaction {
  id: string;
  amount: number;
  kind: "income" | "expense" | "transfer";
  category_id: string | null;
}

interface FinancialChartsProps {
  transactions: Transaction[];
  categories: Category[];
  formatMoney: (value: number) => string;
  t: Record<string, string>;
}

// Predefined colors for categories progress bars and donut segments
const progressColors = [
  "#2196f3", // Blue
  "#f44336", // Red
  "#00b0ff", // Light Blue
  "#ff9800", // Amber
  "#e91e63", // Pink
  "#9c27b0", // Purple
  "#4caf50", // Green
];

export function FinancialCharts({
  transactions,
  categories,
  formatMoney,
  t,
}: FinancialChartsProps) {

  // Calculate total income and expense
  const totals = useMemo(() => {
    return transactions.reduce(
      (result, row) => ({
        income: result.income + (row.kind === "income" ? Number(row.amount) : 0),
        expense: result.expense + (row.kind === "expense" ? Number(row.amount) : 0),
      }),
      { income: 0, expense: 0 }
    );
  }, [transactions]);

  // Calculate category wise expenses
  const { categoryExpenses, totalExpenseSum } = useMemo(() => {
    const expenseTx = transactions.filter((row) => row.kind === "expense");
    const totalsMap: Record<string, number> = {};
    let totalSum = 0;

    expenseTx.forEach((tx) => {
      const catId = tx.category_id || "uncategorized";
      const amt = Number(tx.amount);
      totalsMap[catId] = (totalsMap[catId] || 0) + amt;
      totalSum += amt;
    });

    const expensesList = Object.entries(totalsMap)
      .map(([catId, amount]) => {
        const catName =
          catId === "uncategorized"
            ? t.other || "Other"
            : categories.find((c) => c.id === catId)?.name_ne || t.other || "Other";
        return {
          id: catId,
          name: catName,
          amount,
          percentage: totalSum > 0 ? Math.round((amount / totalSum) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { categoryExpenses: expensesList, totalExpenseSum: totalSum };
  }, [transactions, categories, t.other]);

  // Circle properties for SVG Donut (Radius = 70, Circumference = 2 * Math.PI * 70 = 439.82)
  const circumference = 439.82;
  
  // Calculate segments angles and dash offsets for the Donut Chart
  const donutSegments = useMemo(() => {
    return categoryExpenses.map((cat, index) => {
      const accumulatedPercentage = categoryExpenses
        .slice(0, index)
        .reduce((sum, item) => sum + item.percentage, 0);

      const percentage = cat.percentage;
      const strokeLength = (percentage / 100) * circumference;
      const strokeOffset = circumference - strokeLength;
      const rotationAngle = (accumulatedPercentage / 100) * 360 - 90; // Starting at 12 o'clock (-90deg)
      return {
        ...cat,
        strokeLength,
        strokeOffset,
        rotationAngle,
        color: progressColors[index % progressColors.length],
      };
    });
  }, [categoryExpenses]);

  return (
    <div className="charts-container-grid">
      {/* Premium Doughnut Card for Expense Breakdown */}
      <section className="surface-card chart-card doughnut-card-container">
        <div className="card-title">
          <div>
            <h2>{t.expenseBreakdown}</h2>
            <p>{t.expenseSummary}</p>
          </div>
        </div>

        <div className="doughnut-chart-layout">
          {totalExpenseSum === 0 ? (
            <div className="empty-donut-wrapper">
              <svg width="220" height="220" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="transparent"
                  stroke="#e2e8f0"
                  strokeWidth="20"
                />
                <text x="100" y="105" textAnchor="middle" fill="#94a3b8" fontSize="0.9rem" fontWeight="bold">
                  {t.noTransactions || "No transactions"}
                </text>
              </svg>
            </div>
          ) : (
            <>
              {/* SVG Donut Chart */}
              <div className="doughnut-svg-wrapper">
                <svg width="220" height="220" viewBox="0 0 200 200">
                  {/* Background Track */}
                  <circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="20"
                  />
                  {/* Category Segments */}
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.id}
                      cx="100"
                      cy="100"
                      r="70"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="20"
                      strokeDasharray={circumference}
                      strokeDashoffset={seg.strokeOffset}
                      transform={`rotate(${seg.rotationAngle} 100 100)`}
                      strokeLinecap={seg.percentage > 1 ? "round" : "butt"}
                      className="donut-segment-circle"
                    />
                  ))}
                  {/* Inner Title and Total */}
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="0.82rem"
                    fontWeight="700"
                  >
                    {t.totalExpenseLabel}
                  </text>
                  <text
                    x="100"
                    y="120"
                    textAnchor="middle"
                    fill="#0f766e"
                    fontSize="1.1rem"
                    fontWeight="850"
                  >
                    {formatMoney(totalExpenseSum)}
                  </text>
                </svg>
              </div>

              {/* Chart Legend List */}
              <div className="doughnut-legend-list">
                {donutSegments.map((seg) => (
                  <div className="legend-item" key={seg.id}>
                    <span className="legend-color-dot" style={{ backgroundColor: seg.color }} />
                    <div className="legend-item-info">
                      <span className="legend-name">{seg.name}</span>
                      <span className="legend-value">{formatMoney(seg.amount)} ({seg.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Summary Card comparing Cash Flow (Income vs Expense in clean layout) */}
      <section className="surface-card chart-card cash-flow-summary-card">
        <div className="card-title">
          <div>
            <h2>{t.transactionSummary}</h2>
            <p>{t.monthlyIncomeExpense}</p>
          </div>
        </div>
        
        <div className="cash-flow-progress-wrapper">
          <div className="cash-flow-item">
            <div className="cash-flow-header">
              <span>{t.totalIncomeLabel}</span>
              <strong className="income-amount">{formatMoney(totals.income)}</strong>
            </div>
            <div className="cash-flow-progress-bar">
              <span className="cash-flow-fill income" style={{ width: totals.income > 0 ? "100%" : "0%" }} />
            </div>
          </div>

          <div className="cash-flow-item">
            <div className="cash-flow-header">
              <span>{t.totalExpenseLabel}</span>
              <strong className="expense-amount">{formatMoney(totals.expense)}</strong>
            </div>
            <div className="cash-flow-progress-bar">
              <span
                className="cash-flow-fill expense"
                style={{
                  width: totals.income > 0 ? `${Math.min(100, Math.round((totals.expense / totals.income) * 100))}%` : totals.expense > 0 ? "100%" : "0%",
                }}
              />
            </div>
          </div>

          <div className="cash-flow-net-card">
            <span>{t.savingsLabelMonth}</span>
            <strong className={totals.income - totals.expense >= 0 ? "positive" : "negative"}>
              {formatMoney(totals.income - totals.expense)}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}
