import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { StagedFile } from "../useStagedMedia";

type StagedMediaTileProps = {
  file: Extract<StagedFile, { state: "ready" | "failed" }>;
  disabled: boolean;
  onRetry: () => void;
  onRemove: () => void;
};

// A new file, uploaded and waiting for confirmation, or failed to upload.
export function StagedMediaTile({ file, disabled, onRetry, onRemove }: StagedMediaTileProps) {
  const { t } = useTranslation("listings");
  const failed = file.state === "failed";
  const name = t("media.newFile", { name: file.name });

  return (
    <li
      className={`relative aspect-4/3 overflow-hidden rounded-lg bg-night ${
        failed ? "ring-2 ring-danger ring-offset-2 ring-offset-surface" : ""
      }`}
    >
      {file.kind === "image" ? (
        <img alt={name} className={`size-full object-cover ${failed ? "opacity-45" : ""}`} src={file.previewUrl} />
      ) : (
        <video
          aria-label={name}
          className={`size-full object-cover ${failed ? "opacity-45" : ""}`}
          muted
          playsInline
          preload="metadata"
          src={file.previewUrl}
        />
      )}
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-12 text-center text-on-brand">
          <Icon name="alert-triangle" size={20} />
          <p className="type-label-m">{t("media.failed")}</p>
          <button
            aria-label={t("media.retryFile", { name: file.name })}
            className="flex min-h-control-s cursor-pointer items-center gap-4 rounded-full bg-surface px-12 type-label-m text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface disabled:cursor-not-allowed disabled:opacity-45"
            disabled={disabled}
            onClick={onRetry}
            type="button"
          >
            <Icon name="refresh" size={14} />
            {t("media.retry")}
          </button>
        </div>
      ) : (
        <span className="absolute top-8 inset-s-8 flex items-center gap-4 rounded-full bg-warning-soft px-8 py-2 type-label-s text-warning">
          <span aria-hidden="true" className="size-4 rounded-full bg-current" />
          {t("media.readyBadge")}
        </span>
      )}
      <button
        aria-label={t("media.remove", { name: file.name })}
        className="absolute top-8 inset-e-8 flex size-32 cursor-pointer items-center justify-center rounded-full bg-surface text-danger shadow-elevation-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-45"
        disabled={disabled}
        onClick={onRemove}
        type="button"
      >
        <Icon name={failed ? "x" : "trash"} size={16} />
      </button>
    </li>
  );
}
