import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import type { ListingCar, ListingStatus } from "../api";
import { maxMediaCount, minImageCount } from "../media";
import { useMediaActions } from "../useMediaActions";
import { useStagedMedia } from "../useStagedMedia";
import { AddMediaTile } from "./AddMediaTile";
import { ListingCarPreview } from "./ListingCarPreview";
import { MediaFileInput } from "./MediaFileInput";
import { MediaProblems } from "./MediaProblems";
import { MediaRules } from "./MediaRules";
import { MediaSummary } from "./MediaSummary";
import { MediaTile } from "./MediaTile";
import { MediaViewer } from "./MediaViewer";
import { StagedMediaTile } from "./StagedMediaTile";
import { UploadTile } from "./UploadTile";

type ManageMediaProps = {
  listingId: number;
  status: ListingStatus;
  car: ListingCar;
};

// The photos and videos of a published listing. Deleting and choosing the
// cover apply at once. New files wait for one confirmation, which sends the
// listing back to review.
export function ManageMedia({ listingId, status, car }: ManageMediaProps) {
  const { t } = useTranslation("listings");
  const staged = useStagedMedia(listingId);
  const actions = useMediaActions(listingId);
  // The media item shown in the viewer, if any.
  const [viewing, setViewing] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  // Shown after the seller tries to delete a photo the listing can't lose.
  const [showLocked, setShowLocked] = useState(false);
  const notice = useRef<HTMLOutputElement>(null);
  const media = car.carMedias;
  const photos = media.filter(({ type }) => type === "image").length;
  const hasCover = media.some(({ isPrimary, type }) => isPrimary && type === "image");
  const counts = { uploading: 0, ready: 0, failed: 0 };
  for (const { state } of staged.files) {
    counts[state] += 1;
  }
  // The API refuses to go below the minimum outside a draft.
  const atMinimum = photos <= minImageCount;
  const filesLeft = maxMediaCount - media.length - counts.uploading - counts.ready;
  const isBusy = staged.isConfirming || staged.isDiscarding;
  const errors = [
    ...(staged.error instanceof Error ? [staged.error.message] : []),
    ...actions.errors,
  ];

  // Closing the tab would lose the new files, so the browser asks first.
  const hasNewFiles = staged.files.length > 0;
  useEffect(() => {
    if (!hasNewFiles) {
      return undefined;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasNewFiles]);

  // The confirm button goes away, so the focus moves to the outcome.
  useEffect(() => {
    if (confirmed) {
      notice.current?.focus();
    }
  }, [confirmed]);

  const addFiles = (files: File[]) => {
    setConfirmed(false);
    setShowLocked(false);
    staged.add(files, filesLeft);
  };

  const confirm = async () => {
    setConfirmed(await staged.confirm());
  };

  const footerCounts = [
    counts.ready > 0 && t("media.readyFiles", { count: counts.ready }),
    counts.uploading > 0 && t("photos.uploadingCount", { count: counts.uploading }),
    counts.failed > 0 && t("media.failedFiles", { count: counts.failed }),
  ].filter(Boolean);

  return (
    <>
      <div className="flex flex-col gap-24 md:grid md:grid-cols-3 md:items-start">
        <section
          aria-label={t("photos.title")}
          className="flex flex-col gap-24 rounded-xl border border-line bg-surface p-20 md:col-span-2 md:p-32"
        >
          <MediaSummary
            hasCover={hasCover}
            photos={photos}
            ready={counts.ready}
            uploading={counts.uploading}
            videos={media.length - photos}
          />
          <Alert tone="warning">
            {t(status === "approved" ? "media.warningApproved" : "media.warning")} {t("media.leaveNote")}
          </Alert>
          {confirmed && (
            <output className="block focus:outline-none" ref={notice} tabIndex={-1}>
              <Alert tone="success">{t("media.confirmed")}</Alert>
            </output>
          )}
          {showLocked && (
            <div role="alert">
              <Alert title={t("media.lockedTitle")} tone="danger">
                {t("media.lockedText", { count: minImageCount })}
              </Alert>
            </div>
          )}
          <MediaProblems errors={errors} problems={staged.problems} />
          <ul aria-label={t("photos.title")} className="grid grid-cols-2 gap-16 lg:grid-cols-3 xl:grid-cols-4">
            {media.map((item, index) => (
              <MediaTile
                busy={actions.busyIds.includes(item.id)}
                key={item.id}
                media={item}
                number={index + 1}
                onDelete={() => actions.remove(item.id)}
                onLockedDelete={atMinimum && item.type === "image" ? () => setShowLocked(true) : undefined}
                onMakeCover={() => actions.makeCover(item.id)}
                onOpen={() => setViewing(index)}
              />
            ))}
            {staged.files.map((file) =>
              file.state === "uploading" ? (
                <UploadTile key={file.key} upload={file} />
              ) : (
                <StagedMediaTile
                  disabled={isBusy}
                  file={file}
                  key={file.key}
                  onRemove={() => staged.remove(file.key)}
                  onRetry={() => staged.retry(file.key)}
                />
              ),
            )}
            <AddMediaTile filesLeft={filesLeft} onFiles={addFiles} />
          </ul>
        </section>
        <aside className="flex flex-col gap-16">
          <div className="hidden md:block">
            <ListingCarPreview car={car} />
          </div>
          <MediaRules />
        </aside>
      </div>
      <MediaViewer
        index={viewing}
        media={media}
        onClose={() => setViewing(null)}
        onIndexChange={setViewing}
        title={`${car.make.name} ${car.model.name}`}
      />
      {!hasNewFiles && atMinimum && filesLeft > 0 && (
        <div className="sticky bottom-0 -mx-20 -mb-24 border-t border-line bg-surface px-20 py-16 md:hidden">
          <label className="flex min-h-control-l cursor-pointer items-center justify-center gap-8 rounded-full bg-brand px-24 type-label-l text-on-brand shadow-elevation-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand">
            <Icon name="upload" size={18} />
            {t("media.replace")}
            <MediaFileInput onFiles={addFiles} />
          </label>
        </div>
      )}
      {hasNewFiles && (
        <div className="sticky bottom-0 -mx-20 -mb-24 flex flex-wrap items-center gap-12 border-t border-line bg-surface px-20 py-16 md:-mx-80 md:-mb-48 md:px-80">
          <p className="me-auto type-body-s text-ink-2">{footerCounts.join(" · ")}</p>
          <Button disabled={isBusy || counts.uploading > 0} isPending={staged.isDiscarding} onClick={staged.discard} variant="ghost">
            {t("media.discard")}
          </Button>
          <Button
            disabled={counts.ready === 0 || counts.uploading > 0 || staged.isDiscarding}
            isPending={staged.isConfirming}
            onClick={() => void confirm()}
            variant="primary"
          >
            {t("media.confirm")}
          </Button>
        </div>
      )}
    </>
  );
}
