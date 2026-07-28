"use client";

import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../../lib/supabase/client";
import "../styles/auth-screen.css";

type Screen = "signin" | "signup" | "forgot";
type WorkspaceLocale = "en" | "ne";

const authTranslations = {
  en: {
    brand: "Smart Khata",
    title: "Keep your finances organized and secure.",
    description: "Manage personal or business income, expenses, and financial plans in one secure place.",
    bullets: [
      "Your data is only connected to your account",
      "Works in both English and Nepali languages",
      "Easy to use on mobile, tablet, and computer"
    ],
    secureAccess: "SECURE GATEWAY",
    signinTitle: "Sign In to Smart Khata",
    signupTitle: "Create New Account",
    forgotTitle: "Reset Password",
    helperText: "Secure financial ledger for personal & business bookkeeping.",
    localPreview: "This is a local preview. Real registration and login will begin after connecting a secure database.",
    fullName: "Full Name",
    email: "Email Address",
    password: "Password",
    loading: "Please wait...",
    signinBtn: "Sign In",
    signupBtn: "Register",
    forgotBtn: "Send Reset Link",
    backToSignin: "Back to Sign In",
    forgotPassword: "Forgot Password?",
    createAccount: "Create New Account",
    loginSuccess: "Login successful. Redirecting to your dashboard...",
    registerSuccess: "Registration successful. Please check your email to confirm your account.",
    resetSuccess: "Password reset link has been sent to your email.",
    errorTryAgain: "Please try again.",
    orSeparator: "OR CONTINUE WITH",
    googleSigninBtn: "Sign In with Google"
  },
  ne: {
    brand: "Smart Khata",
    title: "आफ्नो हिसाबलाई व्यवस्थित र सुरक्षित राख्नुहोस्।",
    description: "व्यक्तिगत वा व्यवसायिक आम्दानी, खर्च र वित्तीय योजना एउटै सुरक्षित ठाउँमा व्यवस्थापन गर्नुहोस्।",
    bullets: [
      "तपाईंको data केवल तपाईंको खातासँग जोडिएको हुन्छ",
      "नेपाली र English दुवै भाषामा प्रयोग गर्न मिल्छ",
      "मोबाइल, ट्याब्लेट र कम्प्युटरमा सहज"
    ],
    secureAccess: "सुरक्षित पहुँच",
    signinTitle: "लग इन गर्नुहोस्",
    signupTitle: "नयाँ खाता बनाउनुहोस्",
    forgotTitle: "पासवर्ड रिसेट गर्नुहोस्",
    helperText: "व्यक्तिगत तथा व्यावसायिक हिसाब राख्ने सुरक्षित माध्यम।",
    localPreview: "यो स्थानीय preview हो। सुरक्षित database जडान भएपछि मात्र यहाँबाट वास्तविक दर्ता र लग इन सुरु हुन्छ।",
    fullName: "पूरा नाम",
    email: "इमेल ठेगाना",
    password: "पासवर्ड",
    loading: "कृपया पर्खनुहोस्...",
    signinBtn: "लग इन",
    signupBtn: "दर्ता गर्नुहोस्",
    forgotBtn: "Reset link पठाउनुहोस्",
    backToSignin: "लग इनमा फर्कनुहोस्",
    forgotPassword: "पासवर्ड बिर्सनुभयो?",
    createAccount: "नयाँ खाता बनाउनुहोस्",
    loginSuccess: "लग इन सफल भयो। अब तपाईंको सुरक्षित dashboard खुल्नेछ।",
    registerSuccess: "दर्ता सफल भयो। आफ्नो email मा आएको पुष्टि लिंक खोलेर लग इन गर्नुहोस्।",
    resetSuccess: "Password reset गर्ने लिंक तपाईंको email मा पठाइएको छ।",
    errorTryAgain: "कृपया पुनः प्रयास गर्नुहोस्।",
    orSeparator: "वा यसबाट जारी राख्नुहोस्",
    googleSigninBtn: "Google बाट लग इन गर्नुहोस्"
  }
};

