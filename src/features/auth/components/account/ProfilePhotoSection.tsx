import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../../components/Badge";
import { Button } from "../../../../components/Button";
import { FormErrors } from "../../../../components/FormErrors";
import { Icon } from "../../../../components/Icon";
import type { AuthUser } from "../../api";
import { useCityOptions } from "../../hooks";
import { useProfilePhotoUpload } from "../../useProfilePhotoUpload";
import { SettingsSection } from "./SettingsSection";

type ProfilePhotoSectionProps = {
  id: string;
  user: AuthUser;
};

const noFields: string[] = [];

export function ProfilePhotoSection({ id, user }: ProfilePhotoSectionProps) {
  const { t } = useTranslation(["auth", "enums"]);
  const input = useRef<HTMLInputElement>(null);
  const cities = useCityOptions();
  const { upload, photo, progress, error, cancel } = useProfilePhotoUpload();
  const percent = Math.round(progress * 100);
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const city = cities.options.find((option) => option.id === user.cityId)?.label;

  return (
    <SettingsSection description={t("account.photo.description")} id={id} title={t("account.photo.title")}>
      <div className="flex flex-col gap-20 sm:flex-row sm:items-center">
        <span className="flex size-96 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft type-h2 text-brand-ink">
          {user.imageUrl ? (
            <img alt={t("account.photo.current")} className="size-full object-cover" src={user.imageUrl} />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <p className="type-h4 text-ink">
            <bdi>{`${user.firstName} ${user.lastName}`}</bdi>
          </p>
          <div className="flex flex-wrap gap-8">
            <Badge tone="brand">{t(`enums:role.${user.role}`, { defaultValue: user.role })}</Badge>
            {user.isVerified && <Badge tone="success">{t("account.emailVerified")}</Badge>}
          </div>
          {city && <p className="type-body-s text-muted">{city}</p>}
        </div>
        <input
          accept=".jpg,.jpeg,.png,.webp"
          aria-label={t("account.photo.change")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // The same file can be picked again after a failure.
            event.target.value = "";
            if (file) {
              upload(file);
            }
          }}
          ref={input}
          tabIndex={-1}
          type="file"
        />
        <Button className="self-start sm:self-center" disabled={Boolean(photo)} onClick={() => input.current?.click()} size="s">
          <Icon name="camera" size={16} />
          {t("account.photo.change")}
        </Button>
      </div>
      {photo && (
        <div className="flex items-center gap-16 rounded-lg bg-paper p-16">
          <span className="flex size-control-m shrink-0 items-center justify-center rounded-md bg-surface text-muted">
            <Icon name="image" size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-8">
            <div className="flex flex-wrap items-baseline justify-between gap-8">
              <p className="min-w-0 truncate type-label-m text-ink" dir="auto">
                {photo.name}
              </p>
              <p className="type-body-xs text-muted">
                {t("account.photo.uploading")} <bdi dir="ltr">{percent}%</bdi>
              </p>
            </div>
            <progress
              aria-label={t("account.photo.uploadingFile", { name: photo.name })}
              className="sr-only"
              max={100}
              value={percent}
            />
            <div aria-hidden="true" className="h-4 overflow-hidden rounded-full bg-line">
              {/* The width is the progress, so it can't be a class. */}
              <div className="h-full rounded-full bg-brand" style={{ inlineSize: `${percent}%` }} />
            </div>
          </div>
          <button
            aria-label={t("account.photo.cancel")}
            className="flex size-control-s shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
            onClick={cancel}
            type="button"
          >
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
      <FormErrors error={error} fields={noFields} />
    </SettingsSection>
  );
}
