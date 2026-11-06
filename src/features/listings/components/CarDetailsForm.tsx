import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { FormErrors } from "../../../components/FormErrors";
import { Icon } from "../../../components/Icon";
import { SelectField } from "../../../components/SelectField";
import { TextField } from "../../../components/TextField";
import { useFocusFirstInvalid } from "../../../hooks/useFocusFirstInvalid";
import { formatNumber } from "../../../lib/format";
import type { EquipmentCategory, Lookups, Named } from "../api";
import { transmissions } from "../api";
import { carErrorFields, carFieldError, digitsOnly } from "../carForm";
import type { CarFormValues } from "../carForm";
import { useModels } from "../hooks";
import { CarPreview } from "./CarPreview";
import { ChoiceGroup } from "./ChoiceGroup";
import { CountField } from "./CountField";
import { EquipmentPicker } from "./EquipmentPicker";
import { WizardCard } from "./WizardCard";
import { WizardStepForm } from "./WizardStepForm";
import { WizardTips } from "./WizardTips";

const firstYear = 1950;
// The API accepts next year's models.
const years = Array.from(
  { length: new Date().getFullYear() + 1 - firstYear + 1 },
  (_, index) => String(new Date().getFullYear() + 1 - index),
);
const doors = ["2", "3", "4", "5"];

const unit = (text: string) => (
  <span className="shrink-0 type-mono-s text-muted">{text}</span>
);

type CarDetailsFormProps = {
  // Lets a button outside the form, such as Save draft, submit it.
  id: string;
  title: string;
  initial: CarFormValues;
  lookups: Lookups;
  makes: Named[];
  equipment: EquipmentCategory[];
  backTo: string;
  isPending: boolean;
  error: unknown;
  onSubmit: (values: CarFormValues) => void;
};

