"use client";

import { cartStore, type CartLine } from "@/lib/cart";
import { useRouter } from "@/i18n/navigation";

type Item = Omit<CartLine, "lineId">;

export default function ReorderButton({
  items,
  label,
}: {
  items: Item[];
  label: string;
}) {
  const router = useRouter();
  const reorder = () => {
    items.forEach((i) => cartStore.addLine(i));
    router.push("/cart");
  };
  return (
    <button className="btn btn--primary btn--small" onClick={reorder}>
      {label}
    </button>
  );
}
