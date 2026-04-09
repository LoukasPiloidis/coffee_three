"use server";

import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, user } from "@/db/schema";
import { getSession } from "@/lib/session";

export async function signOutAction(redirectTo: string) {
  await auth.api.signOut({ headers: await headers() });
  redirect(redirectTo);
}

export type AddAddressInput = {
  label: string;
  street: string;
  city: string;
  postcode: string;
  notes: string;
};

export async function addAddressAction(
  input: AddAddressInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "unauthenticated" };

  const street = input.street.trim();
  const city = input.city.trim();
  const postcode = input.postcode.trim();
  if (!street || !city || !postcode) {
    return { ok: false, error: "missing_fields" };
  }

  await db.insert(addresses).values({
    userId: session.user.id,
    label: input.label.trim() || null,
    street,
    city,
    postcode,
    notes: input.notes.trim() || null,
  });

  revalidatePath("/[locale]/profile", "page");
  return { ok: true };
}

export type UpdateAccountInput = {
  email: string;
  phone: string;
};

export async function updateAccountAction(
  input: UpdateAccountInput
): Promise<
  | { ok: true }
  | { ok: false; error: "unauthenticated" | "invalidEmail" | "emailTaken" | "generic" }
> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "unauthenticated" };

  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();

  // Simple sanity check — better-auth normally handles email validation
  // during sign up, but we're updating directly.
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { ok: false, error: "invalidEmail" };
  }

  // Enforce uniqueness manually to return a friendly error (the DB
  // constraint would otherwise surface as a generic failure).
  if (email !== session.user.email.toLowerCase()) {
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    if (existing && existing.id !== session.user.id) {
      return { ok: false, error: "emailTaken" };
    }
  }

  try {
    await db
      .update(user)
      .set({ email, phone: phone || null, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));
  } catch {
    return { ok: false, error: "generic" };
  }

  revalidatePath("/[locale]/profile", "page");
  return { ok: true };
}

export async function deleteAddressAction(
  addressId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "unauthenticated" };

  await db
    .delete(addresses)
    .where(
      and(eq(addresses.id, addressId), eq(addresses.userId, session.user.id))
    );

  revalidatePath("/[locale]/profile", "page");
  return { ok: true };
}
