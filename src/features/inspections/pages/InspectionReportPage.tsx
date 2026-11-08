import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { fieldError } from "../../../lib/api/errors";
import { formatDayTime } from "../../../lib/format";
import { directionOf, localeNames } from "../../../lib/locale";
import { paths } from "../../../lib/paths";
import { shortName } from "../../mechanics/names";
import type { Inspection, InspectionCategory, Report } from "../api";
import { inspectionCategories } from "../api";
import { ChecklistSection } from "../components/ChecklistSection";
import { IdentitySection } from "../components/IdentitySection";
import { ReportSummary } from "../components/ReportSummary";
import { SubmitReportDialog } from "../components/SubmitReportDialog";
import { VerdictSection } from "../components/VerdictSection";
import { useInspection, useSaveReportDraft, useSubmitReport } from "../hooks";
import { draftFromForm, emptyForm, formFromDraft, formProgress, reportFromForm } from "../reportForm";
import type { FormItem, ReportForm } from "../reportForm";

const inspectionIdFrom = ({ inspectionId = "" }: { inspectionId?: string }): number | null =>
  /^\d+$/u.test(inspectionId) ? Number(inspectionId) : null;

const carTitle = ({ car }: Inspection) =>
  car.listing?.title ?? [car.make?.name, car.model?.name].filter(Boolean).join(" ");

type ReportEditorProps = {
  inspection: Inspection;
  // The name of a default checklist item, in the report's language.
  itemLabel: (category: InspectionCategory, key: string) => string;
};

