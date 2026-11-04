import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";

type ProfilePhotoFieldProps = {
  photo: File | null;
  onChange: (photo: File | null) => void;
  error?: string;
};

export function ProfilePhotoField({
  photo,
  onChange,
  error,
}: ProfilePhotoFieldProps) {
  const { t } = useTranslation("auth");
  const input = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const currentUrl = useRef<string | null>(null);

  const replacePreview = (file: File | null) => {
    if (currentUrl.current) {
      URL.revokeObjectURL(currentUrl.current);
    }
    currentUrl.current = file ? URL.createObjectURL(file) : null;
    setPreviewUrl(currentUrl.current);
  };

  useEffect(
    () => () => {
      if (currentUrl.current) {
        URL.revokeObjectURL(currentUrl.current);
      }
    },
    [],
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-16 rounded-lg bg-surface p-16 ring-1 ring-line ring-inset">
        <span className="flex size-48 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-line-strong bg-paper text-muted">
          {previewUrl ? (
            <img
              alt=""
              className="size-full object-cover"
              height={48}
              src={previewUrl}
              width={48}
            />
          ) : (
            <Icon name="camera" size={20} />
          )}
        </span>
        <span className="flex min-w-0 flex-1 basis-48 flex-col gap-2">
          <span className="type-label-m text-ink">{t("register.photo.label")}</span>
          <span className="type-body-xs break-words text-muted">
            {photo ? photo.name : t("register.photo.helper")}
          </span>
        </span>
        <input
          accept=".jpg,.jpeg,.png,.webp"
          aria-label={t("register.photo.label")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            replacePreview(file);
            onChange(file);
          }}
          ref={input}
          tabIndex={-1}
          type="file"
        />
        <Button onClick={() => input.current?.click()} size="s">
          <Icon name="upload" size={16} />
          {t(photo ? "register.photo.change" : "register.photo.upload")}
        </Button>
      </div>
      {error && <p className="type-body-xs text-danger">{error}</p>}
    </div>
  );
}
