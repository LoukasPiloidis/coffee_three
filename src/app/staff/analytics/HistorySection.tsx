import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Notice } from "@/components/Notice";
import styles from "./Analytics.module.css";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip
);

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

function formatEuro(cents: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function toLocalDate(daysOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

export function HistorySection() {
  const [from, setFrom] = useState(toLocalDate(-6));
  const [to, setTo] = useState(toLocalDate(0));
  const [chartData, setChartData] = useState<DailyAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const loadChart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/analytics?from=${from}&to=${to}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to load");
      }
      const { data } = await res.json();
      setChartData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadChart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    if (chartData.length === 0) return;

    const labels = chartData.map((d) => d.date);

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Delivery",
            data: chartData.map((d) => d.deliveryRevenue / 100),
            backgroundColor: "rgba(43, 68, 51, 0.75)",
          },
          {
            label: "Takeaway",
            data: chartData.map((d) => d.takeawayRevenue / 100),
            backgroundColor: "rgba(68, 106, 82, 0.75)",
          },
          {
            label: "Cash",
            data: chartData.map((d) => d.cashRevenue / 100),
            backgroundColor: "rgba(186, 156, 96, 0.75)",
          },
          {
            label: "Card",
            data: chartData.map((d) => d.cardRevenue / 100),
            backgroundColor: "rgba(120, 160, 135, 0.75)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${formatEuro(Math.round((ctx.raw as number) * 100))}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "EUR" },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [chartData]);

  return (
    <div className="card">
      <h2 className={styles['section-title']}>History</h2>
      <div className={styles['analytics-range']}>
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <button
          className="btn btn--primary btn--small"
          onClick={loadChart}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load"}
        </button>
      </div>

      {error && (
        <Notice type="error" className={styles['error-notice']}>
          {error}
        </Notice>
      )}

      <div className={styles['analytics-chart-wrap']}>
        {chartData.length === 0 && !loading && !error ? (
          <p className={styles['no-data--padded']}>
            No data for selected range.
          </p>
        ) : (
          <canvas ref={canvasRef} />
        )}
      </div>
    </div>
  );
}
