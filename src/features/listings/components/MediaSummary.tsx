import { useTranslation } from "react-i18next";
import { maxMediaCount } from "../media";
import { MediaChecks } from "./MediaChecks";

type MediaSummaryProps = {
  photos: number;
  videos: number;
  uploading: number;
  // New files waiting for the seller to confirm them.
  ready?: number;
  hasCover: boolean;
  // The checks take room the edit drawer doesn't have.
  showChecks?: boolean;
};

const segment = (index: number, photos: number, videos: number, waiting: number) => {
  if (index < photos) {
    return "bg-brand";
  }
  if (index < photos + videos) {
    return "bg-ink";
  }
  return index < photos + videos + waiting ? "bg-saffron" : "bg-line";
};

// Counts per kind, a bar with one segment per file allowed, and the checks.
export function MediaSummary({
  photos,
  videos,
  uploading,
  ready = 0,
  hasCover,
  showChecks = true,
}: MediaSummaryProps) {
  const { t } = useTranslation("listings");
  const waiting = uploading + ready;
  const files = photos + videos + waiting;
  const counts = [
    t("photos.photoCount", { count: photos }),
    videos > 0 && t("photos.videoCount", { count: videos }),
    uploading > 0 && t("photos.uploadingCount", { count: uploading }),
    ready > 0 && t("photos.readyCount", { count: ready }),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between gap-12">
        <p className="type-body-m text-ink">{counts.join(" · ")}</p>
        <p className="shrink-0 type-mono-s text-muted">
          <bdi dir="ltr">
            {files} / {maxMediaCount}
          </bdi>{" "}
          {t("photos.files")}
        </p>
      </div>
      <div aria-hidden="true" className="grid h-4 grid-cols-20 overflow-hidden rounded-full">
        {Array.from({ length: maxMediaCount }, (_, index) => (
          <span className={segment(index, photos, videos, waiting)} key={index} />
        ))}
      </div>
      {showChecks && <MediaChecks files={files} hasCover={hasCover} photos={photos} />}
    </div>
  );
}
