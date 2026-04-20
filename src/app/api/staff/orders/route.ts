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
  for (const item of allItems) {
    const arr = itemsByOrder.get(item.orderId) ?? [];
    arr.push(item);
    itemsByOrder.set(item.orderId, arr);
  }

  return NextResponse.json({
    orders: rows.map((order) => ({
      id: order.id,
      publicToken: order.publicToken,
      type: order.type,
      status: order.status,
      createdAt: order.createdAt,
      totalCents: order.totalCents,
      tipCents: order.tipCents,
      paymentMethod: order.paymentMethod,
      guestName: order.guestName,
      guestPhone: order.guestPhone,
      deliveryStreet: order.deliveryStreet,
      deliveryCity: order.deliveryCity,
      deliveryPostcode: order.deliveryPostcode,
      deliveryGuy: order.deliveryGuy,
      notes: order.notes,
      offersJson: order.offersJson,
      items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
        title: item.titleSnapshot,
        quantity: item.quantity,
        options: item.optionsJson,
        discountCents: item.discountCents,
        comment: item.comment,
      })),
    })),
  });
}
