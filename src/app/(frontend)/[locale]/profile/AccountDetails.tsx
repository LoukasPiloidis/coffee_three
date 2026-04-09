"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
      <div className="field">
        <label>{t("accountEmail")}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSaved(false);
          }}
          required
        />
      </div>
      <div className="field">
        <label>{t("accountPhone")}</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setSaved(false);
          }}
          placeholder={t("accountPhonePlaceholder")}
        />
      </div>

      {error && <div className="notice notice--error">{error}</div>}
      {saved && !error && (
        <div className="notice notice--success">{t("accountSaved")}</div>
      )}

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
