import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { maxMediaCount, minImageCount } from "../media";

type MediaChecksProps = {
  photos: number;
  hasCover: boolean;
  // Files counted towards the limit, uploading ones included.
  files: number;
};

// What the API requires before a draft can go to review.
export function MediaChecks({ photos, hasCover, files }: MediaChecksProps) {
  const { t } = useTranslation("listings");
  const missing = minImageCount - photos;
  const checks = [
    {
      key: "photos",
      done: missing <= 0,
      text:
        missing <= 0
          ? t("photos.checks.minPhotos", { count: minImageCount })
          : t("photos.checks.morePhotos", { count: missing, min: minImageCount }),
    },
    {
      key: "cover",
      done: hasCover,
      text: t(hasCover ? "photos.checks.cover" : "photos.checks.noCover"),
    },
    {
      key: "left",
      done: files < maxMediaCount,
      text: t("photos.checks.filesLeft", { count: maxMediaCount - files }),
    },
  ];

  return (
    <ul className="flex flex-wrap gap-x-16 gap-y-8">
      {checks.map(({ key, done, text }) => (
        <li
          className={`flex items-center gap-4 type-body-xs ${done ? "text-ink-2" : "text-danger"}`}
          key={key}
        >
          <Icon
            className={done ? "text-success" : "text-danger"}
            name={done ? "check-circle" : "alert-triangle"}
            size={14}
          />
          {text}
        </li>
      ))}
    </ul>
  );
}
