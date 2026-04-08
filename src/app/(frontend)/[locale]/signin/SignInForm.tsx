"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "@/lib/auth-client";
import { Link } from "@/i18n/navigation";

export default function SignInForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await signIn.email({ email, password });
    setPending(false);
    if (error) {
      setError(t("errorInvalid"));
      return;
    }
    window.location.href = "/";
  }

  return (
    <form onSubmit={onSubmit} className="card stack-md">
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
          autoComplete="current-password"
        />
      </div>
      {error && <div className="notice notice--error">{error}</div>}
      <button className="btn btn--primary btn--block" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </button>
      <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
        {t("noAccount")}{" "}
        <Link href="/signup">{tCommon("signUp")}</Link>
      </p>
    </form>
  );
}
