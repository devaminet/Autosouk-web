import { useId } from "react";
import { useTranslation } from "react-i18next";
import { TextAreaField } from "../../../components/TextAreaField";
import { TextField } from "../../../components/TextField";
import { verdicts } from "../api";
import type { ReportForm } from "../reportForm";

type VerdictSectionProps = {
  form: ReportForm;
  update: (patch: Partial<ReportForm>) => void;
  errorFor: (field: string) => string | undefined;
};

// The mechanic's conclusion: the verdict, the summary, the costs and the score.
export function VerdictSection({ form, update, errorFor }: VerdictSectionProps) {
  const { t } = useTranslation("inspections");
  const verdictErrorId = useId();
  const verdictError = errorFor("verdict");

  return (
    <section
      aria-labelledby="report-verdict"
      className="flex flex-col gap-24 rounded-2xl border border-line bg-surface p-20 md:p-32"
    >
      <h2 className="type-h3 text-ink" id="report-verdict">
        {t("report.verdict.title")}
      </h2>
      <fieldset aria-describedby={verdictError ? verdictErrorId : undefined} aria-invalid={Boolean(verdictError)}>
        <legend className="sr-only">{t("report.verdict.legend")}</legend>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {verdicts.map((verdict) => (
            <label
              className="flex min-h-48 cursor-pointer items-center justify-center rounded-md bg-surface px-12 type-label-m text-ink ring-1 ring-line-strong ring-inset has-checked:bg-brand-soft has-checked:text-brand has-checked:ring-2 has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
              key={verdict}
            >
              <input
                checked={form.verdict === verdict}
                className="sr-only"
                name="verdict"
                onChange={() => update({ verdict })}
                type="radio"
                value={verdict}
              />
              {t(`report.verdict.${verdict}`)}
            </label>
          ))}
        </div>
        {verdictError && (
          <p className="pt-8 type-body-xs text-danger" id={verdictErrorId}>
            {verdictError}
          </p>
        )}
      </fieldset>
      <TextAreaField
        dir="auto"
        error={errorFor("summary")}
        label={t("report.verdict.summary")}
        onChange={(event) => update({ summary: event.target.value })}
        placeholder={t("report.verdict.summaryPlaceholder")}
        required
        rows={4}
        value={form.summary}
      />
      <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
        <TextField
          dir="ltr"
          error={errorFor("estimatedRepairCost")}
          inputMode="numeric"
          label={t("report.verdict.repairCost")}
          onChange={(event) => update({ estimatedRepairCost: event.target.value.replace(/\D/gu, "") })}
          trailing={<span className="type-mono-s whitespace-nowrap text-muted">{t("report.verdict.mad")}</span>}
          value={form.estimatedRepairCost}
        />
        <TextField
          dir="ltr"
          error={errorFor("overallScore")}
          inputMode="numeric"
          label={t("report.verdict.score")}
          maxLength={3}
          onChange={(event) => update({ overallScore: event.target.value.replace(/\D/gu, "") })}
          required
          trailing={<span className="type-mono-s whitespace-nowrap text-muted">{t("report.verdict.outOf")}</span>}
          value={form.overallScore}
        />
      </div>
    </section>
  );
}
