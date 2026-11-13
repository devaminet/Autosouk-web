import { useCallback, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { paths } from "../../../lib/paths";
import { AuthCard } from "../../auth/components/AuthCard";
import { AuthHeading } from "../../auth/components/AuthHeading";
import { AuthShell } from "../../auth/components/AuthShell";
import { IconCircle } from "../../auth/components/IconCircle";
import type { StartedCheck } from "../api";
import { FaceCamera } from "../components/FaceCamera";
import { FaceReview } from "../components/FaceReview";
import { StepAction } from "../components/StepAction";
import { useIdentityState, useSendIdentityVideo, useStartIdentityCheck } from "../hooks";
import { pickRecordingFormat } from "../recording";
import type { RecordingFormat } from "../recording";

type Stage = "intro" | "camera" | "review";

type Recording = { video: Blob; url: string };

const tips: { icon: IconName; key: "time" | "light" | "privacy" }[] = [
  { icon: "camera", key: "time" },
  { icon: "eye", key: "light" },
  { icon: "lock", key: "privacy" },
];

// A session can be reused for another recording while it has a minute left.
const isUsable = (check: StartedCheck | null): check is StartedCheck =>
  check !== null && Date.parse(check.verification.expiresAt) - Date.now() > 60_000;

// Step 3 of signing up: a short face video an admin checks by hand. Shows
// where the user is: still to record, waiting for review, or rejected.
export function IdentityCheckPage() {
  const { t } = useTranslation("identity");
  const consentId = useId();
  const state = useIdentityState();
  const start = useStartIdentityCheck();
  const send = useSendIdentityVideo();
  const [stage, setStage] = useState<Stage>("intro");
  const [agreed, setAgreed] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [check, setCheck] = useState<StartedCheck | null>(null);
  const [format, setFormat] = useState<RecordingFormat | null>(null);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => () => {
    if (recording) {
      URL.revokeObjectURL(recording.url);
    }
  }, [recording]);

  const onRecorded = useCallback((video: Blob) => {
    setRecording({ video, url: URL.createObjectURL(video) });
    setStage("review");
  }, []);

  const onFailed = useCallback(
    (reason: "blocked" | "recorder") => {
      setProblem(t(reason === "blocked" ? "face.cameraBlocked" : "face.noRecorder"));
      setStage("intro");
    },
    [t],
  );

  // Gets the challenges, then shows the camera, which records them.
  const begin = () => {
    setProblem(null);
    const picked = pickRecordingFormat();
    if (!picked || !navigator.mediaDevices?.getUserMedia) {
      setProblem(t("face.noRecorder"));
      return;
    }
    setFormat(picked);
    if (isUsable(check)) {
      setStage("camera");
      return;
    }
    start.mutate(picked.contentType, {
      onSuccess: (started) => {
        setCheck(started);
        setStage("camera");
      },
    });
  };

  const startCamera = () => {
    if (!agreed) {
      setShowConsentError(true);
      return;
    }
    begin();
  };

  const sendVideo = () => {
    if (!check || !recording) {
      return;
    }
    setProblem(null);
    setProgress(0);
    send.mutate(
      { check, video: recording.video, onProgress: setProgress },
      {
        onSuccess: (sent) => {
          setProgress(null);
          if (!sent) {
            setProblem(t("face.uploadFailed"));
          }
        },
        onError: (error) => {
          setProgress(null);
          setProblem(error.message);
        },
      },
    );
  };

  if (state.isPending) {
    return <output className="block p-24 type-body-m text-muted">{t("common:loading")}</output>;
  }
  if (state.error) {
    return (
      <AuthShell action={<StepAction step={t("steps.faceShort")} />}>
        <div className="w-full max-w-auth" role="alert">
          <Alert tone="danger">{state.error.message}</Alert>
        </div>
      </AuthShell>
    );
  }

  const identity = state.data;
  if (!identity.phoneVerified) {
    return <Navigate replace to={paths.verifyPhone} />;
  }
  if (identity.identityStatus === "approved") {
    return <Navigate replace to={paths.home} />;
  }

  if (identity.identityStatus === "pending") {
    return (
      <AuthShell action={<StepAction step={t("steps.review")} />}>
        <PageTitle>{t("face.pageTitle")}</PageTitle>
        <AuthCard centered>
          <IconCircle name="clock" tone="brand" />
          <AuthHeading description={t("face.pendingDescription")} title={t("face.pendingTitle")} />
          <div className="w-full text-start">
            <Alert title={t("face.whileYouWait")} tone="info">
              {t("face.whileYouWaitDescription")}
            </Alert>
          </div>
          <ButtonLink block size="l" to={paths.home} variant="dark">
            <Icon name="search" size={18} />
            {t("face.browse")}
          </ButtonLink>
        </AuthCard>
      </AuthShell>
    );
  }

  if (identity.identityStatus === "rejected" && !retrying) {
    return (
      <AuthShell action={<StepAction step={t("steps.faceShort")} />}>
        <PageTitle>{t("face.pageTitle")}</PageTitle>
        <AuthCard centered>
          <IconCircle name="alert-octagon" tone="danger" />
          <AuthHeading description={t("face.rejectedDescription")} title={t("face.rejectedTitle")} />
          {identity.rejectionReason && (
            <div className="w-full text-start">
              <Alert title={t("face.reasonTitle")} tone="danger">
                <span dir="auto">{identity.rejectionReason}</span>
              </Alert>
            </div>
          )}
          {identity.attemptsLeft > 0 ? (
            <>
              <p className="type-label-s text-muted">{t("face.attemptsLeft", { count: identity.attemptsLeft })}</p>
              <Button block onClick={() => setRetrying(true)} size="l" variant="primary">
                <Icon name="camera" size={18} />
                {t("face.recordAgain")}
              </Button>
            </>
          ) : (
            <Alert tone="warning">{t("face.noAttempts")}</Alert>
          )}
        </AuthCard>
      </AuthShell>
    );
  }

  if (stage === "camera" && check && format) {
    return (
      <AuthShell action={<StepAction step={t("steps.face")} />}>
        <PageTitle>{t("face.pageTitle")}</PageTitle>
        <FaceCamera
          challenges={check.verification.challenges}
          mimeType={format.mimeType}
          onCancel={() => setStage("intro")}
          onFailed={onFailed}
          onRecorded={onRecorded}
        />
      </AuthShell>
    );
  }

  if (stage === "review" && check && recording) {
    return (
      <AuthShell action={<StepAction step={t("steps.face")} />}>
        <PageTitle>{t("face.pageTitle")}</PageTitle>
        <FaceReview
          challenges={check.verification.challenges}
          onRecordAgain={begin}
          onSend={sendVideo}
          problem={problem}
          progress={progress}
          videoUrl={recording.url}
        />
      </AuthShell>
    );
  }

  const failure = problem ?? start.error?.message ?? null;

  return (
    <AuthShell action={<StepAction step={t("steps.face")} />}>
      <PageTitle>{t("face.pageTitle")}</PageTitle>
      <AuthCard centered>
        <IconCircle name="scan-face" tone="brand" />
        <AuthHeading description={t("face.introDescription")} title={t("face.introTitle")} />
        <ul className="flex w-full flex-col gap-12 text-start">
          {tips.map(({ icon, key }) => (
            <li className="flex items-center gap-12" key={key}>
              <span className="flex size-40 shrink-0 items-center justify-center rounded-full bg-paper text-ink-2">
                <Icon name={icon} size={18} />
              </span>
              <span className="type-body-s text-ink-2">{t(`face.tips.${key}`)}</span>
            </li>
          ))}
        </ul>
        <div className="flex w-full flex-col gap-4 text-start">
          <label className="flex cursor-pointer items-start gap-12 type-body-s text-ink-2" htmlFor={consentId}>
            <input
              aria-describedby={showConsentError && !agreed ? `${consentId}-error` : undefined}
              aria-invalid={showConsentError && !agreed}
              checked={agreed}
              className="mt-2 size-20 shrink-0 cursor-pointer accent-brand"
              id={consentId}
              onChange={(event) => setAgreed(event.target.checked)}
              type="checkbox"
            />
            {t("face.consent")}
          </label>
          {showConsentError && !agreed && (
            <p className="type-body-xs text-danger" id={`${consentId}-error`}>
              {t("face.consentRequired")}
            </p>
          )}
        </div>
        {retrying && (
          <p className="type-label-s text-muted">{t("face.attemptsLeft", { count: identity.attemptsLeft })}</p>
        )}
        <div className="w-full text-start empty:hidden" role="alert">
          {failure && <Alert tone="danger">{failure}</Alert>}
        </div>
        <Button block isPending={start.isPending} onClick={startCamera} size="l" variant="primary">
          <Icon name="camera" size={18} />
          {t("face.start")}
        </Button>
      </AuthCard>
    </AuthShell>
  );
}
