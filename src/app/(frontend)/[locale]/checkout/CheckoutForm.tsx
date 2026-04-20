"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { FormField } from "@/components/FormField";
import { Notice } from "@/components/Notice";
import { PriceWithDiscount } from "@/components/PriceWithDiscount";
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
import { AddressSection } from "./AddressSection";
import { OrderTypeToggle } from "./OrderTypeToggle";
import { PaymentSection } from "./PaymentSection";
import { TipSection } from "./TipSection";

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

export function CheckoutForm({
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
          <OrderTypeToggle
            orderType={orderType}
            setOrderType={setOrderType}
            deliveryLabel={t("delivery")}
            takeawayLabel={t("takeaway")}
          />

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

          {isDelivery && (
            <AddressSection
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              onPickSavedAddress={onPickSavedAddress}
              street={street}
              setStreet={setStreet}
              city={city}
              setCity={setCity}
              postcode={postcode}
              setPostcode={setPostcode}
              saveAddress={saveAddress}
              setSaveAddress={setSaveAddress}
              loggedInEmail={loggedInEmail}
              labels={{
                savedAddress: t("savedAddress"),
                newAddress: t("newAddress"),
                address: t("address"),
                city: t("city"),
                postcode: t("postcode"),
                saveAddress: t("saveAddress"),
              }}
            />
          )}

          <FormField label={t("notes")}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </FormField>

          <PaymentSection
            payment={payment}
            setPayment={setPayment}
            labels={{
              paymentMethod: t("paymentMethod"),
              paymentHint: t("paymentHint"),
              cash: t("cash"),
              card: t("card"),
            }}
          />

          <TipSection
            tipInput={tipInput}
            setTipInput={setTipInput}
            labels={{
              tipTitle: t("tipTitle"),
              tipSubtitle: t("tipSubtitle"),
              tipOptional: t("tipOptional"),
              tipNone: t("tipNone"),
              tipCustom: t("tipCustom"),
            }}
          />

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
