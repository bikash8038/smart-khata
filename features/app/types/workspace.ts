import type { FinanceSection } from "../../finance/components/FinanceModule";
import type { WorkspaceLocale } from "../content/personal-copy";

export type PersonalPage = "dashboard" | "transactions" | "accounts" | "categories" | "users" | "profile";
export type Page = PersonalPage | FinanceSection;

export interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  role: "user" | "admin" | "super_admin";
  created_at: string;
  username?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean;
  status?: string;
  scheduled_deletion_date?: string | null;
}

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
  is_system: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  kind: "income" | "expense" | "transfer";
  transaction_date: string;
  note: string | null;
  account_id: string;
  to_account_id?: string | null;
  category_id: string | null;
  created_at?: string;
  runningBalance?: number;
}

export interface ConfirmDialogState {
  title: string;
  message: string;
  onConfirm: () => void;
}

export { type FinanceSection, type WorkspaceLocale };
