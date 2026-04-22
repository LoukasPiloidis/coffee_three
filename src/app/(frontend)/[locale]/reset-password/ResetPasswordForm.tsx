"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormField } from "@/components/FormField";
import { Notice } from "@/components/Notice";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

const { resetPassword } = authClient;

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (errorParam || !token) {
    return (
      <div className="card stack-md">
        <Notice type="error">{t("resetPasswordExpired")}</Notice>
        <Link href="/forgot-password" className="btn btn--primary btn--block">
          {t("forgotPasswordSubmit")}
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(t("resetPasswordMismatch"));
      return;
    }

    setPending(true);
    const { error } = await resetPassword({ newPassword: password, token: token! });
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
        <Notice type="success">{t("resetPasswordSuccess")}</Notice>
        <Link href="/signin" className="btn btn--primary btn--block">
          {tCommon("signIn")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card stack-md">
      <FormField label={t("resetPasswordNew")} hint={t("passwordHint")}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </FormField>
      <FormField label={t("resetPasswordConfirm")}>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </FormField>
      {error && <Notice type="error">{error}</Notice>}
      <button className="btn btn--primary btn--block" disabled={pending}>
        {pending ? t("submitting") : t("resetPasswordSubmit")}
      </button>
    </form>
  );
}
