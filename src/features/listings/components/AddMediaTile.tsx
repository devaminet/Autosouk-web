import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { MediaFileInput } from "./MediaFileInput";

type AddMediaTileProps = {
  onFiles: (files: File[]) => void;
  filesLeft: number;
};

export function AddMediaTile({ onFiles, filesLeft }: AddMediaTileProps) {
  const { t } = useTranslation("listings");
  const disabled = filesLeft <= 0;

  return (
    <li>
      <label
        className={`flex aspect-4/3 flex-col items-center justify-center gap-8 rounded-lg border-2 border-dashed border-line-strong bg-surface-2 p-12 text-center has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand ${
          disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:border-brand"
        }`}
      >
        <span className="flex size-40 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Icon name="plus" size={20} />
        </span>
        <span className="type-label-m text-ink">{t("photos.add")}</span>
        <span className="type-body-xs text-muted">{t("photos.checks.filesLeft", { count: filesLeft })}</span>
        <MediaFileInput disabled={disabled} onFiles={onFiles} />
      </label>
    </li>
  );
}
