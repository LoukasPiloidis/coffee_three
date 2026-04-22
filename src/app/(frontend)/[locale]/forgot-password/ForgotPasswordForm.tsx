"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FormField } from "@/components/FormField";
import { Notice } from "@/components/Notice";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

const { requestPasswordReset } = authClient;

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    await requestPasswordReset({
      email,
      redirectTo: `/${locale}/reset-password`,
    });
    setPending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card stack-md">
        <Notice type="success">{t("forgotPasswordSuccess")}</Notice>
        <Link href="/signin" className="btn btn--primary btn--block">
          {tCommon("signIn")}
        </Link>
      </div>
    );
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
      <button className="btn btn--primary btn--block" disabled={pending}>
        {pending ? t("submitting") : t("forgotPasswordSubmit")}
      </button>
      <p style={{ textAlign: "center", fontSize: "0.9rem" }}>
        <Link href="/signin">{tCommon("signIn")}</Link>
      </p>
    </form>
  );
}
