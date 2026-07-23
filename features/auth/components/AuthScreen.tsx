"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import "../styles/auth-screen.css";

type Screen = "signin" | "signup" | "forgot";

export function AuthScreen() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isConfigured = Boolean(getSupabaseBrowserClient());

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    setMessage("");
    setIsLoading(true);

    try {
      if (screen === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("लग इन सफल भयो। अब तपाईंको सुरक्षित dashboard खुल्नेछ। ");
      }

      if (screen === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setMessage("दर्ता सफल भयो। आफ्नो email मा आएको पुष्टि लिंक खोलेर लग इन गर्नुहोस्।");
      }

      if (screen === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage("Password reset गर्ने लिंक तपाईंको email मा पठाइएको छ।");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "कृपया पुनः प्रयास गर्नुहोस्।");
    } finally {
      setIsLoading(false);
    }
  }

  const title = screen === "signin" ? "लग इन गर्नुहोस्" : screen === "signup" ? "नयाँ खाता बनाउनुहोस्" : "पासवर्ड रिसेट गर्नुहोस्";

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <p className="auth-brand">Smart Khata</p>
        <h1>आफ्नो हिसाबलाई व्यवस्थित र सुरक्षित राख्नुहोस्।</h1>
        <p>व्यक्तिगत वा व्यवसायिक आम्दानी, खर्च र वित्तीय योजना एउटै सुरक्षित ठाउँमा व्यवस्थापन गर्नुहोस्।</p>
        <ul>
          <li>तपाईंको data केवल तपाईंको खातासँग जोडिएको हुन्छ</li>
          <li>नेपाली र English दुवै भाषामा प्रयोग गर्न मिल्छ</li>
          <li>मोबाइल, ट्याब्लेट र कम्प्युटरमा सहज</li>
        </ul>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <p className="auth-card-label">सुरक्षित पहुँच</p>
        <h2 id="auth-title">{title}</h2>
        <p className="auth-helper">सामान्य user ले यहीँबाट खाता बनाउन सक्छन्। Admin खाता व्यवस्थापकले मात्र प्रदान गर्छन्।</p>

        {!isConfigured && <p className="auth-notice">यो स्थानीय preview हो। सुरक्षित database जडान भएपछि मात्र यहाँबाट वास्तविक दर्ता र लग इन सुरु हुन्छ।</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          {screen === "signup" && <label>पूरा नाम<input name="fullName" type="text" autoComplete="name" required /></label>}
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          {screen !== "forgot" && <label>पासवर्ड<input name="password" type="password" autoComplete={screen === "signup" ? "new-password" : "current-password"} minLength={8} required /></label>}
          <button type="submit" className="auth-submit" disabled={!isConfigured || isLoading}>{isLoading ? "कृपया पर्खनुहोस्..." : screen === "signin" ? "लग इन" : screen === "signup" ? "दर्ता गर्नुहोस्" : "Reset link पठाउनुहोस्"}</button>
        </form>

        {message && <p className="auth-message" role="status">{message}</p>}

        <div className="auth-links">
          {screen !== "signin" && <button type="button" onClick={() => setScreen("signin")}>लग इनमा फर्कनुहोस्</button>}
          {screen === "signin" && <><button type="button" onClick={() => setScreen("forgot")}>पासवर्ड बिर्सनुभयो?</button><button type="button" onClick={() => setScreen("signup")}>नयाँ खाता बनाउनुहोस्</button></>}
        </div>
      </section>
    </main>
  );
}
