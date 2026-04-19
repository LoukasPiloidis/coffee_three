"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import PriceWithDiscount from "@/components/PriceWithDiscount";
import { useRouter } from "@/i18n/navigation";
import {
  cartStore,
  cartTotalCentsWithOffers,
  totalOfferDiscountCents,
  useCart,
} from "@/lib/cart";
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
  loggedInPhone: string | null;
  savedAddresses: SavedAddress[];
};

export default function CheckoutForm({
  locale,
  loggedInEmail,
  loggedInName,
  loggedInPhone,
  savedAddresses,
}: Props) {
  const t = useTranslations("checkout");
  const tErr = useTranslations("checkout.errors");
  const router = useRouter();
  const cart = useCart();
  const totalCents = cartTotalCentsWithOffers(cart);
  const savingsCents = totalOfferDiscountCents(cart);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [orderType, setOrderType] = useState<"delivery" | "takeaway">(
    "delivery"
  );
  const isDelivery = orderType === "delivery";

  const [name, setName] = useState(loggedInName ?? "");
  const [email, setEmail] = useState(loggedInEmail ?? "");
  const [phone, setPhone] = useState(loggedInPhone ?? "");
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses[0]?.id ?? ""
  );
  const [street, setStreet] = useState(savedAddresses[0]?.street ?? "");
  const [city, setCity] = useState(savedAddresses[0]?.city ?? "");
  const [postcode, setPostcode] = useState(savedAddresses[0]?.postcode ?? "");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<"cash" | "card">("cash");
  const [tipInput, setTipInput] = useState<string>("");
  const [saveAddress, setSaveAddress] = useState(false);

  const parsedTipCents = (() => {
    const normalized = tipInput.replace(",", ".").trim();
    if (!normalized) return 0;
    const n = Number(normalized);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  })();

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

    if (!name.trim()) {
      setError(tErr("nameRequired"));
      return;
    }

    if (isDelivery && !phone.trim()) {
      setError(tErr("phoneRequired"));
      return;
    }

    const input: PlaceOrderInput = {
      lines: cart.lines,
      appliedOffers:
        cart.appliedOffers.length > 0 ? cart.appliedOffers : undefined,
      orderType,
      contact: {
        userId: null,
        name: name.trim(),
        email: isDelivery ? email.trim() || null : null,
        phone: phone.trim() || null,
      },
      ...(isDelivery
        ? {
            delivery: {
              street: street.trim(),
              city: city.trim(),
              postcode: postcode.trim(),
              notes: null,
            },
          }
        : {}),
      paymentMethod: payment,
      tipCents: parsedTipCents,
      notes: notes.trim() || null,
    };

    // Don't bother re-saving an address that came from the picker.
    const shouldSave = isDelivery && saveAddress && selectedAddressId === "";

    startTransition(async () => {
      const result = await submitOrderAction(input, shouldSave);
      if (result.ok) {
        cartStore.clear();
        router.push(`/order/${result.token}`);
      } else {
        if (result.error === "contactRequired")
          setError(tErr("contactRequired"));
        else if (result.error === "phoneRequired")
          setError(tErr("phoneRequired"));
        else if (result.error === "closed") setError(tErr("closed"));
        else if (result.error === "minOrder") setError(tErr("minOrder"));
        else if (result.error === "outOfArea") setError(tErr("outOfArea"));
        else if (result.error === "offerUnavailable")
          setError("An offer is no longer available.");
        else setError("Something went wrong.");
      }
    });
  };

  return (
    <main className="page">
      <div className="container">
        <h1 className="page__title">{t("title")}</h1>

        <form onSubmit={handleSubmit} className="card stack-md">
          <div className="order-type-toggle">
            <button
              type="button"
              className={`order-type-toggle__btn${isDelivery ? " order-type-toggle__btn--active" : ""}`}
              onClick={() => setOrderType("delivery")}
            >
              {t("delivery")}
            </button>
            <button
              type="button"
              className={`order-type-toggle__btn${!isDelivery ? " order-type-toggle__btn--active" : ""}`}
              onClick={() => setOrderType("takeaway")}
            >
              {t("takeaway")}
            </button>
          </div>

          <div className={isDelivery ? "fields-row fields-row--2" : ""}>
            <div className="field">
              <label>{t("name")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            {isDelivery && (
              <div className="field">
                <label>
                  {t("phone")}
                  <span className="option-group__required">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <div className="field__hint">{t("phoneHint")}</div>
              </div>
            )}
          </div>

          {!isDelivery && (
            <div className="field">
              <label>{t("phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="field__hint">{t("phoneOptional")}</div>
            </div>
          )}

          {isDelivery && (
            <div className="field">
              <label>{t("email")}</label>
              <input
                type="email"
                value={email}
                disabled={!!loggedInEmail}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {isDelivery && savedAddresses.length > 0 && (
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

          {isDelivery && (
            <>
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
            </>
          )}

          <div className="field">
            <label>{t("notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {isDelivery && loggedInEmail && selectedAddressId === "" && (
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
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              {t("paymentHint")}
            </div>
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

          <div className="tip-box">
            <div className="tip-box__header">
              <div>
                <div className="tip-box__title">{t("tipTitle")}</div>
                <div className="tip-box__subtitle">{t("tipSubtitle")}</div>
              </div>
              <span className="tip-box__badge">{t("tipOptional")}</span>
            </div>
            <div className="tip-box__presets">
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
                {t("tipNone")}
              </button>
            </div>
            <div className="field" style={{ marginTop: "0.5rem" }}>
              <label>{t("tipCustom")}</label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.10"
                placeholder="0.00"
                value={tipInput}
                onChange={(e) => setTipInput(e.target.value)}
              />
            </div>
          </div>

          <div className="totals">
            <span>{t("title")}</span>
            <strong>
              <PriceWithDiscount
                originalCents={totalCents + savingsCents + parsedTipCents}
                discountCents={savingsCents}
                locale={locale}
              />
            </strong>
          </div>
          {parsedTipCents > 0 && (
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginTop: "-0.5rem",
                textAlign: "right",
              }}
            >
              {t("tipIncluded", {
                amount: formatPrice(parsedTipCents / 100, locale),
              })}
            </div>
          )}

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
