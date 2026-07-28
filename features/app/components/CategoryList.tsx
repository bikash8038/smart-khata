"use client";

import React from "react";

interface Category { id: string; name_ne: string; name_en: string | null; kind: "income" | "expense"; parent_id: string | null; is_main: boolean }
interface CategoryListProps { items: Category[]; t: Record<string, string>; locale: "en" | "ne"; onEdit: (item: Category) => void; onDelete: (id: string) => void }

export function CategoryList({ items, t, locale, onEdit, onDelete }: CategoryListProps) {
  const label = (item: Category) => locale === "ne" ? item.name_ne : (item.name_en || item.name_ne);
  const ActionButtons = ({ item }: { item: Category }) => <span className="category-actions"><button type="button" className="action-btn-blue" onClick={() => onEdit(item)} title={t.edit}>✎</button><button type="button" className="action-btn-red" onClick={() => onDelete(item.id)} title={t.remove}>×</button></span>;
  const mainItems = items.filter((item) => item.is_main);
  const subItems = items.filter((item) => !item.is_main);
  const parentName = (item: Category) => label(items.find((parent) => parent.id === item.parent_id) ?? item);

  return <section className="record-panel category-settings"><h2>{t.categories}</h2><p className="category-help">{locale === "ne" ? "मुख्य श्रेणी र त्यसअन्तर्गतका उप-श्रेणी अलग-अलग व्यवस्थापन गर्नुहोस्।" : "Manage main categories and their subcategories separately."}</p><div className="category-settings-grid"><section className="category-list-section"><h3>{locale === "ne" ? "मुख्य श्रेणी" : "Main Categories"}</h3>{mainItems.length ? mainItems.map((item) => <article className="category-list-row" key={item.id}><div><strong>{label(item)}</strong><small>{item.kind === "income" ? t.income : t.expense}</small></div><ActionButtons item={item} /></article>) : <p className="empty-state">No main categories yet.</p>}</section><section className="category-list-section"><h3>{locale === "ne" ? "उप-श्रेणी" : "Subcategories"}</h3>{subItems.length ? subItems.map((item) => <article className="category-list-row" key={item.id}><div><strong>{label(item)}</strong><small>{parentName(item)} · {item.kind === "income" ? t.income : t.expense}</small></div><ActionButtons item={item} /></article>) : <p className="empty-state">No subcategories yet.</p>}</section></div></section>;
}
