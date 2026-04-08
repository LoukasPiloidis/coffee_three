"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateOrderStatus } from "@/lib/orders";
import { isStaffAuthorized } from "@/lib/staff-auth";

export async function staffSignOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/staff");
}

export async function updateStatusAction(
  orderId: string,
  status: "received" | "preparing" | "on_its_way" | "completed" | "cancelled"
) {
  if (!(await isStaffAuthorized())) {
    throw new Error("Unauthorized");
  }
  await updateOrderStatus(orderId, status);
}
