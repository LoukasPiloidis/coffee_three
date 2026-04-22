import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <PageShell title={t("resetPasswordTitle")} maxWidth="420px">
      <ResetPasswordForm />
    </PageShell>
  );
}
