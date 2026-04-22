"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormField } from "@/components/FormField";
import { Notice } from "@/components/Notice";
import { Link } from "@/i18n/navigation";
import { signUp } from "@/lib/auth-client";

export function SignUpForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    setPending(true);
    const { error } = await signUp.email({ name, email, password, phone });
    setPending(false);
    if (error) {
      setError(error.message ?? t("errorGeneric"));
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="card stack-md">
        <Notice type="success">{t("signUpSuccess")}</Notice>
        <Link href="/signin" className="btn btn--primary btn--block">
          {t("signUpSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card stack-md">
      <FormField label={t("name")}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </FormField>
      <FormField label={t("email")}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </FormField>
      <FormField label={t("password")} hint={t("passwordHint")}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </FormField>
      <FormField label={t("confirmPassword")}>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </FormField>
      <FormField label={t("phone")} hint={t("phoneHint")}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
          placeholder="+30 69…"
        />
      </FormField>
      {error && <Notice type="error">{error}</Notice>}
      <button className="btn btn--primary btn--block" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </button>
      <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
        {t("haveAccount")} <Link href="/signin">{tCommon("signIn")}</Link>
      </p>
    </form>
  );
}
