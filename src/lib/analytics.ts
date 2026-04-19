import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type DailyAnalytics = {
  date: string;
  deliveryRevenue: number;
  deliveryCount: number;
  takeawayRevenue: number;
  takeawayCount: number;
  cashRevenue: number;
  cashCount: number;
  cardRevenue: number;
  cardCount: number;
  totalOrders: number;
  offersUsed: number;
};

export async function getAnalyticsByDateRange(
  from: string,
  to: string
): Promise<DailyAnalytics[]> {
  const rows = await db.execute<DailyAnalytics>(sql`
    SELECT
      (created_at AT TIME ZONE 'Europe/Athens')::date::text AS "date",

      COALESCE(SUM(CASE WHEN type = 'delivery' THEN total_cents ELSE 0 END), 0)::int
        AS "deliveryRevenue",
      COALESCE(SUM(CASE WHEN type = 'delivery' THEN 1 ELSE 0 END), 0)::int
        AS "deliveryCount",

      COALESCE(SUM(CASE WHEN type = 'takeaway' THEN total_cents ELSE 0 END), 0)::int
        AS "takeawayRevenue",
      COALESCE(SUM(CASE WHEN type = 'takeaway' THEN 1 ELSE 0 END), 0)::int
        AS "takeawayCount",

      COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_cents ELSE 0 END), 0)::int
        AS "cashRevenue",
      COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN 1 ELSE 0 END), 0)::int
        AS "cashCount",

      COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total_cents ELSE 0 END), 0)::int
        AS "cardRevenue",
      COALESCE(SUM(CASE WHEN payment_method = 'card' THEN 1 ELSE 0 END), 0)::int
        AS "cardCount",

      COUNT(*)::int AS "totalOrders",

      COALESCE(SUM(CASE WHEN COALESCE(jsonb_array_length(offers_json::jsonb), 0) > 0 THEN 1 ELSE 0 END), 0)::int
        AS "offersUsed"

    FROM orders
    WHERE status != 'cancelled'
      AND (created_at AT TIME ZONE 'Europe/Athens')::date >= ${from}::date
      AND (created_at AT TIME ZONE 'Europe/Athens')::date <= ${to}::date
    GROUP BY (created_at AT TIME ZONE 'Europe/Athens')::date
    ORDER BY "date" ASC
  `);

  return [...rows] as DailyAnalytics[];
}
