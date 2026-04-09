"use server";

import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { itemOverrides, optionOverrides } from "@/db/schema";
import { KEYSTATIC_CACHE_TAG } from "@/lib/menu";
import { isStaffAuthorized } from "@/lib/staff-auth";

async function assertStaff() {
  if (!(await isStaffAuthorized())) {
    throw new Error("Unauthorized");
  }
}

export async function setItemAvailabilityAction(
  slug: string,
  available: boolean
) {
  await assertStaff();
  await db
    .insert(itemOverrides)
    .values({ slug, available, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: itemOverrides.slug,
      set: { available, updatedAt: new Date() },
    });
  // Next 16's revalidateTag takes a cacheLife profile as the second arg;
  // `{ expire: 0 }` forces immediate expiry so staff see the new state
  // on their next refresh.
  revalidateTag(KEYSTATIC_CACHE_TAG, { expire: 0 });
}

export async function setOptionAvailabilityAction(
  itemSlug: string,
  groupKey: string,
  optionKey: string,
  available: boolean
) {
  await assertStaff();
  await db
    .insert(optionOverrides)
    .values({
      itemSlug,
      groupKey,
      optionKey,
      available,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        optionOverrides.itemSlug,
        optionOverrides.groupKey,
        optionOverrides.optionKey,
      ],
      set: { available, updatedAt: new Date() },
    });
  // Next 16's revalidateTag takes a cacheLife profile as the second arg;
  // `{ expire: 0 }` forces immediate expiry so staff see the new state
  // on their next refresh.
  revalidateTag(KEYSTATIC_CACHE_TAG, { expire: 0 });
}
