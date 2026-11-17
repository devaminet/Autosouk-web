import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { TextAreaField } from "../../../components/TextAreaField";
import { TextField } from "../../../components/TextField";
import { formatDate } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import type { MechanicDocument } from "../../documents/api";
import { DecisionSwitch } from "./DecisionSwitch";

export type DocumentDraft = { decision: "approved" | "rejected" | null; validUntil: string; reason: string };

const today = () => new Date().toISOString().slice(0, 10);

type DocumentDecisionRowProps = {
  document: MechanicDocument;
  draft: DocumentDraft;
  needsDate: boolean;
  viewing: boolean;
  presets: readonly string[];
  onView: () => void;
  onChange: (change: Partial<DocumentDraft>) => void;
};

// One document: open it, then approve it with its end date or reject it
// with a reason. Documents already decided only show where they stand.
export function DocumentDecisionRow({ document, draft, needsDate, viewing, presets, onView, onChange }: DocumentDecisionRowProps) {
  const { t } = useTranslation(["documents", "enums"]);
  const locale = getLocale();
  const label = t(`enums:mechanic_document_type.${document.type}`);
  const isPending = document.status === "pending";

  const state = () => {
    if (isPending) {
      return t("admin.waiting");
    }
    if (document.status === "approved" && document.validUntil) {
      return t("tile.validUntil", { date: formatDate(document.validUntil, locale) });
    }
    return t(`tile.states.${document.status === "approved" && document.expired ? "expired" : document.status}`);
  };

  return (
    <li className={`flex flex-col gap-12 rounded-lg p-16 ring-1 ring-inset ${viewing ? "bg-brand-soft ring-brand" : "ring-line"}`}>
      <div className="flex flex-wrap items-center gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="type-label-m text-ink">{label}</p>
          <p className="type-body-xs text-muted">{state()}</p>
        </div>
        <Button aria-label={t("admin.viewNamed", { document: label })} aria-pressed={viewing} onClick={onView} size="s" variant="ghost">
          <Icon name="eye" size={16} />
          {t("admin.view")}
        </Button>
      </div>
      {isPending && (
        <fieldset className="flex min-w-0 flex-col gap-12">
          <legend className="sr-only">{t("admin.decisionFor", { document: label })}</legend>
          <DecisionSwitch
            approveLabel={t("admin.approveOne")}
            name={`decision-${document.id}`}
            onChange={(decision) => onChange({ decision })}
            rejectLabel={t("admin.rejectOne")}
            value={draft.decision}
          />
          {draft.decision === "approved" && needsDate && (
            <TextField
              fieldClassName="max-w-filters"
              label={t("admin.validUntil")}
              min={today()}
              onChange={(event) => onChange({ validUntil: event.target.value })}
              required
              type="date"
              value={draft.validUntil}
            />
          )}
          {draft.decision === "rejected" && (
            <div className="flex flex-col gap-8 rounded-lg bg-danger-soft p-12">
              <div className="flex flex-wrap items-center gap-8">
                <span className="type-body-xs text-muted">{t("admin.presetsLabel")}</span>
                {presets.map((preset) => (
                  <Button key={preset} onClick={() => onChange({ reason: t(`admin.presets.${preset}`) })} size="s">
                    {t(`admin.presetNames.${preset}`)}
                  </Button>
                ))}
              </div>
              <TextAreaField
                helper={t("admin.reasonHelper")}
                label={t("admin.reasonFor", { document: label })}
                maxLength={500}
                onChange={(event) => onChange({ reason: event.target.value })}
                required
                rows={3}
                value={draft.reason}
              />
            </div>
          )}
        </fieldset>
      )}
    </li>
  );
}
