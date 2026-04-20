import { OrderStatusView } from "./OrderStatusView";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  return <OrderStatusView locale={locale as "en" | "el"} token={token} />;
}