export function CarDetailsForm({
  id,
  title,
  initial,
  lookups,
  makes,
  equipment,
  backTo,
  isPending,
  error,
  onSubmit,
}: CarDetailsFormProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const form = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(initial);
  const makeId = values.makeId === "" ? null : Number(values.makeId);
  const models = useModels(makeId);
  useFocusFirstInvalid(form, error);

  const set = <K extends keyof CarFormValues>(
    key: K,
    value: CarFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  const choose = t("carDetails.choose");
  const city = lookups.cities.find(({ id }) => String(id) === values.cityId);
  const fuel = lookups.carburants.find(
    ({ id }) => String(id) === values.carburantId,
  );
  const make = makes.find(({ id }) => String(id) === values.makeId);
  const model = models.data?.find(({ id }) => String(id) === values.modelId);
  const totalEquipment = equipment.reduce(
    (sum, category) => sum + category.equipment.length,
    0,
  );

  return (
    <WizardStepForm
      aside={
        <>
          <CarPreview
            city={
              city && t(`enums:city.${city.slug}`, { defaultValue: city.name })
            }
            details={[
              values.year,
              values.distance &&
                `${formatNumber(Number(values.distance))} ${t("units.km")}`,
              fuel && t(`enums:carburant.${fuel.slug}`),
              values.transmission &&
                t(`enums:transmission.${values.transmission}`),
            ].filter((detail): detail is string => Boolean(detail))}
            price={values.price === "" ? undefined : Number(values.price)}
            title={[make?.name, model?.name].filter(Boolean).join(" ") || title}
          />
          <WizardTips
            tips={[
              t("carDetails.tips.mileage"),
              t("carDetails.tips.fiscalPower"),
              t("carDetails.tips.history"),
            ]}
          />
        </>
      }
      back={
        <ButtonLink size="l" to={backTo}>
          <Icon name="arrow-left" size={18} />
          {t("carDetails.back")}
        </ButtonLink>
      }
      id={id}
      onSubmit={submit}
      ref={form}
      submit={
        <Button
          block
          className="md:w-auto"
          isPending={isPending}
          size="l"
          type="submit"
          variant="primary"
        >
          {t("carDetails.submit")}
          <Icon name="arrow-right" size={18} />
        </Button>
      }
    >
      <WizardCard
        description={t("carDetails.description")}
        headingLevel={1}
        title={t("carDetails.title")}
      >
        <FormErrors error={error} fields={carErrorFields} />
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 2xl:grid-cols-4">
          <SelectField
            error={carFieldError(error, "makeId")}
            label={t("carDetails.make")}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                makeId: event.target.value,
                modelId: "",
              }))
            }
            value={values.makeId}
          >
            <option value="">{choose}</option>
            {makes.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </SelectField>
          <SelectField
            disabled={makeId === null || models.isPending}
            error={carFieldError(error, "modelId")}
            label={t("carDetails.model")}
            onChange={(event) => set("modelId", event.target.value)}
            value={values.modelId}
          >
            <option value="">
              {makeId === null ? t("carDetails.chooseMakeFirst") : choose}
            </option>
            {models.data?.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </SelectField>
          <SelectField
            error={carFieldError(error, "year")}
            label={t("carDetails.year")}
            onChange={(event) => set("year", event.target.value)}
            value={values.year}
          >
            <option value="">{choose}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </SelectField>
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
            onChange={(event) =>
              set("distance", digitsOnly(event.target.value))
            }
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
            <option value="">{choose}</option>
            {lookups.cities.map(({ id, slug, name }) => (
              <option key={id} value={id}>
                {t(`enums:city.${slug}`, { defaultValue: name })}
              </option>
            ))}
          </SelectField>
        </div>
        <ChoiceGroup
          appearance="chips"
          error={carFieldError(error, "carburantId")}
          legend={t("carDetails.fuel")}
          name="carburantId"
          onChange={(value) => set("carburantId", value)}
          options={lookups.carburants.map(({ id, slug }) => ({
            value: String(id),
            label: t(`enums:carburant.${slug}`),
          }))}
          value={values.carburantId}
        />
        <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
          <ChoiceGroup
            appearance="segmented"
            error={carFieldError(error, "transmission")}
            legend={t("carDetails.transmission")}
            name="transmission"
            onChange={(value) => set("transmission", value)}
            options={transmissions.map((value) => ({
              value,
              label: t(`enums:transmission.${value}`),
            }))}
            value={values.transmission}
          />
          <ChoiceGroup
            appearance="segmented"
            error={carFieldError(error, "doorsNumber")}
            legend={t("carDetails.doors")}
            name="doorsNumber"
            onChange={(value) => set("doorsNumber", value)}
            options={doors.map((value) => ({ value, label: value }))}
            value={values.doorsNumber}
          />
        </div>
        <div className="grid grid-cols-1 gap-16 md:grid-cols-3">
          <TextField
            dir="ltr"
            error={carFieldError(error, "fiscalPower")}
            inputMode="numeric"
            label={t("carDetails.fiscalPower")}
            onChange={(event) =>
              set("fiscalPower", digitsOnly(event.target.value))
            }
            trailing={unit(t("units.cv"))}
            value={values.fiscalPower}
          />
          <CountField
            error={carFieldError(error, "ownersCount")}
            label={t("carDetails.owners")}
            onChange={(value) => set("ownersCount", value)}
            value={values.ownersCount}
          />
          <SelectField
            error={carFieldError(error, "originId")}
            icon="globe"
            label={t("carDetails.origin")}
            onChange={(event) => set("originId", event.target.value)}
            value={values.originId}
          >
            <option value="">{choose}</option>
            {lookups.origins.map(({ id, slug }) => (
              <option key={id} value={id}>
                {t(`enums:car_origin.${slug}`)}
              </option>
            ))}
          </SelectField>
        </div>
        <ChoiceGroup
          appearance="chips"
          error={carFieldError(error, "stateId")}
          helper={t("carDetails.conditionHelper")}
          legend={t("carDetails.condition")}
          name="stateId"
          onChange={(value) => set("stateId", value)}
          options={lookups.states.map(({ id, slug }) => ({
            value: String(id),
            label: t(`enums:car_state.${slug}`),
          }))}
          value={values.stateId}
        />
      </WizardCard>
      <WizardCard
        badge={
          <span className="shrink-0 rounded-full bg-brand-soft px-8 type-label-s text-brand-ink">
            {t("equipment.count", {
              selected: values.equipmentIds.length,
              total: totalEquipment,
            })}
          </span>
        }
        description={t("equipment.description")}
        headingLevel={2}
        title={t("equipment.title")}
      >
        <EquipmentPicker
          categories={equipment}
          error={carFieldError(error, "equipmentIds")}
          onChange={(selected) => set("equipmentIds", selected)}
          selected={values.equipmentIds}
        />
      </WizardCard>
    </WizardStepForm>
  );
}
