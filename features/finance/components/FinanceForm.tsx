"use client";

import React, { FormEvent, useState } from "react";
import type { FinanceSection } from "./FinanceModule";
import { NepaliDatePicker } from "../../../components/ui/NepaliDatePicker";

interface FinanceFormProps {
  section: FinanceSection;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  t: Record<string, string>;
  locale?: "en" | "ne";
}

export function FinanceForm({ section, onCancel, onSubmit, t, locale = "ne" }: FinanceFormProps) {
  const [selectedRateType, setSelectedRateType] = useState<string>("percent");
  
  // Datepicker States
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [budgetStart, setBudgetStart] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [budgetEnd, setBudgetEnd] = useState<string>(() =>
    new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10)
  );
  const [goalTargetDate, setGoalTargetDate] = useState<string>("");

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
          <div className="form-row-2col amount-date-row">
            <label className="date-input-label">
              {t.startDate}
              <NepaliDatePicker
                value={budgetStart}
                onChange={setBudgetStart}
                locale={locale}
                name="start"
              />
            </label>
            <label className="date-input-label">
              {t.endDate}
              <NepaliDatePicker
                value={budgetEnd}
                onChange={setBudgetEnd}
                locale={locale}
                name="end"
              />
            </label>
          </div>
        </>
      )}

      {section === "loans" && (
        <>
          <div className="form-row-2col">
            <label>
              <span className="label-text">
                {t.personName} <span className="required-star">*</span>
              </span>
              <input
                name="personName"
                required
                placeholder={t.placeholderPerson}
                autoComplete="off"
              />
            </label>
            <label>
              <span className="label-text">
                {t.loanType} <span className="required-star">*</span>
              </span>
              <select name="direction" required>
                <option value="borrowed">{t.borrowed}</option>
                <option value="lent">{t.lent}</option>
              </select>
            </label>
          </div>

          <div className="form-row-2col amount-date-row">
            <label>
              <span className="label-text">
                {t.principalAmount} <span className="required-star">*</span>
              </span>
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
            <label className="date-input-label">
              <span className="label-text">
                {t.loanStartDate || "Loan Start Date"} <span className="required-star">*</span>
              </span>
              <NepaliDatePicker
                value={startDate}
                onChange={setStartDate}
                locale={locale}
                name="startDate"
              />
            </label>
          </div>

          <div className="form-row-2col">
            <label>
              <span className="label-text">
                {t.rateType} <span className="required-star">*</span>
              </span>
              <select
                name="rateType"
                value={selectedRateType}
                onChange={(e) => setSelectedRateType(e.target.value)}
                required
              >
                <option value="percent">{t.simpleAnnual || "Simple Annual %"}</option>
                <option value="compound">{t.annualCompound || "Annual Compound % (Banking)"}</option>
                <option value="per_thousand">{t.monthlyPerThousand || "Monthly per Rs. 1000"}</option>
                <option value="none">{t.noInterest || "No Interest (0%)"}</option>
              </select>
            </label>

            {selectedRateType !== "none" ? (
              <label>
                <span className="label-text">
                  {t.interestRate || "Interest Rate"} {selectedRateType === "per_thousand" ? (locale === "ne" ? "(रु.)" : "(Rs.)") : "(%)"} <span className="required-star">*</span>
                </span>
                <input
                  name="rate"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder={
                    selectedRateType === "per_thousand"
                      ? (locale === "ne" ? "रु. मा ब्याजदर" : "Interest rate in Rs.")
                      : (locale === "ne" ? "प्रतिशतमा ब्याजदर" : "Interest rate in %")
                  }
                  autoComplete="off"
                />
              </label>
            ) : (
              <div />
            )}
          </div>

          {selectedRateType === "compound" && (
            <small style={{ color: "#6f42c1", fontWeight: 600, marginTop: "-4px", marginBottom: "12px", display: "block" }}>
              💡 {t.capitalizedNote || "Unpaid interest capitalized to principal annually"}
            </small>
          )}

          <label>
            <span className="label-text">
              {t.loanNote || "Purpose / Note"} <span className="optional-text">({locale === "ne" ? "ऐच्छिक" : "Optional"})</span>
            </span>
            <input
              name="note"
              type="text"
              placeholder={t.placeholderLoanNote || "e.g., Personal use, business expansion"}
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
          <div className="form-row-2col">
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
          </div>
          <label className="date-input-label">
            {t.targetDate}
            <NepaliDatePicker
              value={goalTargetDate}
              onChange={setGoalTargetDate}
              locale={locale}
              name="targetDate"
              placeholder={locale === "ne" ? "लक्ष्य मिति छान्नुहोस्" : "Select Target Date"}
            />
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
