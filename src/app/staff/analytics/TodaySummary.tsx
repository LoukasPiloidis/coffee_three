import styles from "./Analytics.module.css";

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

export function TodaySummary({ data }: { data: DailyAnalytics | null }) {
  return (
    <div className="card">
      <h2 className={styles['section-title']}>Today</h2>
      {data ? (
        <table className={styles['analytics-table']}>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Revenue</th>
              <th>Orders</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Delivery</td>
              <td className={styles.mono}>{formatEuro(data.deliveryRevenue)}</td>
              <td className={styles.mono}>{data.deliveryCount}</td>
            </tr>
            <tr>
              <td>Takeaway</td>
              <td className={styles.mono}>{formatEuro(data.takeawayRevenue)}</td>
              <td className={styles.mono}>{data.takeawayCount}</td>
            </tr>
            <tr>
              <td>Cash</td>
              <td className={styles.mono}>{formatEuro(data.cashRevenue)}</td>
              <td className={styles.mono}>{data.cashCount}</td>
            </tr>
            <tr>
              <td>Card</td>
              <td className={styles.mono}>{formatEuro(data.cardRevenue)}</td>
              <td className={styles.mono}>{data.cardCount}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className={styles.mono}>
                {formatEuro(data.deliveryRevenue + data.takeawayRevenue)}
              </td>
              <td className={styles.mono}>{data.totalOrders}</td>
            </tr>
            <tr>
              <td>Offers used</td>
              <td></td>
              <td className={styles.mono}>{data.offersUsed}</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className={styles['no-data']}>No orders today.</p>
      )}
    </div>
  );
}
