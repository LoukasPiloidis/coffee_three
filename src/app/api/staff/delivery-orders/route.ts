import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems } from "@/db/schema";
import { getOrdersByDeliveryGuyAndDate } from "@/lib/orders";
import { isStaffAuthorized } from "@/lib/staff-auth";

export async function GET(req: NextRequest) {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const deliveryGuy = req.nextUrl.searchParams.get("deliveryGuy");
  const date = req.nextUrl.searchParams.get("date");

  if (!deliveryGuy || !date) {
    return NextResponse.json(
      { error: "deliveryGuy and date are required" },
      { status: 400 }
    );
  }

  const rows = await getOrdersByDeliveryGuyAndDate(deliveryGuy, date);

  if (rows.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const orderIds = rows.map((r) => r.id);
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));

  const itemsByOrder = new Map<string, typeof items>();
  for (const it of items) {
    const arr = itemsByOrder.get(it.orderId) ?? [];
    arr.push(it);
    itemsByOrder.set(it.orderId, arr);
  }

  return NextResponse.json({
    orders: rows.map((o) => ({
      id: o.id,
      publicToken: o.publicToken,
      status: o.status,
      createdAt: o.createdAt,
      totalCents: o.totalCents,
      tipCents: o.tipCents,
      paymentMethod: o.paymentMethod,
      guestName: o.guestName,
      guestPhone: o.guestPhone,
      deliveryStreet: o.deliveryStreet,
      deliveryCity: o.deliveryCity,
      deliveryPostcode: o.deliveryPostcode,
      deliveryGuy: o.deliveryGuy,
      notes: o.notes,
      items: (itemsByOrder.get(o.id) ?? []).map((i) => ({
        title: i.titleSnapshot,
        quantity: i.quantity,
        options: i.optionsJson,
        comment: i.comment,
      })),
    })),
  });
}
