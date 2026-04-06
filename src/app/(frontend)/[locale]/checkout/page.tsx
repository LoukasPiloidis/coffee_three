import { auth } from "@/auth";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  return (
    <CheckoutForm
      locale={locale as "en" | "el"}
      loggedInEmail={session?.user?.email ?? null}
      loggedInName={session?.user?.name ?? null}
    />
  );
}
