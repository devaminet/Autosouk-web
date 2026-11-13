import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import type { Challenge } from "../api";
import { CameraFrame } from "./CameraFrame";
import { ChallengeSteps } from "./ChallengeSteps";

type FaceReviewProps = {
  videoUrl: string;
  challenges: Challenge[];
  // Null while the user looks the video over; a fraction while it uploads.
  progress: number | null;
  problem: string | null;
  onSend: () => void;
  onRecordAgain: () => void;
};

// The recorded video, to watch before sending it, then the upload's progress.
export function FaceReview({ videoUrl, challenges, progress, problem, onSend, onRecordAgain }: FaceReviewProps) {
  const { t } = useTranslation("identity");
  const uploading = progress !== null;
  const percent = Math.round((progress ?? 0) * 100);

  return (
    <div className="grid w-full max-w-face-check grid-cols-1 gap-24 md:grid-cols-5 md:rounded-2xl md:bg-surface md:p-32 md:shadow-elevation-2">
      <div className="md:col-span-3">
        <CameraFrame dimmed={uploading}>
          {/* The user's own recording: there are no words to caption. */}
          {/* oxlint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            aria-label={t("face.videoLabel")}
            className="size-full object-cover"
            controls={!uploading}
            playsInline
            src={videoUrl}
          />
        </CameraFrame>
      </div>
      <div className="flex flex-col gap-20 md:col-span-2">
        <div className="flex flex-col gap-8">
          <h1 className="type-h2 text-ink">{t(uploading ? "face.uploadingTitle" : "face.reviewTitle")}</h1>
          <p className="type-body-m text-muted">
            {t(uploading ? "face.uploadingDescription" : "face.reviewDescription")}
          </p>
        </div>
        {uploading && (
          <div className="flex flex-col gap-8">
            <p className="type-label-m text-ink">
              <bdi dir="ltr">{percent}%</bdi>
            </p>
            <progress aria-label={t("face.uploadProgress")} className="sr-only" max={100} value={percent} />
            <div aria-hidden="true" className="h-8 overflow-hidden rounded-full bg-line">
              {/* The width is the progress, so it can't be a class. */}
              <div className="h-full rounded-full bg-brand" style={{ inlineSize: `${percent}%` }} />
            </div>
          </div>
        )}
        <ChallengeSteps challenges={challenges} current={challenges.length} />
        <div className="empty:hidden" role="alert">
          {problem && <Alert tone="danger">{problem}</Alert>}
        </div>
        {!uploading && (
          <div className="mt-auto flex flex-col gap-8">
            <Button block onClick={onSend} size="l" variant="primary">
              <Icon name="upload" size={18} />
              {t("face.send")}
            </Button>
            <Button block onClick={onRecordAgain} size="l">
              <Icon name="refresh" size={18} />
              {t("face.recordAgain")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
