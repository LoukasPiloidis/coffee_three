import { getTranslations } from "next-intl/server";
import { SignUpForm } from "./SignUpForm";

export default async function SignUpPage() {
  const t = await getTranslations("auth");
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "420px" }}>
        <h1 className="page__title">{t("signUpTitle")}</h1>
        <SignUpForm />
      </div>
    </main>
  );
}
