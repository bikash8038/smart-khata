"use client";

import React, { FormEvent } from "react";
import type { FinanceSection } from "./FinanceModule";

interface FinanceFormProps {
  section: FinanceSection;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  t: Record<string, string>;
}

export function FinanceForm({ section, onCancel, onSubmit, t }: FinanceFormProps) {
  const [selectedRateType, setSelectedRateType] = React.useState<string>("percent");

  const formTitle =
    section === "budgets"
      ? t.addBudget
      : section === "loans"
      ? t.addLoan
      : section === "goals"
      ? t.addGoal
      : t.addDetails;

  return (
    <form className="data-form finance-form" onSubmit={onSubmit}>
      <h2>{formTitle}</h2>
      
      {section === "budgets" && (
        <>
          <label>
            {t.amountRs}
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              autoComplete="off"
            />
          </label>
          <label>
            {t.startDate}
            <input
              name="start"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </label>
          <label>
            {t.endDate}
            <input
              name="end"
              type="date"
              defaultValue={new Date(new Date().setMonth(new Date().getMonth() + 1))
                .toISOString()
                .slice(0, 10)}
              required
            />
          </label>
        </>
      )}

      {section === "loans" && (
        <>
          <label>
            {t.personName}
            <input
              name="personName"
              required
              placeholder={t.placeholderPerson}
              autoComplete="off"
            />
          </label>
          <label>
            {t.loanType}
            <select name="direction">
              <option value="borrowed">{t.borrowed}</option>
              <option value="lent">{t.lent}</option>
            </select>
          </label>
          <label>
            {t.principalAmount}
            <input
              name="principal"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              autoComplete="off"
            />
          </label>
          <label>
            {t.outstandingAmount}
            <input
              name="outstanding"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              autoComplete="off"
            />
          </label>
          <label>
            {t.rateType}
            <select
              name="rateType"
              value={selectedRateType}
              onChange={(e) => setSelectedRateType(e.target.value)}
            >
              <option value="percent">{t.simpleAnnual || "Simple Annual %"}</option>
              <option value="compound">{t.annualCompound || "Annual Compound % (Banking)"}</option>
              <option value="per_thousand">{t.monthlyPerThousand || "Monthly per Rs. 1000"}</option>
              <option value="none">{t.noInterest || "No Interest (0%)"}</option>
            </select>
          </label>

          {selectedRateType !== "none" && (
            <label>
              {t.interestRate} {selectedRateType === "per_thousand" ? "(रु. प्रति हजार)" : "(%)"}
              <input
                name="rate"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue="12"
                placeholder={selectedRateType === "per_thousand" ? "e.g. 20" : "e.g. 12"}
                autoComplete="off"
              />
              {selectedRateType === "compound" && (
                <small style={{ color: "#6f42c1", fontWeight: 600, marginTop: "4px", display: "block" }}>
                  💡 {t.capitalizedNote || "Unpaid interest capitalized to principal annually"}
                </small>
              )}
            </label>
          )}

          <label>
            {t.loanStartDate || "Loan Start Date"}
            <input
              name="startDate"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </label>

          <label>
            {t.dueDateLabel}
            <input name="dueDate" type="date" />
          </label>

          <label>
            {t.loanNote || "Purpose / Note"}
            <input
              name="note"
              type="text"
              placeholder={t.placeholderLoanNote || "e.g., Personal, business"}
              autoComplete="off"
            />
          </label>
        </>
      )}

      {section === "goals" && (
        <>
          <label>
            {t.goalName}
            <input
              name="title"
              required
              placeholder={t.placeholderGoal}
              autoComplete="off"
            />
          </label>
          <label>
            {t.targetAmount}
            <input
              name="target"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0.00"
              autoComplete="off"
            />
          </label>
          <label>
            {t.currentSavings}
            <input
              name="current"
              type="number"
              min="0"
              step="0.01"
              defaultValue="0"
              placeholder="0.00"
              autoComplete="off"
            />
          </label>
          <label>
            {t.targetDate}
            <input name="targetDate" type="date" />
          </label>
        </>
      )}

      <div className="form-actions">
        <button type="button" className="text-button" onClick={onCancel}>
          {t.cancel}
        </button>
        <button type="submit" className="primary-button">
          {t.save}
        </button>
      </div>
    </form>
  );
}
