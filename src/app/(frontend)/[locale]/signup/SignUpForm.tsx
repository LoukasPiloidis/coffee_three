"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signUp } from "@/lib/auth-client";
import { Link } from "@/i18n/navigation";

export default function SignUpForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await signUp.email({ name, email, password });
    setPending(false);
    if (error) {
      setError(error.message ?? t("errorGeneric"));
      return;
    }
    window.location.href = "/";
  }

  return (
    <form onSubmit={onSubmit} className="card stack-md">
      <div className="field">
        <label>{t("name")}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="field">
        <label>{t("email")}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="field">
        <label>{t("password")}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {t("passwordHint")}
        </div>
      </div>
      {error && <div className="notice notice--error">{error}</div>}
      <button className="btn btn--primary btn--block" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </button>
      <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
        {t("haveAccount")} <Link href="/signin">{tCommon("signIn")}</Link>
      </p>
    </form>
  );
}
