"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { PageSkeleton } from "../../../components/ui/AppSkeleton";
import { BudgetList } from "./BudgetList";
import { LoanList } from "./LoanList";
import { GoalList } from "./GoalList";
import { ReportModule } from "./ReportModule";
import { NotificationList } from "./NotificationList";
import { FinanceForm } from "./FinanceForm";
import "../styles/finance-module.css";

export type FinanceSection = "budgets" | "loans" | "goals" | "reports" | "notifications";

interface Budget { id: string; amount: number; period_start: string; period_end: string }
interface Loan { id: string; person_name: string; direction: "borrowed" | "lent"; principal_amount: number; outstanding_amount: number; due_date: string | null }
interface Goal { id: string; title: string; target_amount: number; current_amount: number; target_date: string | null }
interface Notice { id: string; title: string; message: string; is_read: boolean; created_at: string }
interface ReportTransaction { kind: "income" | "expense" | "transfer"; amount: number; transaction_date: string }

interface FinanceModuleProps {
  section: FinanceSection;
  user: User;
  t: Record<string, string>;
  locale: "en" | "ne";
}

export function FinanceModule({ section, user, t, locale }: FinanceModuleProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<Notice[]>([]);
  const [reportTransactions, setReportTransactions] = useState<ReportTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  // Dynamic translated headings/descriptions
  const text = useMemo(() => {
    const copyMap: Record<FinanceSection, { title: string; description: string; action?: string }> = {
      budgets: { title: t.budgets, description: t.budgetsDescription, action: t.addBudget },
      loans: { title: t.loans, description: t.loansDescription, action: t.addLoan },
      goals: { title: t.goals, description: t.goalsDescription, action: t.addGoal },
      reports: { title: t.reports, description: t.reportsDescription },
      notifications: { title: t.notifications, description: t.notificationsDescription },
    };
    return copyMap[section];
  }, [section, t]);

  // Localized Money Formatter
  const formatMoney = useCallback((val: number) => {
    return new Intl.NumberFormat(locale === "ne" ? "ne-NP" : "en-US", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 2,
    }).format(val);
  }, [locale]);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoading(true);
    let error: Error | null = null;
    try {
      if (section === "budgets") {
        const result = await supabase.from("budgets").select("id,amount,period_start,period_end").order("period_start", { ascending: false });
        error = result.error;
        setBudgets((result.data ?? []) as Budget[]);
      }
      if (section === "loans") {
        const result = await supabase.from("loans").select("id,person_name,direction,principal_amount,outstanding_amount,due_date").order("created_at", { ascending: false });
        error = result.error;
        setLoans((result.data ?? []) as Loan[]);
      }
      if (section === "goals") {
        const result = await supabase.from("goals").select("id,title,target_amount,current_amount,target_date").order("created_at", { ascending: false });
        error = result.error;
        setGoals((result.data ?? []) as Goal[]);
      }
      if (section === "reports") {
        const result = await supabase.from("transactions").select("kind,amount,transaction_date");
        error = result.error;
        setReportTransactions((result.data ?? []) as ReportTransaction[]);
      }
      if (section === "notifications") {
        const result = await supabase.from("notifications").select("id,title,message,is_read,created_at").order("created_at", { ascending: false });
        error = result.error;
        setNotifications((result.data ?? []) as Notice[]);
      }

      if (error) {
        setNotice(t.loadError || error.message);
      }
    } catch {
      setNotice(t.networkError || "Network error occurred.");
    } finally {
      setLoading(false);
    }
  }, [section, t.loadError, t.networkError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  // Clear notice after 3 seconds to sync with progress bar animation
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      setNotice("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setNotice(t.dbUnavailable || "Database unavailable.");
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const start = String(form.get("start") ?? "");
    const end = String(form.get("end") ?? "");
    const target = Number(form.get("target") || 0);
    const current = Number(form.get("current") || 0);
    const outstanding = Number(form.get("outstanding") || 0);
    const principal = Number(form.get("principal") || 0);
    if ((section === "budgets" && end < start) || (section === "goals" && current > target) || (section === "loans" && outstanding > principal)) {
      setNotice("Please check the dates and amounts entered.");
      return;
    }
    try {
      let error: Error | null = null;
      if (section === "budgets") {
        const amt = Number(form.get("amount"));
        const start = String(form.get("start"));
        const end = String(form.get("end"));
        const result = await supabase.from("budgets").insert({ user_id: user.id, amount: amt, period_start: start, period_end: end });
        error = result.error;
      }
      if (section === "loans") {
        const name = String(form.get("personName"));
        const dir = String(form.get("direction")) as "borrowed" | "lent";
        const principal = Number(form.get("principal"));
        const outstanding = Number(form.get("outstanding"));
        const due = String(form.get("dueDate")) || null;
        const result = await supabase.from("loans").insert({ user_id: user.id, person_name: name, direction: dir, principal_amount: principal, outstanding_amount: outstanding, due_date: due });
        error = result.error;
      }
      if (section === "goals") {
        const title = String(form.get("title"));
        const target = Number(form.get("target"));
        const curr = Number(form.get("current") || 0);
        const due = String(form.get("targetDate")) || null;
        const result = await supabase.from("goals").insert({ user_id: user.id, title, target_amount: target, current_amount: curr, target_date: due });
        error = result.error;
      }

      if (error) {
        setNotice(error.message);
        return;
      }

      formElement.reset();
      setShowForm(false);
      load();
    } catch {
      setNotice(t.saveAccountError || "Error saving record.");
    }
  }

  async function removeItem(table: "budgets" | "loans" | "goals", id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) {
        setNotice(error.message);
        return;
      }
      load();
    } catch {
      setNotice(t.deleteTransactionError || "Error deleting record.");
    }
  }

  async function markRead(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) {
        setNotice(error.message);
        return;
      }
      load();
    } catch {
      setNotice("Could not update notice status.");
    }
  }

  const report = useMemo(() => {
    return reportTransactions.reduce(
      (total, row) => ({
        income: total.income + (row.kind === "income" ? Number(row.amount) : 0),
        expense: total.expense + (row.kind === "expense" ? Number(row.amount) : 0),
      }),
      { income: 0, expense: 0 }
    );
  }, [reportTransactions]);

  return (
    <section className="finance-page">
      <div className="finance-heading">
        <div>
          <h1>{text.title}</h1>
          <p>{text.description}</p>
        </div>
        {text.action && (
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowForm(true)}
          >
            {text.action}
          </button>
        )}
      </div>

      {notice && (
        <div className="workspace-notice">
          <span className="notice-text">{notice}</span>
          <div className="notice-progress-bar" />
        </div>
      )}

      {loading ? (
        <PageSkeleton />
      ) : (
        <>
          {section === "budgets" && (
            <BudgetList
              items={budgets}
              onDelete={(id) => removeItem("budgets", id)}
              formatMoney={formatMoney}
              t={t}
            />
          )}
          {section === "loans" && (
            <LoanList
              items={loans}
              onDelete={(id) => removeItem("loans", id)}
              formatMoney={formatMoney}
              t={t}
            />
          )}
          {section === "goals" && (
            <GoalList
              items={goals}
              onDelete={(id) => removeItem("goals", id)}
              formatMoney={formatMoney}
              t={t}
            />
          )}
          {section === "reports" && (
            <ReportModule
              income={report.income}
              expense={report.expense}
              count={reportTransactions.length}
              transactions={reportTransactions}
              formatMoney={formatMoney}
              t={t}
            />
          )}
          {section === "notifications" && (
            <NotificationList
              items={notifications}
              onRead={markRead}
              t={t}
            />
          )}
        </>
      )}

      {showForm && (
        <FinanceForm
          section={section}
          onCancel={() => setShowForm(false)}
          onSubmit={addItem}
          t={t}
        />
      )}
    </section>
  );
}
