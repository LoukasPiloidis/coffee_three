import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { isStaffAuthorized } from "@/lib/staff-auth";
import { autoCompleteStaleOrders } from "@/lib/orders";

export async function GET() {
  if (!(await isStaffAuthorized())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await autoCompleteStaleOrders();

  const rows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(200);

  const allItems = await db.select().from(orderItems);
  const itemsByOrder = new Map<string, typeof allItems>();
  for (const it of allItems) {
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
      offersJson: o.offersJson,
      items: (itemsByOrder.get(o.id) ?? []).map((i) => ({
        title: i.titleSnapshot,
        quantity: i.quantity,
        options: i.optionsJson,
        discountCents: i.discountCents,
        comment: i.comment,
      })),
    })),
  });
}
