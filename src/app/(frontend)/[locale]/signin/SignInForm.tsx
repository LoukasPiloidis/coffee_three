"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormField } from "@/components/FormField";
import { Notice } from "@/components/Notice";
import { Link } from "@/i18n/navigation";
import { signIn } from "@/lib/auth-client";

export function SignInForm() {
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
      const isUnverified =
        error.status === 403 || error.code === "EMAIL_NOT_VERIFIED";
      setError(isUnverified ? t("emailNotVerified") : t("errorInvalid"));
      return;
    }
    window.location.href = "/";
  }

  return (
    <form onSubmit={onSubmit} className="card stack-md">
      <FormField label={t("email")}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </FormField>
      <FormField label={t("password")}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="current-password"
        />
      </FormField>
      {error && <Notice type="error">{error}</Notice>}
      <Link
        href="/forgot-password"
        style={{ fontSize: "0.85rem", textAlign: "right" }}
      >
        {t("forgotPassword")}
      </Link>
      <button className="btn btn--primary btn--block" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </button>
      <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
        {t("noAccount")} <Link href="/signup">{tCommon("signUp")}</Link>
      </p>
    </form>
  );
}
