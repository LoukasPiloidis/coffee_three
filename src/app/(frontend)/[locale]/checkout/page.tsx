import { getSession } from "@/lib/session";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  const savedAddresses = userId
    ? await db
        .select({
          id: addresses.id,
          label: addresses.label,
          street: addresses.street,
          city: addresses.city,
          postcode: addresses.postcode,
          notes: addresses.notes,
        })
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(asc(addresses.createdAt))
    : [];

  return (
    <CheckoutForm
      locale={locale as "en" | "el"}
      loggedInEmail={session?.user?.email ?? null}
      loggedInName={session?.user?.name ?? null}
      loggedInPhone={
        (session?.user as { phone?: string | null } | undefined)?.phone ?? null
      }
      savedAddresses={savedAddresses}
    />
  );
}

export const dynamic = "force-dynamic";
