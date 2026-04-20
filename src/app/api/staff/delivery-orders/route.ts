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
  for (const item of items) {
    const arr = itemsByOrder.get(item.orderId) ?? [];
    arr.push(item);
    itemsByOrder.set(item.orderId, arr);
  }

  return NextResponse.json({
    orders: rows.map((order) => ({
      id: order.id,
      publicToken: order.publicToken,
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
      items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
        title: item.titleSnapshot,
        quantity: item.quantity,
        options: item.optionsJson,
        comment: item.comment,
      })),
    })),
  });
}
