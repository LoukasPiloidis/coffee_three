import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { SignUpForm } from "./SignUpForm";

export default async function SignUpPage() {
  const t = await getTranslations("auth");
  return (
    <PageShell title={t("signUpTitle")} maxWidth="420px">
      <SignUpForm />
    </PageShell>
  );
}
