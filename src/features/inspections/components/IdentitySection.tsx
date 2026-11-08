import { useId } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { TextField } from "../../../components/TextField";
import { mileageConsistencies } from "../api";
import type { MileageConsistency } from "../api";
import type { ReportForm } from "../reportForm";

const consistencyIcons: Record<MileageConsistency, IconName> = {
  consistent: "check-circle",
  suspicious: "alert-triangle",
  unverifiable: "info",
};

const consistencyLooks: Record<MileageConsistency, string> = {
  consistent: "has-checked:bg-success-soft has-checked:ring-success has-checked:text-success",
  suspicious: "has-checked:bg-warning-soft has-checked:ring-warning has-checked:text-warning",
  unverifiable: "has-checked:bg-info-soft has-checked:ring-info has-checked:text-info",
};

type SwitchCardProps = {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
};

// A yes-or-no answer about the papers, as a switch.
function SwitchCard({ label, hint, checked, onChange, children }: SwitchCardProps) {
  const hintId = useId();

  return (
    <div className="flex flex-col gap-12 rounded-xl p-16 ring-1 ring-line ring-inset">
      <label className="flex cursor-pointer items-center gap-16">
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="type-label-m text-ink">{label}</span>
          {hint && (
            <span className="type-body-xs text-muted" id={hintId}>
              {hint}
            </span>
          )}
        </span>
        <input
          aria-checked={checked}
          aria-describedby={hint ? hintId : undefined}
          checked={checked}
          className="peer sr-only"
          onChange={(event) => onChange(event.target.checked)}
          role="switch"
          type="checkbox"
        />
        <span
          aria-hidden="true"
          className="flex h-24 w-40 shrink-0 items-center rounded-full bg-line-strong p-4 peer-checked:bg-success peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
        >
          <span className={`size-16 rounded-full bg-surface ${checked ? "ms-auto" : ""}`} />
        </span>
      </label>
      {children}
    </div>
  );
}

type IdentitySectionProps = {
  form: ReportForm;
  update: (patch: Partial<ReportForm>) => void;
  errorFor: (field: string) => string | undefined;
};

// What the mechanic checks against the papers: plates, VIN, mileage and dates.
export function IdentitySection({ form, update, errorFor }: IdentitySectionProps) {
  const { t } = useTranslation("inspections");
  const consistencyErrorId = useId();
  const consistencyError = errorFor("mileageConsistency");

  return (
    <section
      aria-labelledby="report-identity"
      className="flex flex-col gap-24 rounded-2xl border border-line bg-surface p-20 md:p-32"
    >
      <div className="flex flex-wrap items-baseline gap-8">
        <h2 className="flex items-center gap-8 type-h3 text-ink" id="report-identity">
          <Icon className="text-brand" name="hash" size={20} />
          {t("report.identity.title")}
        </h2>
        <p className="type-body-xs text-muted">{t("report.identity.hint")}</p>
      </div>
      <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
        <TextField
          autoComplete="off"
          dir="ltr"
          error={errorFor("matricule")}
          label={t("report.identity.matricule")}
          onChange={(event) => update({ matricule: event.target.value })}
          required
          value={form.matricule}
        />
        <TextField
          autoCapitalize="characters"
          autoComplete="off"
          dir="ltr"
          error={errorFor("vin")}
          helper={t("report.identity.vinHelper")}
          label={t("report.identity.vin")}
          maxLength={17}
          onChange={(event) => update({ vin: event.target.value.toUpperCase() })}
          spellCheck={false}
          value={form.vin}
        />
        <TextField
          autoComplete="off"
          dir="ltr"
          error={errorFor("carteGriseNumber")}
          label={t("report.identity.carteGrise")}
          onChange={(event) => update({ carteGriseNumber: event.target.value })}
          value={form.carteGriseNumber}
        />
        <TextField
          dir="ltr"
          error={errorFor("mileage")}
          icon="gauge"
          inputMode="numeric"
          label={t("report.identity.mileage")}
          onChange={(event) => update({ mileage: event.target.value.replace(/\D/gu, "") })}
          required
          trailing={<span className="type-mono-s whitespace-nowrap text-muted">{t("report.identity.km")}</span>}
          value={form.mileage}
        />
        <TextField
          error={errorFor("firstRegistrationDate")}
          label={t("report.identity.firstRegistration")}
          onChange={(event) => update({ firstRegistrationDate: event.target.value })}
          type="date"
          value={form.firstRegistrationDate}
        />
        <TextField
          error={errorFor("inspectedAt")}
          label={t("report.identity.inspectedAt")}
          onChange={(event) => update({ inspectedAt: event.target.value })}
          type="datetime-local"
          value={form.inspectedAt}
        />
      </div>
      <fieldset
        aria-describedby={consistencyError ? consistencyErrorId : undefined}
        aria-invalid={Boolean(consistencyError)}
        className="flex flex-col gap-12"
      >
        <legend className="pb-12 type-label-m text-ink">{t("report.identity.consistency")}</legend>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {mileageConsistencies.map((value) => (
            <label
              className={`flex min-h-48 cursor-pointer items-center gap-8 rounded-md bg-surface px-16 type-label-m text-ink ring-1 ring-line-strong ring-inset has-checked:ring-2 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand ${consistencyLooks[value]}`}
              key={value}
            >
              <input
                checked={form.mileageConsistency === value}
                className="sr-only"
                name="mileageConsistency"
                onChange={() => update({ mileageConsistency: value })}
                type="radio"
                value={value}
              />
              <Icon name={consistencyIcons[value]} size={18} />
              {t(`report.consistency.${value}`)}
            </label>
          ))}
        </div>
        {consistencyError && (
          <p className="type-body-xs text-danger" id={consistencyErrorId}>
            {consistencyError}
          </p>
        )}
        <TextField
          dir="auto"
          error={errorFor("mileageConsistencyNote")}
          hideLabel
          label={t("report.identity.consistencyNote")}
          onChange={(event) => update({ mileageConsistencyNote: event.target.value })}
          placeholder={t("report.identity.consistencyNotePlaceholder")}
          value={form.mileageConsistencyNote}
        />
      </fieldset>
      <div className="grid grid-cols-1 items-start gap-16 md:grid-cols-2">
        <SwitchCard
          checked={form.controleTechniqueValid}
          label={t("report.identity.ct")}
          onChange={(checked) => update({ controleTechniqueValid: checked })}
        >
          {form.controleTechniqueValid && (
            <TextField
              error={errorFor("controleTechniqueExpiry")}
              label={t("report.identity.ctExpiry")}
              onChange={(event) => update({ controleTechniqueExpiry: event.target.value })}
              type="date"
              value={form.controleTechniqueExpiry}
            />
          )}
        </SwitchCard>
        <SwitchCard
          checked={form.vignetteValid}
          hint={t("report.identity.vignetteHint")}
          label={t("report.identity.vignette")}
          onChange={(checked) => update({ vignetteValid: checked })}
        />
      </div>
    </section>
  );
}
