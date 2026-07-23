"use client";

import React from "react";

interface Category {
  id: string;
  name_ne: string;
  kind: "income" | "expense";
}

interface CategoryListProps {
  items: Category[];
  t: Record<string, string>;
  onDelete: (id: string) => void;
}

export function CategoryList({ items, t, onDelete }: CategoryListProps) {
  return (
    <section className="record-panel">
      <h2>{t.categories}</h2>
      {items.length === 0 ? (
        <p className="empty-state">{t.addCategory}</p>
      ) : (
        items.map((item) => (
          <article className="record-row" key={item.id}>
            <div>
              <strong>{item.name_ne}</strong>
              <p>{item.kind === "income" ? t.income : t.expense}</p>
            </div>
            <button
              type="button"
              className="action-btn-red"
              onClick={() => onDelete(item.id)}
              title={t.remove}
              aria-label={t.remove}
            >
              <svg className="action-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </article>
        ))
      )}
    </section>
  );
}
