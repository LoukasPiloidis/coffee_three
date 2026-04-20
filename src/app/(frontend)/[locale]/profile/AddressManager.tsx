"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { addAddressAction, deleteAddressAction } from "./actions";
import { AddAddressForm } from "./AddAddressForm";
import { AddressList } from "./AddressList";

type Address = {
  id: string;
  label: string | null;
  street: string;
  city: string;
  postcode: string;
  notes: string | null;
};

export function AddressManager({
  initialAddresses,
}: {
  initialAddresses: Address[];
}) {
  const t = useTranslations("profile");
  const [items, setItems] = useState<Address[]>(initialAddresses);
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAddressAction(id);
      if (result.ok) {
        setItems((prev) => prev.filter((a) => a.id !== id));
      }
    });
  }

  function onAdd(data: {
    label: string;
    street: string;
    city: string;
    postcode: string;
    notes: string;
  }) {
    startTransition(async () => {
      const result = await addAddressAction(data);
      if (!result.ok) return;
      setItems((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          label: data.label.trim() || null,
          street: data.street.trim(),
          city: data.city.trim(),
          postcode: data.postcode.trim(),
          notes: data.notes.trim() || null,
        },
      ]);
      setAdding(false);
    });
  }

  return (
    <div className="stack-sm">
      {items.length === 0 && !adding ? (
        <p className="empty">—</p>
      ) : (
        <AddressList items={items} onDelete={onDelete} pending={pending} />
      )}

      {adding ? (
        <AddAddressForm
          onSubmit={onAdd}
          onCancel={() => setAdding(false)}
          pending={pending}
        />
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
