"use client";

import React, { FormEvent } from "react";

interface AccountFormProps {
  t: Record<string, string>;
  locale: "en" | "ne";
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  current?: { id: string; name: string; account_type: string; opening_balance: number } | null;
}

export function AccountForm({ t, locale, onCancel, onSave, current }: AccountFormProps) {
  return (
    <form className="data-form" onSubmit={onSave}>
      <h2>{current ? t.edit : t.addAccount}</h2>
      <label>{t.accountName}<input name="name" required defaultValue={current?.name ?? ""} placeholder={t.accountNamePlaceholder} autoComplete="off" /></label>
      <label>{t.accountType}<select name="type" defaultValue={current?.account_type ?? "cash"}>
        <option value="cash">{t.cash}</option><option value="bank">{t.bank}</option><option value="wallet">{t.wallet}</option><option value="credit_card">{t.card}</option><option value="other">{t.other}</option>
      </select></label>
      <label>{t.openingBalance}<input name="openingBalance" type="number" min="0" step="0.01" defaultValue={current?.opening_balance ?? 0} placeholder="0.00" required /></label>
      <div className="form-actions"><button type="button" className="text-button" onClick={onCancel}>{t.cancel}</button><button type="submit" className="primary-button">{t.save}</button></div>
    </form>
  );
}
