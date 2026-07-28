"use client";

import React, { FormEvent, useMemo, useState } from "react";

interface Category { id: string; name_ne: string; kind: "income" | "expense"; parent_id: string | null; is_main: boolean }
interface CategoryFormProps { t: Record<string, string>; categories: Category[]; onCancel: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }

export function CategoryForm({ t, categories, onCancel, onSave }: CategoryFormProps) {
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [level, setLevel] = useState<"main" | "sub">("sub");
  const mainCategories = useMemo(() => categories.filter((category) => category.kind === kind && category.is_main), [categories, kind]);

  return <form className="data-form" onSubmit={onSave}>
    <h2>{t.addCategory}</h2>
    <label>{t.transactionType}<select name="kind" value={kind} onChange={(event) => setKind(event.target.value as "income" | "expense")}><option value="expense">{t.expense}</option><option value="income">{t.income}</option></select></label>
    <label>Category Level<select name="level" value={level} onChange={(event) => setLevel(event.target.value as "main" | "sub")}><option value="sub">Subcategory</option><option value="main">Main Category</option></select></label>
    {level === "sub" && <label>Main Category<select name="parentCategory" required><option value="">Choose Main Category</option>{mainCategories.map((category) => <option key={category.id} value={category.id}>{category.name_ne}</option>)}</select></label>}
    <label>{level === "main" ? "Main Category Name" : "Subcategory Name"}<input name="name" required placeholder={level === "main" ? "Main category name" : "Subcategory name"} autoComplete="off" /></label>
    <div className="form-actions"><button type="button" className="text-button" onClick={onCancel}>{t.cancel}</button><button type="submit" className="primary-button">{t.save}</button></div>
  </form>;
}
