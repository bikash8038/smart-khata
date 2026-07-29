"use client";
import React, { useMemo, useState } from "react";
interface Category { id: string; name_ne: string; name_en: string | null; kind: "income" | "expense" }
interface Transaction { id: string; amount: number; kind: "income" | "expense" | "transfer"; category_id: string | null }
interface FinancialChartsProps { transactions: Transaction[]; categories: Category[]; formatMoney: (value: number) => string; t: Record<string, string>; locale: "en" | "ne" }
const incomeColors = ["#155eef", "#3b82f6", "#60a5fa", "#38bdf8", "#6366f1", "#818cf8", "#0ea5e9"];
const expenseColors = ["#b42318", "#dc2626", "#ef4444", "#f97316", "#fb7185", "#e11d48", "#f43f5e"];
function Donut({ title, items, total, formatMoney, colors }: { title: string; items: Array<{ name: string; amount: number }>; total: number; formatMoney: (value: number) => string; colors: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState<{ name: string; amount: number } | null>(null);
  const visibleItems = expanded ? items : items.slice(0, 10);
  const segments = items.reduce<Array<{ item: { name: string; amount: number }; color: string; offset: number; length: number }>>((result, item, index) => { const length = total ? item.amount / total * 439.82 : 0; const offset = result.reduce((sum, part) => sum + part.length, 0); result.push({ item, color: colors[index % colors.length], offset, length }); return result; }, []);
  const active = hovered ?? { name: "NPR", amount: total };
  const percent = total ? Math.round((active.amount / total) * 100) : 0;
  return <section className="surface-card chart-card category-donut-card"><h2>{title}</h2><div className="category-donut"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="70" fill="none" stroke="#e2e8f0" strokeWidth="20" />{segments.map((segment) => <circle key={segment.item.name} cx="100" cy="100" r="70" fill="none" stroke={segment.color} strokeWidth="20" strokeDasharray={`${segment.length} ${439.82 - segment.length}`} strokeDashoffset={-segment.offset} transform="rotate(-90 100 100)" onMouseEnter={() => setHovered(segment.item)} onMouseLeave={() => setHovered(null)} />)}</svg><div><small>{active.name}</small><span>{formatMoney(active.amount)}</span><em>{hovered ? `(${percent}%)` : ""}</em></div></div><div className="donut-legend">{items.length ? visibleItems.map((item, i) => <p key={item.name}><i style={{ background: colors[i % colors.length] }} />{item.name}<b>{formatMoney(item.amount)} ({total ? Math.round(item.amount / total * 100) : 0}%)</b></p>) : <p>No records yet</p>}{items.length > 10 && <button type="button" className="see-more" onClick={() => setExpanded(!expanded)}>{expanded ? "See less" : "See more…"}</button>}</div></section>;
}
export function FinancialCharts({ transactions, categories, formatMoney, t, locale }: FinancialChartsProps) {
  const groups = useMemo(() => (["income", "expense"] as const).map(kind => { const totals: Record<string, number> = {}; transactions.filter(row => row.kind === kind).forEach(row => { const id = row.category_id || "other"; totals[id] = (totals[id] || 0) + Number(row.amount); }); const items = Object.entries(totals).map(([id, amount]) => { const category = categories.find(c => c.id === id); return { name: id === "other" ? (t.other || "Other") : (category ? (locale === "ne" ? category.name_ne : category.name_en || category.name_ne) : t.other || "Other"), amount }; }).sort((a,b) => b.amount-a.amount); return { items, total: items.reduce((sum, item) => sum + item.amount, 0) }; }), [transactions, categories, t.other, locale]);
  const [income, expense] = groups;
  const titles = locale === "ne" ? ["समग्र विश्लेषण", "आम्दानीको विश्लेषण (शीर्षक अनुसार)", "खर्चको विश्लेषण (शीर्षक अनुसार)"] : ["Overall Analysis", "Income Analysis (by category)", "Expense Analysis (by category)"];
  return <div className="charts-container-grid"><Donut title={titles[0]} items={[{name:t.income,amount:income.total},{name:t.expense,amount:expense.total}]} total={income.total + expense.total} formatMoney={formatMoney} colors={["#168b55", "#b42318"]}/><Donut title={titles[1]} items={income.items} total={income.total} formatMoney={formatMoney} colors={incomeColors}/><Donut title={titles[2]} items={expense.items} total={expense.total} formatMoney={formatMoney} colors={expenseColors}/></div>;
}
