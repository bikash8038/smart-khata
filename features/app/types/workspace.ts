import type { FinanceSection } from "../../finance/components/FinanceModule";
import type { WorkspaceLocale } from "../content/personal-copy";

export type PersonalPage = "dashboard" | "transactions" | "accounts" | "categories";
export type Page = PersonalPage | FinanceSection;

export interface Account {
  id: string;
  name: string;
  account_type: string;
  opening_balance: number;
}

export interface Category {
  id: string;
  name_ne: string;
  name_en: string | null;
  kind: "income" | "expense";
  parent_id: string | null;
  is_main: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  kind: "income" | "expense" | "transfer";
  transaction_date: string;
  note: string | null;
  account_id: string;
  category_id: string | null;
  created_at?: string;
}

export interface ConfirmDialogState {
  title: string;
  message: string;
  onConfirm: () => void;
}

export { type FinanceSection, type WorkspaceLocale };
