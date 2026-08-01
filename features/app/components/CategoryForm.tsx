"use client";

import React, { FormEvent, useMemo, useState } from "react";

import type { Category } from "../types/workspace";
interface CategoryFormProps { t: Record<string, string>; locale: "en" | "ne"; mode: "main" | "sub"; categories: Category[]; current: Category | null; userRole?: "user" | "admin" | "super_admin"; onCancel: () => void; onSave: (event: FormEvent<HTMLFormElement>) => void }

export function CategoryForm({ t, locale, mode, categories, current, userRole, onCancel, onSave }: CategoryFormProps) {
  const [kind, setKind] = useState<"income" | "expense">(current?.kind ?? "expense");
  const mainCategories = useMemo(() => categories.filter((category) => category.kind === kind && category.is_main && category.id !== current?.id), [categories, kind, current?.id]);
  const heading = mode === "main" ? (current ? "Edit Main Category" : "Add Main Category") : (current ? "Edit Subcategory" : "Add Subcategory");
  const label = (category: Category) => locale === "ne" ? category.name_ne : (category.name_en || category.name_ne);

  return <form className="data-form" onSubmit={onSave}>
    <h2>{heading}</h2>
    <input type="hidden" name="mode" value={mode} />
    <label>{t.transactionType}<select name="kind" value={kind} onChange={(event) => setKind(event.target.value as "income" | "expense")}><option value="expense">{t.expense}</option><option value="income">{t.income}</option></select></label>
    {mode === "sub" && <label>{locale === "ne" ? "मुख्य श्रेणी" : "Main Category"}<select name="parentCategory" required defaultValue={current?.parent_id ?? ""}><option value="">{locale === "ne" ? "मुख्य श्रेणी छान्नुहोस्" : "Choose Main Category"}</option>{mainCategories.map((category) => <option key={category.id} value={category.id}>{label(category)}</option>)}</select></label>}
    <label>{locale === "ne" ? "नेपाली नाम" : "Nepali Name"}<input name="name_ne" required defaultValue={current?.name_ne ?? ""} placeholder="घरायसी तथा दैनिक खर्च" autoComplete="off" /></label>
    <label>{locale === "ne" ? "अंग्रेजी नाम" : "English Name"}<input name="name_en" required defaultValue={current?.name_en ?? ""} placeholder="Household & Daily Expenses" autoComplete="off" /></label>
    {userRole === "super_admin" && (
      <label className="checkbox-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "750", margin: "6px 0 12px", color: "#193b3a" }}>
        <input 
          type="checkbox" 
          name="is_system" 
          defaultChecked={current?.is_system ?? false} 
          style={{ width: "16px", height: "16px", cursor: "pointer" }} 
        />
        {locale === "ne" ? "डिफेल्ट राख्ने (सबै प्रयोगकर्ताकोमा देखिने)" : "Set as Default (Visible to all users)"}
      </label>
    )}
    <div className="form-actions"><button type="button" className="text-button" onClick={onCancel}>{t.cancel}</button><button type="submit" className="primary-button">{t.save}</button></div>
  </form>;
}
