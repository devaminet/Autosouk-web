import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { FormErrors } from "../../../components/FormErrors";
import { Icon } from "../../../components/Icon";
import { SelectField } from "../../../components/SelectField";
import { TextAreaField } from "../../../components/TextAreaField";
import { TextField } from "../../../components/TextField";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../lib/api/errors";
import type { EquipmentCategory, ListingChanges, ListingDetail, Lookups } from "../api";
import { carErrorFields, carFieldError, digitsOnly } from "../carForm";
import { editFormFrom, listingChanges } from "../editListing";
import type { EditFormValues } from "../editListing";
import { EditListingMedia } from "./EditListingMedia";
import { EquipmentPicker } from "./EquipmentPicker";

const errorFields = ["title", "description", ...carErrorFields];

const unit = (text: string) => <span className="shrink-0 type-mono-s text-muted">{text}</span>;

type EditListingFormProps = {
  listing: ListingDetail;
  lookups: Lookups;
  equipment: EquipmentCategory[];
  isPending: boolean;
  error: unknown;
  onSave: (changes: ListingChanges | null) => void;
  onCancel: () => void;
  onDelete: () => void;
};

// The fields a seller changes most after publishing. Saving any change sends
// the listing back to review, so only changed fields are sent.
export function EditListingForm({
  listing,
  lookups,
  equipment,
  isPending,
  error,
  onSave,
  onCancel,
  onDelete,
}: EditListingFormProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const form = useRef<HTMLFormElement>(null);
  const [initial] = useState(() => editFormFrom(listing));
  const [values, setValues] = useState(initial);
  const car = listing.car;
  useFocusFirstInvalid(form, error);

  const set = <K extends keyof EditFormValues>(key: K, value: EditFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(listingChanges(initial, values, car !== null));
  };

  const totalEquipment = equipment.reduce((sum, category) => sum + category.equipment.length, 0);

  return (
    <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={submit} ref={form}>
      <div className="flex flex-1 flex-col gap-20 overflow-y-auto p-20 md:p-32">
        <Alert tone="warning">
          {t(listing.status === "approved" ? "edit.warningApproved" : "edit.warning")}
        </Alert>
        <FormErrors error={error} fields={errorFields} />
        <TextField
          dir="auto"
          error={fieldError(error, "title")}
          label={t("newListing.titleLabel")}
          onChange={(event) => set("title", event.target.value)}
          value={values.title}
        />
        <TextAreaField
          dir="auto"
          error={fieldError(error, "description")}
          label={t("newListing.descriptionLabel")}
          onChange={(event) => set("description", event.target.value)}
          rows={4}
          value={values.description}
        />
        {car && (
          <>
            <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
              <TextField
                dir="ltr"
                error={carFieldError(error, "price")}
                inputMode="numeric"
                label={t("carDetails.price")}
                onChange={(event) => set("price", digitsOnly(event.target.value))}
                trailing={unit(t("units.mad"))}
                value={values.price}
              />
              <TextField
                dir="ltr"
                error={carFieldError(error, "distance")}
                inputMode="numeric"
                label={t("carDetails.mileage")}
                onChange={(event) => set("distance", digitsOnly(event.target.value))}
                trailing={unit(t("units.km"))}
                value={values.distance}
              />
              <SelectField
                error={carFieldError(error, "cityId")}
                icon="map-pin"
                label={t("carDetails.city")}
                onChange={(event) => set("cityId", event.target.value)}
                value={values.cityId}
              >
                {lookups.cities.map(({ id, slug, name }) => (
                  <option key={id} value={id}>
                    {t(`enums:city.${slug}`, { defaultValue: name })}
                  </option>
                ))}
              </SelectField>
              <SelectField
                error={carFieldError(error, "stateId")}
                label={t("carDetails.condition")}
                onChange={(event) => set("stateId", event.target.value)}
                value={values.stateId}
              >
                {lookups.states.map(({ id, slug }) => (
                  <option key={id} value={id}>
                    {t(`enums:car_state.${slug}`)}
                  </option>
                ))}
              </SelectField>
            </div>
            <section className="flex flex-col gap-16 rounded-xl border border-line p-16">
              <div className="flex items-center justify-between gap-12">
                <h3 className="type-h5 text-ink">{t("equipment.title")}</h3>
                <span className="shrink-0 rounded-full bg-brand-soft px-8 type-label-s text-brand-ink">
                  {t("equipment.count", { selected: values.equipmentIds.length, total: totalEquipment })}
                </span>
              </div>
              <EquipmentPicker
                categories={equipment}
                error={carFieldError(error, "equipmentIds")}
                onChange={(selected) => set("equipmentIds", selected)}
                selected={values.equipmentIds}
              />
            </section>
            <EditListingMedia car={car} listingId={listing.id} />
          </>
        )}
      </div>
      <div className="flex items-center gap-8 border-t border-line bg-surface p-16 md:px-32">
        <Button disabled={isPending} onClick={onDelete} variant="danger">
          <Icon name="trash" size={16} />
          <span className="sr-only sm:not-sr-only">{t("actions.delete")}</span>
        </Button>
        <Button className="ms-auto" disabled={isPending} onClick={onCancel} variant="ghost">
          {t("edit.cancel")}
        </Button>
        <Button isPending={isPending} type="submit" variant="primary">
          {t("edit.save")}
        </Button>
      </div>
    </form>
  );
}
