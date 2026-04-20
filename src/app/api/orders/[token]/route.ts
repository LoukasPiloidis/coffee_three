import { NextResponse } from "next/server";
import { getOrderByToken } from "@/lib/orders";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await getOrderByToken(token);
  if (!result) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { order, items } = result;
  return NextResponse.json({
    type: order.type,
    status: order.status,
    createdAt: order.createdAt,
    totalCents: order.totalCents,
    tipCents: order.tipCents,
    paymentMethod: order.paymentMethod,
    items: items.map((item) => ({
      title: item.titleSnapshot,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discountCents: item.discountCents,
      options: item.optionsJson,
      comment: item.comment,
    })),
  });
}
