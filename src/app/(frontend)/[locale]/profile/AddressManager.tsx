"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { addAddressAction, deleteAddressAction } from "./actions";

type Address = {
  id: string;
  label: string | null;
  street: string;
  city: string;
  postcode: string;
  notes: string | null;
};

export default function AddressManager({
  initialAddresses,
}: {
  initialAddresses: Address[];
}) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [items, setItems] = useState<Address[]>(initialAddresses);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [notes, setNotes] = useState("");

  function resetForm() {
    setLabel("");
    setStreet("");
    setCity("");
    setPostcode("");
    setNotes("");
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addAddressAction({
        label,
        street,
        city,
        postcode,
        notes,
      });
      if (!result.ok) {
        setError(t("addressErrorGeneric"));
        return;
      }
      // Optimistic-ish: append a placeholder; the next navigation will refresh
      // it with the real id from the server.
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          label: label.trim() || null,
          street: street.trim(),
          city: city.trim(),
          postcode: postcode.trim(),
          notes: notes.trim() || null,
        },
      ]);
      resetForm();
      setAdding(false);
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAddressAction(id);
      if (result.ok) {
        setItems((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  return (
    <div className="stack-sm">
      {items.length === 0 && !adding ? (
        <p className="empty">—</p>
      ) : (
        items.map((a) => (
          <div
            key={a.id}
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{a.label ?? a.street}</div>
              <div
                style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
              >
                {a.street}, {a.city} {a.postcode}
              </div>
              {a.notes && (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginTop: "0.25rem",
                  }}
                >
                  {a.notes}
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => onDelete(a.id)}
              disabled={pending}
              aria-label={tCommon("cancel")}
            >
              {t("deleteAddress")}
            </button>
          </div>
        ))
      )}

      {adding ? (
        <form onSubmit={onSubmit} className="card stack-md">
          <div className="field">
            <label>{t("addressLabel")}</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("addressLabelPlaceholder")}
            />
          </div>
          <div className="field">
            <label>{t("addressStreet")}</label>
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              required
            />
          </div>
          <div className="fields-row fields-row--2">
            <div className="field">
              <label>{t("addressCity")}</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>{t("addressPostcode")}</label>
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label>{t("addressNotes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <div className="notice notice--error">{error}</div>}
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
              onClick={() => {
                resetForm();
                setAdding(false);
              }}
              disabled={pending}
            >
              {tCommon("cancel")}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => setAdding(true)}
        >
          {t("addAddress")}
        </button>
      )}
    </div>
  );
}
