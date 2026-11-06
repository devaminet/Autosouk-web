import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { MediaFileInput } from "./MediaFileInput";

type MediaDropzoneProps = {
  onFiles: (files: File[]) => void;
  disabled: boolean;
};

// Wide screens: drop files, or click to browse. The file input covers the
// whole zone, and browsers put files dropped on it into the input.
export function MediaDropzone({ onFiles, disabled }: MediaDropzoneProps) {
  const { t } = useTranslation("listings");
  const [isOver, setIsOver] = useState(false);

  return (
    <label
      className={`relative hidden flex-col items-center gap-12 rounded-xl border-2 border-dashed px-24 py-32 text-center has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand md:flex ${
        disabled
          ? "cursor-not-allowed border-line-strong bg-surface-2 opacity-45"
          : `cursor-pointer border-brand ${isOver ? "bg-brand-soft" : "bg-surface-2 hover:bg-brand-soft"}`
      }`}
    >
      <span className="flex size-control-l items-center justify-center rounded-full bg-brand text-on-brand">
        <Icon name="upload" size={24} />
      </span>
      <span className="type-h5 text-ink">
        {t("photos.drop")} <span className="text-brand underline">{t("photos.browse")}</span>
      </span>
      <span className="type-body-s text-muted">{t("photos.formats")}</span>
      <MediaFileInput
        className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        disabled={disabled}
        onDragActive={setIsOver}
        onFiles={onFiles}
      />
    </label>
  );
}
