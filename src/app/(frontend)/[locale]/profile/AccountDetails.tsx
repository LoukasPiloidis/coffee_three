"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { FormField } from "@/components/FormField";
import { Notice } from "@/components/Notice";
import { updateAccountAction } from "./actions";

export default function AccountDetails({
  initialEmail,
  initialPhone,
}: {
  initialEmail: string;
  initialPhone: string;
}) {
  const t = useTranslations("profile");
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    email.trim().toLowerCase() !== initialEmail.trim().toLowerCase() ||
    phone.trim() !== initialPhone.trim();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateAccountAction({ email, phone });
      if (result.ok) {
        setSaved(true);
      } else if (result.error === "invalidEmail") {
        setError(t("accountErrorInvalidEmail"));
      } else if (result.error === "emailTaken") {
        setError(t("accountErrorEmailTaken"));
      } else {
        setError(t("accountErrorGeneric"));
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="card stack-md">
      <FormField label={t("accountEmail")}>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSaved(false);
          }}
          required
        />
      </FormField>
      <FormField label={t("accountPhone")}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setSaved(false);
          }}
          placeholder={t("accountPhonePlaceholder")}
        />
      </FormField>

      {error && <Notice type="error">{error}</Notice>}
      {saved && !error && <Notice type="success">{t("accountSaved")}</Notice>}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="submit"
          className="btn btn--primary btn--small"
          disabled={pending || !dirty}
        >
          {pending ? "…" : t("accountSave")}
        </button>
      </div>
    </form>
  );
}
