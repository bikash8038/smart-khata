"use client";

import React, { FormEvent } from "react";

interface AccountFormProps {
  t: Record<string, string>;
  onCancel: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}

export function AccountForm({ t, onCancel, onSave }: AccountFormProps) {
  return (
    <form className="data-form" onSubmit={onSave}>
      <h2>{t.addAccount}</h2>
      
      <label>
        {t.accountName}
        <input name="name" required placeholder="जैसे: एभरेष्ट बैंक" autoComplete="off" />
      </label>
      
      <label>
        {t.accountType}
        <select name="type">
          <option value="cash">{t.cash}</option>
          <option value="bank">{t.bank}</option>
          <option value="wallet">{t.wallet}</option>
          <option value="credit_card">{t.card}</option>
          <option value="other">{t.other}</option>
        </select>
      </label>
      
      <label>
        {t.openingBalance}
        <input name="openingBalance" type="number" min="0" step="0.01" defaultValue="0" />
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