export function AuthScreen() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [locale, setLocale] = useState<WorkspaceLocale>("en");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isConfigured = Boolean(getSupabaseBrowserClient());

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem("smart_khata_locale") as WorkspaceLocale | null;
    if (savedLocale === "en" || savedLocale === "ne") {
      setLocale(savedLocale);
    }
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const t = authTranslations[locale];

  const handleLanguageChange = (nextLocale: WorkspaceLocale) => {
    setLocale(nextLocale);
    localStorage.setItem("smart_khata_locale", nextLocale);
  };

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
        setMessage(t.loginSuccess);
      }

      if (screen === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              locale: locale
            }
          },
        });
        if (error) throw error;
        setMessage(t.registerSuccess);
      }

      if (screen === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage(t.resetSuccess);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.errorTryAgain);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setMessage("");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.errorTryAgain);
    } finally {
      setIsLoading(false);
    }
  }

  const title = screen === "signin" ? t.signinTitle : screen === "signup" ? t.signupTitle : t.forgotTitle;

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <p className="auth-brand">
          <span className="brand-badge-mark">S</span>
          {t.brand}
        </p>
        <h1>{t.title}</h1>
        <p>{t.description}</p>
        <ul>
          {t.bullets.map((bullet, idx) => (
            <li key={idx}>{bullet}</li>
          ))}
        </ul>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        {/* Top bar with security badge and language tabs switcher */}
        <div className="auth-card-header">
          <span className="security-badge">
            <svg className="shield-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            {t.secureAccess}
          </span>
          <div className="auth-lang-tabs">
            <button
              type="button"
              className={`lang-tab-btn ${locale === "en" ? "active" : ""}`}
              onClick={() => handleLanguageChange("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-tab-btn ${locale === "ne" ? "active" : ""}`}
              onClick={() => handleLanguageChange("ne")}
            >
              नेप
            </button>
          </div>
        </div>

        <h2 id="auth-title">{title}</h2>
        <p className="auth-helper">{t.helperText}</p>

        {!isConfigured && <p className="auth-notice">{t.localPreview}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          {screen === "signup" && (
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input name="fullName" type="text" placeholder={t.fullName} autoComplete="name" required />
            </div>
          )}
          <div className="input-group">
            <span className="input-icon">✉️</span>
            <input name="email" type="email" placeholder={t.email} autoComplete="email" required />
          </div>
          {screen !== "forgot" && (
            <div className="input-group">
              <span className="input-icon">🔒</span>
              <input
                name="password"
                type="password"
                placeholder={t.password}
                autoComplete={screen === "signup" ? "new-password" : "current-password"}
                minLength={8}
                required
              />
            </div>
          )}
          <button type="submit" className="auth-submit" disabled={!isConfigured || isLoading}>
            {isLoading ? t.loading : screen === "signin" ? t.signinBtn : screen === "signup" ? t.signupBtn : t.forgotBtn}
          </button>
        </form>

        {/* OAuth Separator */}
        <div className="auth-separator">
          <span>{t.orSeparator}</span>
        </div>

        {/* Premium Google Sign In Button */}
        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogleSignIn}
          disabled={!isConfigured || isLoading}
        >
          <svg className="google-icon-svg" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#EA4335"
              d="M5.2662 9.7651A7.0771 7.0771 0 0 1 12 4.9091c1.6909 0 3.218.6 4.4182 1.5818l3.51-3.51C17.6427 1.095 14.9555 0 12 0 7.24 0 3.1664 2.724 1.1864 6.702l4.0798 3.0631z"
            />
            <path
              fill="#34A853"
              d="M16.0409 17.5091c-1.1273.7545-2.5364 1.2182-4.0409 1.2182-2.9555 0-5.4664-1.9091-6.36-4.5455L1.56 17.2455C3.54 21.2236 7.6136 24 12 24c2.9455 0 5.6182-1.0145 7.6255-2.7545l-3.5846-3.7364z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.2727c0-.8182-.0727-1.6091-.2073-2.3727H12v4.5164h6.4609c-.2782 1.4836-1.1182 2.7409-2.3782 3.5846l3.5846 3.7364C21.7582 19.3364 23.49 16.0364 23.49 12.2727z"
            />
            <path
              fill="#FBBC05"
              d="M5.64 14.1818A7.16 7.16 0 0 1 5.25 12c0-.7636.13-1.5.36-2.1818L1.53 6.7545A11.956 11.956 0 0 0 0 12c0 1.9.4445 3.7 1.23 5.3273l4.41-3.1455z"
            />
          </svg>
          <span>{t.googleSigninBtn}</span>
        </button>

        {message && <p className="auth-message" role="status">{message}</p>}

        <div className="auth-links">
          {screen !== "signin" && (
            <button type="button" className="link-secondary" onClick={() => setScreen("signin")}>
              {t.backToSignin}
            </button>
          )}
          {screen === "signin" && (
            <>
              <button type="button" className="link-forgot" onClick={() => setScreen("forgot")}>
                {t.forgotPassword}
              </button>
              <button type="button" className="link-register" onClick={() => setScreen("signup")}>
                {t.createAccount}
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}


