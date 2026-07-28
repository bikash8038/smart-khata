"use client";

import React from "react";

interface Category { id: string; name_ne: string; kind: "income" | "expense"; parent_id: string | null; is_main: boolean }
interface CategoryListProps { items: Category[]; t: Record<string, string>; onDelete: (id: string) => void }

export function CategoryList({ items, t, onDelete }: CategoryListProps) {
  const renderKind = (kind: "income" | "expense") => {
    const mains = items.filter((item) => item.kind === kind && item.is_main);
    return <section className="category-group" key={kind}><h3>{kind === "income" ? t.income : t.expense}</h3>{mains.map((main) => {
      const subs = items.filter((item) => item.parent_id === main.id && !item.is_main);
      return <article className="category-main-row" key={main.id}><div className="category-main-heading"><strong>{main.name_ne}</strong><button type="button" className="action-btn-red" onClick={() => onDelete(main.id)} title={t.remove}>×</button></div><div className="category-sub-list">{subs.length ? subs.map((sub) => <div className="category-sub-row" key={sub.id}><span>{sub.name_ne}</span><button type="button" className="action-btn-red" onClick={() => onDelete(sub.id)} title={t.remove}>×</button></div>) : <small>No subcategories yet.</small>}</div></article>;
    })}</section>;
  };

  return <section className="record-panel category-settings"><h2>{t.categories}</h2><p className="category-help">Create and manage main categories and their subcategories.</p>{items.length === 0 ? <p className="empty-state">{t.addCategory}</p> : <div className="category-groups">{renderKind("expense")}{renderKind("income")}</div>}</section>;
}
