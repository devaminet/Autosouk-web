import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import type { LogoChange } from "../api";

type LogoFieldProps = {
  // The saved logo's address, if any.
  currentUrl: string | null;
  change: LogoChange;
  onChange: (change: LogoChange) => void;
  // Shown when there is no logo, such as "GA" for Garage Atlas.
  initials: string;
  error?: string;
};

// Picks a new logo, or removes the saved one. Both apply on save.
export function LogoField({ currentUrl, change, onChange, initials, error }: LogoFieldProps) {
  const { t } = useTranslation("mechanics");
  const input = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(() => (change instanceof File ? URL.createObjectURL(change) : null), [change]);
  const shown = change === "remove" ? null : (previewUrl ?? currentUrl);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl],
  );

  return (
    <div className="flex flex-wrap items-center gap-20">
      <span className="flex size-96 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft type-h2 text-brand-ink">
        {shown ? (
          <img alt={t("identity.logoAlt")} className="size-full object-cover" src={shown} />
        ) : initials ? (
          <span aria-hidden="true" dir="auto">
            {initials}
          </span>
        ) : (
          <Icon className="text-brand" name="camera" size={32} />
        )}
      </span>
      <div className="flex min-w-0 flex-col gap-8">
        <p className="type-label-m text-ink">{t("identity.logo")}</p>
        <input
          accept=".jpg,.jpeg,.png,.webp"
          aria-label={t("identity.logo")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // The same file can be picked again after removing it.
            event.target.value = "";
            if (file) {
              onChange(file);
            }
          }}
          ref={input}
          tabIndex={-1}
          type="file"
        />
        <div className="flex flex-wrap items-center gap-8">
          <Button onClick={() => input.current?.click()} size="s" variant="dark">
            <Icon name="upload" size={16} />
            {t("identity.upload")}
          </Button>
          {shown && (
            <Button onClick={() => onChange(change instanceof File && currentUrl === null ? null : "remove")} size="s" variant="ghost">
              {t("identity.remove")}
            </Button>
          )}
        </div>
        <p className="type-body-xs text-muted">{change instanceof File ? change.name : t("identity.logoHelper")}</p>
        {error && <p className="type-body-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
