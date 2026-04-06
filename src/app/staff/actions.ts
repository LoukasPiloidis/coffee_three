"use server";

import { updateOrderStatus } from "@/lib/orders";
import { isStaffAuthorized } from "@/lib/staff-auth";

export async function updateStatusAction(
  orderId: string,
  status: "received" | "preparing" | "on_its_way" | "completed" | "cancelled"
) {
  if (!(await isStaffAuthorized())) {
    throw new Error("Unauthorized");
  }
  await updateOrderStatus(orderId, status);
}
