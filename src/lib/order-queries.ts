import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";

// Orders auto-complete one hour after they are placed. Both the staff list
// endpoint and the public order status endpoint call this before reading,
// so it runs lazily without a cron job. Cancelled orders are untouched.
export async function autoCompleteStaleOrders() {
  await db
    .update(orders)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(
        inArray(orders.status, ["received", "preparing", "on_its_way"]),
        lt(orders.createdAt, sql`now() - interval '1 hour'`)
      )
    );
}

export async function getOrderByToken(token: string) {
  await autoCompleteStaleOrders();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.publicToken, token))
    .limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));
  return { order, items };
}

export async function getActiveStaffOrders() {
  return db
    .select()
    .from(orders)
    .where(
      and(inArray(orders.type, ["delivery", "takeaway"]))
    )
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

export async function updateOrderStatus(
  orderId: string,
  status: "received" | "preparing" | "on_its_way" | "completed" | "cancelled"
) {
  await db
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function assignDeliveryGuy(
  orderId: string,
  deliveryGuy: string | null
) {
  await db
    .update(orders)
    .set({ deliveryGuy, updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}

export async function getOrdersByDeliveryGuyAndDate(
  deliveryGuy: string,
  date: string // YYYY-MM-DD
) {
  const startOfDay = new Date(`${date}T00:00:00`);
  const endOfDay = new Date(`${date}T23:59:59.999`);

  return db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.deliveryGuy, deliveryGuy),
        sql`${orders.createdAt} >= ${startOfDay}`,
        sql`${orders.createdAt} <= ${endOfDay}`
      )
    )
    .orderBy(desc(orders.createdAt));
}

export async function getRecentUserOrders(userId: string, limit = 5) {
  const recent = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
  return recent;
}
