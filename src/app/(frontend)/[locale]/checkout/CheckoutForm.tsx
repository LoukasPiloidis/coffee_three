"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { FormField } from "@/components/FormField";
import { Notice } from "@/components/Notice";
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
import styles from "./CheckoutForm.module.css";

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
          <div className={styles['order-type-toggle']}>
            <button
              type="button"
              className={`${styles['order-type-toggle__btn']}${isDelivery ? ` ${styles['order-type-toggle__btn--active']}` : ""}`}
              onClick={() => setOrderType("delivery")}
            >
              {t("delivery")}
            </button>
            <button
              type="button"
              className={`${styles['order-type-toggle__btn']}${!isDelivery ? ` ${styles['order-type-toggle__btn--active']}` : ""}`}
              onClick={() => setOrderType("takeaway")}
            >
              {t("takeaway")}
            </button>
          </div>

          <div className={isDelivery ? "fields-row fields-row--2" : ""}>
            <FormField label={t("name")}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
            {isDelivery && (
              <FormField
                label={<>{t("phone")}<span className="option-group__required">*</span></>}
                hint={t("phoneHint")}
              >
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </FormField>
            )}
          </div>

          {!isDelivery && (
            <FormField label={t("phone")} hint={t("phoneOptional")}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
          )}

          {isDelivery && (
            <FormField label={t("email")}>
              <input
                type="email"
                value={email}
                disabled={!!loggedInEmail}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
          )}

          {isDelivery && savedAddresses.length > 0 && (
            <FormField label={t("savedAddress")}>
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
            </FormField>
          )}

          {isDelivery && (
            <>
              <FormField label={t("address")}>
                <input
                  value={street}
                  onChange={(e) => {
                    setStreet(e.target.value);
                    setSelectedAddressId("");
                  }}
                  required
                />
              </FormField>

              <div className="fields-row fields-row--2">
                <FormField label={t("city")}>
                  <input
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setSelectedAddressId("");
                    }}
                    required
                  />
                </FormField>
                <FormField label={t("postcode")}>
                  <input
                    value={postcode}
                    onChange={(e) => {
                      setPostcode(e.target.value);
                      setSelectedAddressId("");
                    }}
                    required
                  />
                </FormField>
              </div>
            </>
          )}

          <FormField label={t("notes")}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>

          {isDelivery && loggedInEmail && selectedAddressId === "" && (
            <label className={styles['save-address-label']}>
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
            <div className={styles['payment-hint']}>
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

          <div className={styles['tip-box']}>
            <div className={styles['tip-box__header']}>
              <div>
                <div className={styles['tip-box__title']}>{t("tipTitle")}</div>
                <div className={styles['tip-box__subtitle']}>{t("tipSubtitle")}</div>
              </div>
              <span className={styles['tip-box__badge']}>{t("tipOptional")}</span>
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
                {t("tipNone")}
              </button>
            </div>
            <FormField label={t("tipCustom")} className={styles['tip-field']}>
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

          {error && <Notice type="error">{error}</Notice>}

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
