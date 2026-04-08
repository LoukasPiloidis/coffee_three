"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { cartStore, cartTotalCents, useCart } from "@/lib/cart";
import { formatPrice, type Locale } from "@/lib/menu-types";
import type { PlaceOrderInput } from "@/lib/orders";
import { submitOrderAction } from "./actions";

export type SavedAddress = {
  id: string;
  label: string | null;
  street: string;
  city: string;
  postcode: string;
  notes: string | null;
};

type Props = {
  locale: Locale;
  loggedInEmail: string | null;
  loggedInName: string | null;
  savedAddresses: SavedAddress[];
};

export default function CheckoutForm({
  locale,
  loggedInEmail,
  loggedInName,
  savedAddresses,
}: Props) {
  const t = useTranslations("checkout");
  const tErr = useTranslations("checkout.errors");
  const router = useRouter();
  const cart = useCart();
  const totalCents = cartTotalCents(cart);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(loggedInName ?? "");
  const [email, setEmail] = useState(loggedInEmail ?? "");
  const [phone, setPhone] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses[0]?.id ?? ""
  );
  const [street, setStreet] = useState(savedAddresses[0]?.street ?? "");
  const [city, setCity] = useState(savedAddresses[0]?.city ?? "");
  const [postcode, setPostcode] = useState(savedAddresses[0]?.postcode ?? "");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<"cash" | "card">("cash");
  const [saveAddress, setSaveAddress] = useState(false);

  function onPickSavedAddress(id: string) {
    setSelectedAddressId(id);
    if (id === "") {
      setStreet("");
      setCity("");
      setPostcode("");
      return;
    }
    const a = savedAddresses.find((x) => x.id === id);
    if (a) {
      setStreet(a.street);
      setCity(a.city);
      setPostcode(a.postcode);
    }
  }

  if (cart.lines.length === 0) {
    return (
      <main className="page">
        <div className="container">
          <h1 className="page__title">{t("title")}</h1>
          <p className="empty">{/* empty cart */}</p>
        </div>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loggedInEmail && !email.trim() && !phone.trim()) {
      setError(tErr("contactRequired"));
      return;
    }

    const input: PlaceOrderInput = {
      lines: cart.lines,
      contact: {
        userId: null,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      },
      delivery: {
        street: street.trim(),
        city: city.trim(),
        postcode: postcode.trim(),
        notes: null,
      },
      paymentMethod: payment,
      notes: notes.trim() || null,
    };

    // Don't bother re-saving an address that came from the picker.
    const shouldSave = saveAddress && selectedAddressId === "";

    startTransition(async () => {
      const result = await submitOrderAction(input, shouldSave);
      if (result.ok) {
        cartStore.clear();
        router.push(`/order/${result.token}`);
      } else {
        if (result.error === "contactRequired") setError(tErr("contactRequired"));
        else if (result.error === "closed") setError(tErr("closed"));
        else if (result.error === "minOrder") setError(tErr("minOrder"));
        else if (result.error === "outOfArea") setError(tErr("outOfArea"));
        else setError("Something went wrong.");
      }
    });
  };

  return (
    <main className="page">
      <div className="container">
        <h1 className="page__title">{t("title")}</h1>

        <form onSubmit={handleSubmit} className="card stack-md">
          <div className="fields-row fields-row--2">
            <div className="field">
              <label>{t("name")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>{t("phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label>{t("email")}</label>
            <input
              type="email"
              value={email}
              disabled={!!loggedInEmail}
              onChange={(e) => setEmail(e.target.value)}
            />
            {!loggedInEmail && <div className="field__hint">{t("contactHint")}</div>}
          </div>

          {savedAddresses.length > 0 && (
            <div className="field">
              <label>{t("savedAddress")}</label>
              <select
                value={selectedAddressId}
                onChange={(e) => onPickSavedAddress(e.target.value)}
              >
                {savedAddresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label ?? a.street} — {a.street}, {a.city} {a.postcode}
                  </option>
                ))}
                <option value="">{t("newAddress")}</option>
              </select>
            </div>
          )}

          <div className="field">
            <label>{t("address")}</label>
            <input
              value={street}
              onChange={(e) => {
                setStreet(e.target.value);
                setSelectedAddressId("");
              }}
              required
            />
          </div>

          <div className="fields-row fields-row--2">
            <div className="field">
              <label>{t("city")}</label>
              <input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setSelectedAddressId("");
                }}
                required
              />
            </div>
            <div className="field">
              <label>{t("postcode")}</label>
              <input
                value={postcode}
                onChange={(e) => {
                  setPostcode(e.target.value);
                  setSelectedAddressId("");
                }}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>{t("notes")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {loggedInEmail && selectedAddressId === "" && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.9rem",
              }}
            >
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              {t("saveAddress")}
            </label>
          )}

          <div className="option-group">
            <div className="option-group__label">{t("paymentMethod")}</div>
            <div className="option-list">
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "cash"}
                  onChange={() => setPayment("cash")}
                />
                {t("cash")}
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "card"}
                  onChange={() => setPayment("card")}
                />
                {t("card")}
              </label>
            </div>
          </div>

          <div className="totals">
            <span>{t("title")}</span>
            <strong>{formatPrice(totalCents / 100, locale)}</strong>
          </div>

          {error && <div className="notice notice--error">{error}</div>}

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={isPending}
          >
            {isPending ? "…" : t("submit")}
          </button>
        </form>
      </div>
    </main>
  );
}
