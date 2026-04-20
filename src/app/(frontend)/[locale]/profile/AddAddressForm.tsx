import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormField } from "@/components/FormField";
import { Notice } from "@/components/Notice";

export function AddAddressForm({
  onSubmit,
  onCancel,
  pending,
}: {
  onSubmit: (data: {
    label: string;
    street: string;
    city: string;
    postcode: string;
    notes: string;
  }) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    onSubmit({ label, street, city, postcode, notes });
  }

  return (
    <form onSubmit={handleSubmit} className="card stack-md">
      <FormField label={t("addressLabel")}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t("addressLabelPlaceholder")}
        />
      </FormField>
      <FormField label={t("addressStreet")}>
        <input
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          required
        />
      </FormField>
      <div className="fields-row fields-row--2">
        <FormField label={t("addressCity")}>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          />
        </FormField>
        <FormField label={t("addressPostcode")}>
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            required
          />
        </FormField>
      </div>
      <FormField label={t("addressNotes")}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </FormField>
      {error && <Notice type="error">{error}</Notice>}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={pending}
        >
          {tCommon("save")}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onCancel}
          disabled={pending}
        >
          {tCommon("cancel")}
        </button>
      </div>
    </form>
  );
}
