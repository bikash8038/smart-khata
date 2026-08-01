"use client";

import { useEffect, useState } from "react";
import type { Page, FinanceSection } from "../types/workspace";

const financialPages: FinanceSection[] = ["budgets", "loans", "goals", "reports", "notifications"];
const pages: Page[] = ["dashboard", "transactions", "accounts", "categories", "users", "profile", ...financialPages];

export function useWorkspaceNavigation(initialPage?: string) {
  const [page, setPage] = useState<Page>(
    pages.includes(initialPage as Page) ? (initialPage as Page) : "dashboard"
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Synchronize active page state when browser back/forward buttons are clicked (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        if (pathname === "/") {
          setPage("dashboard");
        } else {
          const parts = pathname.split("/");
          const lastPart = parts[parts.length - 1] as Page;
          if (pages.includes(lastPart)) {
            setPage(lastPart);
          }
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handlePageChange = (targetPage: Page) => {
    setPage(targetPage);
    if (typeof window !== "undefined") {
      const path = targetPage === "dashboard" ? "/" : `/personal/${targetPage}`;
      window.history.pushState({ page: targetPage }, "", path);
    }
  };

  return {
    page,
    setPage: handlePageChange,
    mobileMenuOpen,
    setMobileMenuOpen,
    financialPages,
    pages,
  };
}
