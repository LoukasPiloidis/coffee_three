import { getTranslations } from "next-intl/server";
import { SignInForm } from "./SignInForm";

export default async function SignInPage() {
  const t = await getTranslations("auth");
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "420px" }}>
        <h1 className="page__title">{t("signInTitle")}</h1>
        <SignInForm />
      </div>
    </main>
  );
}
