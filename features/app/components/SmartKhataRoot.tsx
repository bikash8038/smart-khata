"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthScreen } from "../../auth/components/AuthScreen";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import { UserWorkspace } from "./UserWorkspace";
import { AppSkeleton } from "../../../components/ui/AppSkeleton";

export function SmartKhataRoot({ initialPage }: { initialPage?: string }) {
  // Initialize state based on supabase client availability to avoid set-state-in-effect warnings
  const [user, setUser] = useState<User | null | undefined>(() => {
    const supabase = getSupabaseBrowserClient();
    return supabase ? undefined : null;
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  if (user === undefined) return <AppSkeleton />;
  if (!user) return <AuthScreen />;
  return <UserWorkspace user={user} initialPage={initialPage} />;
}
