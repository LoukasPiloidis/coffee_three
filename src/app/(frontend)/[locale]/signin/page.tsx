import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/PageShell";
import { SignInForm } from "./SignInForm";

export default async function SignInPage() {
  const t = await getTranslations("auth");
  return (
    <PageShell title={t("signInTitle")} maxWidth="420px">
      <SignInForm />
    </PageShell>
  );
}
