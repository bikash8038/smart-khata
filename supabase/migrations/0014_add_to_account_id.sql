-- Migration: Add to_account_id to transactions for fund transfers
ALTER TABLE public.transactions
ADD COLUMN to_account_id uuid REFERENCES public.accounts(id) ON DELETE RESTRICT;

-- Add check constraint to ensure data consistency
-- 1. If it's a transfer, to_account_id must be provided and must be different from account_id.
-- 2. If it's income or expense, to_account_id must be null.
ALTER TABLE public.transactions
ADD CONSTRAINT check_transfer_accounts
CHECK (
  (kind = 'transfer' AND to_account_id IS NOT NULL AND to_account_id <> account_id) OR
  (kind <> 'transfer' AND to_account_id IS NULL)
);
