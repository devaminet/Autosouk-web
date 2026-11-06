import { useTranslation } from "react-i18next";
import { maxMediaCount } from "../media";
import { MediaChecks } from "./MediaChecks";

type MediaSummaryProps = {
  photos: number;
  videos: number;
  uploading: number;
  hasCover: boolean;
};

const segment = (index: number, photos: number, videos: number, uploading: number) => {
  if (index < photos) {
    return "bg-brand";
  }
  if (index < photos + videos) {
    return "bg-ink";
  }
  return index < photos + videos + uploading ? "bg-saffron" : "bg-line";
};

// Counts per kind, a bar with one segment per file allowed, and the checks.
export function MediaSummary({ photos, videos, uploading, hasCover }: MediaSummaryProps) {
  const { t } = useTranslation("listings");
  const files = photos + videos + uploading;
  const counts = [
    t("photos.photoCount", { count: photos }),
    videos > 0 && t("photos.videoCount", { count: videos }),
    uploading > 0 && t("photos.uploadingCount", { count: uploading }),
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
          <span className={segment(index, photos, videos, uploading)} key={index} />
        ))}
      </div>
      <MediaChecks files={files} hasCover={hasCover} photos={photos} />
    </div>
  );
}