// The report form, started from the saved draft or from the default checklist.
function ReportEditor({ inspection, itemLabel }: ReportEditorProps) {
  const { t, i18n } = useTranslation(["inspections", "enums"]);
  const navigate = useNavigate();
  const save = useSaveReportDraft(inspection.id);
  const submit = useSubmitReport(inspection.id);
  const [form, setForm] = useState<ReportForm>(() => {
    const start = emptyForm(itemLabel, new Date());
    return inspection.reportDraft ? formFromDraft(inspection.reportDraft, start) : start;
  });
  const [category, setCategory] = useState<InspectionCategory>("exterior");
  const [addedId, setAddedId] = useState<string | null>(null);
  // The problems show after the first try to submit, then follow the edits.
  const [showProblems, setShowProblems] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const checked = reportFromForm(form);
  const problems = showProblems && "problems" in checked ? checked.problems : null;
  const progress = formProgress(form);
  const buyer = shortName(`${inspection.buyer.firstName} ${inspection.buyer.lastName}`);
  const title = `${carTitle(inspection)} · ${inspection.car.year}`;

  const update = (patch: Partial<ReportForm>) => setForm((current) => ({ ...current, ...patch }));

  const errorFor = (field: string): string | undefined => {
    const problem = problems?.fields[field as keyof typeof problems.fields];
    if (problem) {
      return t(`report.errors.${problem}`);
    }
    return fieldError(submit.error, field) ?? fieldError(save.error, field);
  };

  const trySubmit = () => {
    if ("problems" in checked) {
      setShowProblems(true);
      // Show the first section with an item to finish.
      const unfinished = inspectionCategories.find((section) =>
        form.sections[section].some(({ id }) => checked.problems.items[id]),
      );
      if (unfinished && Object.keys(checked.problems.fields).length === 0) {
        setCategory(unfinished);
      }
      return;
    }
    // A new try starts without the last answer's errors.
    submit.reset();
    setReport(checked.report);
  };

  const problemMessages = problems
    ? [
        Object.keys(problems.fields).length > 0 || Object.values(problems.items).includes("itemLabel")
          ? t("report.errors.check")
          : null,
        problems.unrated > 0 ? t("report.errors.unrated", { count: problems.unrated }) : null,
        problems.noItems ? t("report.errors.noItems") : null,
      ].filter((message) => message !== null)
    : [];
  const savedAt = inspection.reportDraftSavedAt;

  return (
    <div className="flex flex-col gap-24">
      <header className="flex flex-wrap items-center justify-between gap-16">
        <div className="flex min-w-0 items-center gap-16">
          {inspection.car.photoUrl ? (
            <img alt="" className="h-64 w-96 shrink-0 rounded-md object-cover" src={inspection.car.photoUrl} />
          ) : (
            <span className="flex h-64 w-96 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
              <Icon name="car" size={24} />
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-8">
              <p className="type-overline text-muted">
                {t("report.overline", { id: inspection.id, status: t(`enums:inspection_status.${inspection.status}`) })}
              </p>
              <p className="rounded-full bg-brand-soft px-8 py-4 type-label-s text-brand">
                <Trans
                  components={{
                    name: <span dir={directionOf(inspection.reportLanguage)} lang={inspection.reportLanguage} />,
                  }}
                  i18nKey="report.language"
                  t={t}
                  values={{ language: localeNames[inspection.reportLanguage] }}
                />
              </p>
            </div>
            <h1 className="type-h2 text-ink" dir="auto">
              {title}
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="flex flex-wrap items-center gap-8">
            <Button isPending={save.isPending} onClick={() => save.mutate(draftFromForm(form))} variant="ghost">
              {t("report.saveDraft")}
            </Button>
            <Button onClick={trySubmit} variant="primary">
              <Icon name="check-circle" size={18} />
              {t("report.submit")}
            </Button>
          </div>
          <output className="type-body-xs text-muted empty:hidden">
            {savedAt && t("report.draftSaved", { time: formatDayTime(savedAt, i18n.language) })}
          </output>
        </div>
      </header>
      <div className="flex flex-col gap-8 empty:hidden" role="alert">
        {save.error && <Alert tone="danger">{save.error.message}</Alert>}
        {problemMessages.map((message) => (
          <Alert key={message} tone="danger">
            {message}
          </Alert>
        ))}
      </div>
      <div className="grid grid-cols-1 items-start gap-24 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-24 lg:col-span-2">
          <IdentitySection errorFor={errorFor} form={form} update={update} />
          <ChecklistSection
            addedId={addedId}
            onAdd={setAddedId}
            onChange={(section, items: FormItem[]) =>
              setForm((current) => ({ ...current, sections: { ...current.sections, [section]: items } }))
            }
            onSelect={setCategory}
            problems={problems?.items ?? {}}
            progress={progress}
            sections={form.sections}
            selected={category}
          />
          <VerdictSection errorFor={errorFor} form={form} update={update} />
        </div>
        <ReportSummary
          isPending={submit.isPending}
          onSubmit={trySubmit}
          progress={progress}
          score={form.overallScore === "" ? null : Number(form.overallScore)}
          verdict={form.verdict}
        />
      </div>
      <SubmitReportDialog
        buyer={buyer}
        error={submit.error?.message ?? null}
        isPending={submit.isPending}
        // The API's field errors stay next to their inputs after closing.
        onClose={() => setReport(null)}
        onConfirm={() => {
          if (report) {
            submit.mutate(report, {
              onSuccess: () => void navigate(`${paths.inspections}?status=completed`),
            });
          }
        }}
        open={report !== null}
      />
    </div>
  );
}

// The mechanic writes the report of an inspection in progress here.
export function InspectionReportPage() {
  const { t } = useTranslation("inspections");
  const id = inspectionIdFrom(useParams());
  const query = useInspection(id);
  const inspection = query.data;
  // The default checklist is written in the report's language, which can
  // differ from the mechanic's.
  const report = useTranslation("inspections", { lng: inspection?.reportLanguage, useSuspense: false });

  const content = () => {
    if (id === null || query.error) {
      return (
        <div className="flex flex-col items-start gap-16" role="alert">
          <Alert tone="danger">{query.error?.message ?? t("common:errors.unexpected")}</Alert>
          <ButtonLink to={paths.inspections}>{t("report.backToQueue")}</ButtonLink>
        </div>
      );
    }
    if (!inspection || !report.ready) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }
    if (inspection.status !== "in_progress") {
      return (
        <div className="flex flex-col items-start gap-16">
          <Alert tone="info">{t("report.notInProgress")}</Alert>
          <ButtonLink to={paths.inspections}>{t("report.backToQueue")}</ButtonLink>
        </div>
      );
    }
    return (
      <ReportEditor
        inspection={inspection}
        itemLabel={(category, key) => report.t(`report.items.${category}.${key}`)}
        key={inspection.id}
      />
    );
  };

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:px-48 md:py-40 lg:px-80">
      <PageTitle>{t("report.pageTitle")}</PageTitle>
      {content()}
    </div>
  );
}
