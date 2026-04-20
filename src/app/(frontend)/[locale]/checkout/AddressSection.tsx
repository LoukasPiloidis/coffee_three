import { FormField } from "@/components/FormField";
import type { SavedAddress } from "./CheckoutForm";
import styles from "./CheckoutForm.module.css";

export function AddressSection({
  savedAddresses,
  selectedAddressId,
  onPickSavedAddress,
  street,
  setStreet,
  city,
  setCity,
  postcode,
  setPostcode,
  saveAddress,
  setSaveAddress,
  loggedInEmail,
  labels,
}: {
  savedAddresses: SavedAddress[];
  selectedAddressId: string;
  onPickSavedAddress: (id: string) => void;
  street: string;
  setStreet: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  postcode: string;
  setPostcode: (v: string) => void;
  saveAddress: boolean;
  setSaveAddress: (v: boolean) => void;
  loggedInEmail: string | null;
  labels: {
    savedAddress: string;
    newAddress: string;
    address: string;
    city: string;
    postcode: string;
    saveAddress: string;
  };
}) {
  return (
    <>
      {savedAddresses.length > 0 && (
        <FormField label={labels.savedAddress}>
          <select
            value={selectedAddressId}
            onChange={(e) => onPickSavedAddress(e.target.value)}
          >
            {savedAddresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label ?? a.street} — {a.street}, {a.city} {a.postcode}
              </option>
            ))}
            <option value="">{labels.newAddress}</option>
          </select>
        </FormField>
      )}

      <FormField label={labels.address}>
        <input
          value={street}
          onChange={(e) => {
            setStreet(e.target.value);
            onPickSavedAddress("");
          }}
          required
        />
      </FormField>

      <div className="fields-row fields-row--2">
        <FormField label={labels.city}>
          <input
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              onPickSavedAddress("");
            }}
            required
          />
        </FormField>
        <FormField label={labels.postcode}>
          <input
            value={postcode}
            onChange={(e) => {
              setPostcode(e.target.value);
              onPickSavedAddress("");
            }}
            required
          />
        </FormField>
      </div>

      {loggedInEmail && selectedAddressId === "" && (
        <label className={styles['save-address-label']}>
          <input
            type="checkbox"
            checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)}
          />
          {labels.saveAddress}
        </label>
      )}
    </>
  );
}
