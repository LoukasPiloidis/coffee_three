import { useTranslations } from "next-intl";

type Address = {
  id: string;
  label: string | null;
  street: string;
  city: string;
  postcode: string;
  notes: string | null;
};

export function AddressList({
  items,
  onDelete,
  pending,
}: {
  items: Address[];
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  if (items.length === 0) return null;

  return (
    <>
      {items.map((address) => (
        <div
          key={address.id}
          className="card"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{address.label ?? address.street}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {address.street}, {address.city} {address.postcode}
            </div>
            {address.notes && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                {address.notes}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            onClick={() => onDelete(address.id)}
            disabled={pending}
            aria-label={tCommon("cancel")}
          >
            {t("deleteAddress")}
          </button>
        </div>
      ))}
    </>
  );
}
