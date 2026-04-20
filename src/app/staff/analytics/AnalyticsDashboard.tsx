"use client";

import { HistorySection } from "./HistorySection";
import { TodaySummary } from "./TodaySummary";

type DailyAnalytics = {
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

export function AnalyticsDashboard({
  todayData,
}: {
  todayData: DailyAnalytics | null;
}) {
  return (
    <div className="stack-md">
      <TodaySummary data={todayData} />
      <HistorySection />
    </div>
  );
}
