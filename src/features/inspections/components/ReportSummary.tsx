import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import type { Verdict } from "../api";
import type { formProgress } from "../reportForm";

type Progress = ReturnType<typeof formProgress>;

const steps = ["identity", "mileage", "papers", "checklist", "summary"] as const;

type ReportSummaryProps = {
  score: number | null;
  verdict: Verdict | null;
  progress: Progress;
  onSubmit: () => void;
  isPending: boolean;
};

// The report at a glance as the mechanic fills it in, with the way to submit it.
export function ReportSummary({ score, verdict, progress, onSubmit, isPending }: ReportSummaryProps) {
  const { t } = useTranslation(["inspections", "enums"]);
  const shown = score === null ? 0 : Math.min(score, 100);

  return (
    <aside aria-label={t("report.summaryCard.label")} className="flex flex-col gap-16 lg:sticky lg:top-24">
      <div className="flex flex-col items-center gap-16 rounded-2xl border border-line bg-surface p-24">
        <div className="relative flex size-score items-center justify-center">
          <svg aria-hidden="true" className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
            <circle className="stroke-line" cx="50" cy="50" fill="none" r="44" strokeWidth="8" />
            <circle
              className="stroke-brand"
              cx="50"
              cy="50"
              fill="none"
              pathLength={100}
              r="44"
              strokeDasharray={`${shown} 100`}
              strokeLinecap="round"
              strokeWidth="8"
            />
          </svg>
          <p className="flex flex-col items-center">
            <bdi className="type-display-m text-ink" dir="ltr">
              {score === null ? "–" : score}
            </bdi>
            <bdi className="type-mono-s text-muted" dir="ltr">
              {t("report.verdict.outOf")}
            </bdi>
            {score === null && <span className="sr-only">{t("report.summaryCard.noScore")}</span>}
          </p>
        </div>
        <p className="type-h3 text-ink">
          {verdict ? t(`enums:inspection_verdict.${verdict}`) : t("report.summaryCard.noVerdict")}
        </p>
        <ul className="flex flex-wrap justify-center gap-8">
          <li className="rounded-full bg-success-soft px-8 py-4 type-label-s text-success">
            {t("report.summaryCard.pass", { count: progress.pass })}
          </li>
          <li className="rounded-full bg-warning-soft px-8 py-4 type-label-s text-warning">
            {t("report.summaryCard.attention", { count: progress.attention })}
          </li>
          <li className="rounded-full bg-danger-soft px-8 py-4 type-label-s text-danger">
            {t("report.summaryCard.fail", { count: progress.fail })}
          </li>
        </ul>
      </div>
      <ul aria-label={t("report.summaryCard.steps")} className="flex flex-col gap-12 rounded-2xl border border-line bg-surface p-20">
        {steps.map((step) => {
          const done = progress.steps[step];
          return (
            <li className={`flex items-center gap-12 type-body-s ${done ? "text-ink" : "text-muted"}`} key={step}>
              <Icon className={done ? "text-success" : "text-muted"} name={done ? "check-circle" : "clock"} size={18} />
              {t(`report.summaryCard.${step}`)}
              <span className="sr-only">
                {" "}
                ({t(done ? "report.summaryCard.done" : "report.summaryCard.todo")})
              </span>
            </li>
          );
        })}
      </ul>
      <Button block isPending={isPending} onClick={onSubmit} size="l" variant="primary">
        <Icon name="file" size={18} />
        {t("report.submitAndGenerate")}
      </Button>
    </aside>
  );
}
