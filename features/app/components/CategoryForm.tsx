"use client";

import React, { FormEvent } from "react";

interface CategoryFormProps {
  t: Record<string, string>;
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}

export function CategoryForm({ t, onCancel, onSave }: CategoryFormProps) {
  return (
    <form className="data-form" onSubmit={onSave}>
      <h2>{t.addCategory}</h2>
      
      <label>
        {t.categoryName}
        <input name="name" required placeholder="जैसे: यातायात, तलब" autoComplete="off" />
      </label>
      
      <label>
        {t.transactionType}
        <select name="kind">
          <option value="expense">{t.expense}</option>
          <option value="income">{t.income}</option>
        </select>
      </label>
      
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
