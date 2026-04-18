import { getOffers } from "@/lib/menu";
import CartView from "./CartView";

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const offers = await getOffers();
  return <CartView locale={locale as "en" | "el"} offers={offers} />;
}
