"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { personalCopy, type WorkspaceLocale } from "../content/personal-copy";

export function useWorkspaceLocale(user: User) {
  const [locale, setLocale] = useState<WorkspaceLocale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("smart_khata_locale");
      if (saved === "en" || saved === "ne") return saved as WorkspaceLocale;
    }
    return "en";
  });

  // Sync locale preference from Supabase user profile table
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("profiles")
      .select("locale")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.locale && (data.locale === "en" || data.locale === "ne")) {
          setLocale(data.locale as WorkspaceLocale);
          if (typeof window !== "undefined") {
            localStorage.setItem("smart_khata_locale", data.locale);
          }
        }
      });
  }, [user.id]);

  const setLanguage = async (nextLocale: WorkspaceLocale) => {
    setLocale(nextLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_khata_locale", nextLocale);
    }
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.from("profiles").update({ locale: nextLocale }).eq("id", user.id);
    }
  };

  const t = personalCopy[locale];

  return {
    locale,
    setLanguage,
    t,
  };
}
