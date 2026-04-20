import { FormField } from "@/components/FormField";
import styles from "./CheckoutForm.module.css";

export function TipSection({
  tipInput,
  setTipInput,
  labels,
}: {
  tipInput: string;
  setTipInput: (v: string) => void;
  labels: {
    tipTitle: string;
    tipSubtitle: string;
    tipOptional: string;
    tipNone: string;
    tipCustom: string;
  };
}) {
  return (
    <div className={styles['tip-box']}>
      <div className={styles['tip-box__header']}>
        <div>
          <div className={styles['tip-box__title']}>{labels.tipTitle}</div>
          <div className={styles['tip-box__subtitle']}>{labels.tipSubtitle}</div>
        </div>
        <span className={styles['tip-box__badge']}>{labels.tipOptional}</span>
      </div>
      <div className={styles['tip-box__presets']}>
        {["0.5", "1", "2"].map((v) => {
          const selected = tipInput === v;
          return (
            <button
              key={v}
              type="button"
              className={`btn btn--small ${
                selected ? "btn--primary" : "btn--ghost"
              }`}
              onClick={() => setTipInput(selected ? "" : v)}
            >
              €{v}
            </button>
          );
        })}
        <button
          type="button"
          className={`btn btn--small ${
            tipInput === "" ? "btn--primary" : "btn--ghost"
          }`}
          onClick={() => setTipInput("")}
        >
          {labels.tipNone}
        </button>
      </div>
      <FormField label={labels.tipCustom} className={styles['tip-field']}>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.10"
          placeholder="0.00"
          value={tipInput}
          onChange={(e) => setTipInput(e.target.value)}
        />
      </FormField>
    </div>
  );
}
