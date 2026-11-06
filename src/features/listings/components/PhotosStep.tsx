import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { draftStepPath } from "../../../lib/paths";
import type { ListingCar } from "../api";
import { maxMediaCount, minImageCount } from "../media";
import { useMediaActions } from "../useMediaActions";
import { useMediaUploads } from "../useMediaUploads";
import { AddMediaTile } from "./AddMediaTile";
import { ListingCarPreview } from "./ListingCarPreview";
import { MediaDropzone } from "./MediaDropzone";
import { MediaFileInput } from "./MediaFileInput";
import { MediaProblems } from "./MediaProblems";
import { MediaSummary } from "./MediaSummary";
import { MediaTile } from "./MediaTile";
import { UploadTile } from "./UploadTile";
import { WizardCard } from "./WizardCard";
import { WizardStepLayout } from "./WizardStepLayout";
import { WizardTips } from "./WizardTips";

type PhotosStepProps = {
  listingId: number;
  car: ListingCar;
};

export function PhotosStep({ listingId, car }: PhotosStepProps) {
  const { t } = useTranslation("listings");
  const { uploads, problems, error, upload } = useMediaUploads(listingId);
  const actions = useMediaActions(listingId);
  const media = car.carMedias;
  const photos = media.filter(({ type }) => type === "image").length;
  const hasCover = media.some(({ isPrimary, type }) => isPrimary && type === "image");
  const filesLeft = maxMediaCount - media.length - uploads.length;
  const missing = minImageCount - photos;
  const isReady = missing <= 0 && hasCover && uploads.length === 0;
  const addFiles = (files: File[]) => void upload(files, filesLeft);
  const errors = [...(error instanceof Error ? [error.message] : []), ...actions.errors];
  const reviewLabel = missing > 0 ? t("photos.addMore", { count: missing }) : t("photos.review");

  return (
    <WizardStepLayout
      aside={
        <>
          <ListingCarPreview car={car} />
          <Alert tone="info">{t("photos.storageNote")}</Alert>
          <WizardTips tips={[t("photos.tips.angles"), t("photos.tips.interior"), t("photos.tips.engine")]} />
        </>
      }
      back={
        <ButtonLink size="l" to={draftStepPath(listingId, "car")}>
          <Icon name="arrow-left" size={18} />
          {t("carDetails.back")}
        </ButtonLink>
      }
      submit={
        <>
          <label className="flex min-h-control-l shrink-0 cursor-pointer items-center gap-8 rounded-full bg-surface px-24 type-label-l text-ink ring-1 ring-line-strong ring-inset has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand md:hidden">
            <Icon name="camera" size={18} />
            {t("photos.camera")}
            <MediaFileInput camera disabled={filesLeft <= 0} onFiles={addFiles} />
          </label>
          {isReady ? (
            <ButtonLink block className="md:w-auto" size="l" to={draftStepPath(listingId, "review")} variant="primary">
              {reviewLabel}
              <Icon name="arrow-right" size={18} />
            </ButtonLink>
          ) : (
            <Button block className="md:w-auto" disabled size="l" variant="primary">
              {reviewLabel}
            </Button>
          )}
        </>
      }
    >
      <WizardCard description={t("photos.description")} headingLevel={1} title={t("photos.title")}>
        <MediaSummary
          hasCover={hasCover}
          photos={photos}
          uploading={uploads.length}
          videos={media.length - photos}
        />
        <MediaProblems errors={errors} problems={problems} />
        <MediaDropzone disabled={filesLeft <= 0} onFiles={addFiles} />
        <ul aria-label={t("photos.title")} className="grid grid-cols-2 gap-16 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item, index) => (
            <MediaTile
              busy={actions.busyIds.includes(item.id)}
              key={item.id}
              media={item}
              number={index + 1}
              onDelete={() => actions.remove(item.id)}
              onMakeCover={() => actions.makeCover(item.id)}
            />
          ))}
          {uploads.map((item) => (
            <UploadTile key={item.key} upload={item} />
          ))}
          <AddMediaTile filesLeft={filesLeft} onFiles={addFiles} />
        </ul>
      </WizardCard>
    </WizardStepLayout>
  );
}
