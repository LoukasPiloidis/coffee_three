import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <PageShell title={t("forgotPasswordTitle")} maxWidth="420px">
      <ForgotPasswordForm />
    </PageShell>
  );
}
