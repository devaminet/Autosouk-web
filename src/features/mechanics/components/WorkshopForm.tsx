import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { FormErrors } from "../../../components/FormErrors";
import { TextAreaField } from "../../../components/TextAreaField";
import { TextField } from "../../../components/TextField";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { fieldError } from "../../../lib/api/errors";
import { useCityOptions } from "../../auth/hooks";
import type { LogoChange, Mechanic, WorkshopDetails } from "../api";
import { digitsOnly, initialsOf, workshopDetails, workshopFormFrom } from "../workshopForm";
import type { WorkshopFormValues } from "../workshopForm";
import { LocationSection } from "./LocationSection";
import { LogoField } from "./LogoField";
import { WorkshopSection } from "./WorkshopSection";

// Inputs that show their own message. The rest go in the summary.
const errorFields = [
  "name",
  "phone",
  "inspectionPrice",
  "description",
  "cityId",
  "address",
  "latitude",
  "longitude",
  "profileImageFilename",
];

type WorkshopFormProps = {
  // The page's save button submits the form through this id.
  id: string;
  mechanic: Mechanic | null;
  userCityId: number | null;
  error: unknown;
  // The page's save button label and state, repeated under the map.
  submitLabel: string;
  isPending: boolean;
  isSaved: boolean;
  // done runs once the save succeeds.
  onSave: (details: WorkshopDetails, logo: LogoChange, done: () => void) => void;
};

export function WorkshopForm({
  id,
  mechanic,
  userCityId,
  error,
  submitLabel,
  isPending,
  isSaved,
  onSave,
}: WorkshopFormProps) {
  const { t } = useTranslation(["mechanics", "listings"]);
  const form = useRef<HTMLFormElement>(null);
  const cities = useCityOptions();
  const [values, setValues] = useState(() => workshopFormFrom(mechanic, userCityId));
  const [logo, setLogo] = useState<LogoChange>(null);
  useFocusFirstInvalid(form, error);

  // A pin that moved stays on this page until the mechanic saves.
  const positionUnsaved =
    values.position !== null &&
    (mechanic === null || values.position.lat !== mechanic.latitude || values.position.lng !== mechanic.longitude);

  const set = <K extends keyof WorkshopFormValues>(key: K, value: WorkshopFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(workshopDetails(values), logo, () => setLogo(null));
  };

  return (
    <form className="flex flex-col gap-24" id={id} noValidate onSubmit={submit} ref={form}>
      <FormErrors error={error} fields={errorFields} />
      <WorkshopSection title={t("identity.title")}>
        <LogoField
          change={logo}
          currentUrl={mechanic?.profileImageUrl ?? null}
          error={fieldError(error, "profileImageFilename")}
          initials={initialsOf(values.name || mechanic?.name || "")}
          onChange={setLogo}
        />
        <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
          <TextField
            autoComplete="organization"
            dir="auto"
            error={fieldError(error, "name")}
            label={t("identity.name")}
            onChange={(event) => set("name", event.target.value)}
            value={values.name}
          />
          <TextField
            autoComplete="tel"
            dir="ltr"
            error={fieldError(error, "phone")}
            icon="phone"
            inputMode="tel"
            label={t("identity.phone")}
            onChange={(event) => set("phone", event.target.value)}
            type="tel"
            value={values.phone}
          />
          <TextField
            dir="ltr"
            error={fieldError(error, "inspectionPrice")}
            helper={t("identity.priceHelper")}
            inputMode="numeric"
            label={t("identity.price")}
            onChange={(event) => set("price", digitsOnly(event.target.value))}
            trailing={<span className="shrink-0 type-mono-s text-muted">{t("listings:units.mad")}</span>}
            value={values.price}
          />
        </div>
        <TextAreaField
          dir="auto"
          error={fieldError(error, "description")}
          label={t("identity.description")}
          onChange={(event) => set("description", event.target.value)}
          placeholder={t("identity.descriptionPlaceholder")}
          rows={4}
          value={values.description}
        />
      </WorkshopSection>
      <WorkshopSection description={t("location.description")} title={t("location.title")}>
        <LocationSection
          address={values.address}
          cities={cities.options}
          cityId={values.cityId}
          error={error}
          onAddressChange={(address) => set("address", address)}
          onCityChange={(cityId) => set("cityId", cityId)}
          onPositionChange={(position) => set("position", position)}
          position={values.position}
        />
        <div className="flex flex-wrap items-center justify-end gap-16 border-t border-line pt-20">
          <output className="type-body-s empty:hidden">
            {positionUnsaved ? (
              <span className="text-warning">{t("location.unsaved")}</span>
            ) : (
              isSaved && <span className="text-success">{t("workshop.saved")}</span>
            )}
          </output>
          <Button isPending={isPending} type="submit" variant="primary">
            {submitLabel}
          </Button>
        </div>
      </WorkshopSection>
    </form>
  );
}
