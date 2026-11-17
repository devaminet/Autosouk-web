import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { documentsByKind, mechanicKinds } from "../api";
import type { MechanicKind } from "../api";
import { useChooseKind } from "../hooks";

const kindIcons: Record<MechanicKind, IconName> = { solo: "user", garage: "home" };

type KindChoiceProps = {
  current: MechanicKind | null;
  onChosen: () => void;
};

// Solo or garage, which decides the documents to send.
export function KindChoice({ current, onChosen }: KindChoiceProps) {
  const { t } = useTranslation(["documents", "enums"]);
  const choose = useChooseKind();
  const [kind, setKind] = useState<MechanicKind>(current ?? "solo");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    choose.mutate(kind, { onSuccess: onChosen });
  };

  return (
    <form className="flex w-full flex-col gap-20 text-start" noValidate onSubmit={submit}>
      <fieldset className="flex min-w-0 flex-col gap-12">
        <legend className="sr-only">{t("kind.legend")}</legend>
        {mechanicKinds.map((option) => (
          // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- the text is nested deeper than the rule checks.
          <label
            className="group flex cursor-pointer items-start gap-16 rounded-xl bg-surface p-20 ring-1 ring-line ring-inset has-checked:bg-brand-soft/40 has-checked:ring-2 has-checked:ring-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
            key={option}
          >
            <input
              checked={kind === option}
              className="sr-only"
              name="kind"
              onChange={() => setKind(option)}
              type="radio"
              value={option}
            />
            <span
              aria-hidden="true"
              className="mt-2 size-20 shrink-0 rounded-full bg-surface ring-2 ring-line-strong ring-inset group-has-checked:ring-6 group-has-checked:ring-brand"
            />
            <span className="flex size-40 shrink-0 items-center justify-center rounded-full bg-paper text-ink-2 group-has-checked:bg-brand-soft group-has-checked:text-brand">
              <Icon name={kindIcons[option]} size={22} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-4">
              <span className="type-h5 text-ink">{t(`enums:mechanic_kind.${option}`)}</span>
              <span className="type-body-s text-ink-2">{t(`kind.${option}Description`)}</span>
              <span className="flex flex-wrap gap-4">
                {documentsByKind[option].map((type) => (
                  <span className="inline-flex items-center gap-4 rounded-sm bg-paper px-8 py-2 type-body-xs text-ink-2" key={type}>
                    <Icon name="file" size={12} />
                    {t(`enums:mechanic_document_type.${type}`)}
                  </span>
                ))}
              </span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="flex items-center gap-8 type-body-xs text-muted">
        <Icon name="lock" size={16} />
        {t("privacy")}
      </p>
      <div className="empty:hidden" role="alert">
        {choose.error && <Alert tone="danger">{choose.error.message}</Alert>}
      </div>
      <Button block isPending={choose.isPending} size="l" type="submit" variant="primary">
        {t("kind.continue")}
        <Icon name="arrow-right" size={18} />
      </Button>
    </form>
  );
}
