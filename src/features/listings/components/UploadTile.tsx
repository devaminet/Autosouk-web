import { useTranslation } from "react-i18next";
import type { Upload } from "../useMediaUploads";

type UploadTileProps = {
  upload: Upload;
};

// A file on its way to storage, with its local preview.
export function UploadTile({ upload }: UploadTileProps) {
  const { t } = useTranslation("listings");
  const percent = Math.round(upload.progress * 100);

  return (
    <li className="relative aspect-4/3 overflow-hidden rounded-lg bg-night">
      {upload.kind === "image" ? (
        <img alt="" className="size-full object-cover opacity-45" src={upload.previewUrl} />
      ) : (
        <video className="size-full object-cover opacity-45" muted playsInline preload="metadata" src={upload.previewUrl} />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-24 text-on-brand">
        <p className="type-label-m">
          {t("photos.uploading")} <bdi dir="ltr">{percent}%</bdi>
        </p>
        <progress
          aria-label={t("photos.uploadingFile", { name: upload.name })}
          className="sr-only"
          max={100}
          value={percent}
        />
        <div aria-hidden="true" className="h-4 w-full overflow-hidden rounded-full bg-night-2">
          {/* The width is the progress, so it can't be a class. */}
          <div className="h-full rounded-full bg-surface" style={{ inlineSize: `${percent}%` }} />
        </div>
      </div>
    </li>
  );
}
