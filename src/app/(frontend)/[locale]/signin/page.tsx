import { signIn } from "@/auth";
import { getTranslations } from "next-intl/server";

export default async function SignInPage() {
  const t = await getTranslations("common");
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: "420px" }}>
        <h1 className="page__title">{t("signIn")}</h1>
        <form
          action={async (formData) => {
            "use server";
            await signIn("resend", {
              email: formData.get("email"),
              redirectTo: "/",
            });
          }}
          className="card stack-md"
        >
          <div className="field">
            <label>Email</label>
            <input type="email" name="email" required />
          </div>
          <button className="btn btn--primary btn--block">
            {t("signIn")}
          </button>
        </form>
      </div>
    </main>
  );
}
