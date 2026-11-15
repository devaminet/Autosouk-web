import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components/Button";
import type { Challenge } from "../api";
import { challengeMs } from "../recording";
import { CameraFrame } from "./CameraFrame";
import { ChallengeSteps } from "./ChallengeSteps";

type FaceCameraProps = {
  mimeType: string;
  challenges: Challenge[];
  // Gets the video once the last challenge is over.
  onRecorded: (video: Blob) => void;
  // When the camera is blocked, or the browser won't record.
  onFailed: (reason: "blocked" | "recorder") => void;
  onCancel: () => void;
};

// Records the camera while it shows each challenge in turn, then hands over
// the video.
export function FaceCamera({ mimeType, challenges, onRecorded, onFailed, onCancel }: FaceCameraProps) {
  const { t } = useTranslation(["identity", "enums"]);
  const preview = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // The camera is on while this screen shows, and off as soon as it goes.
  useEffect(() => {
    let opened: MediaStream | null = null;
    let closed = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(
      (camera) => {
        if (closed) {
          camera.getTracks().forEach((track) => track.stop());
          return;
        }
        opened = camera;
        setStream(camera);
      },
      () => {
        if (!closed) {
          onFailed("blocked");
        }
      },
    );
    return () => {
      closed = true;
      opened?.getTracks().forEach((track) => track.stop());
    };
  }, [onFailed]);
  const challenge = challenges[Math.min(current, challenges.length - 1)];

  useEffect(() => {
    if (preview.current) {
      preview.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!stream) {
      return;
    }
    let recorder: MediaRecorder | null = null;
    let finished = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Starting a tick later means a run React undoes at once, as StrictMode
    // does, never starts a recorder. Browsers refuse a second one quickly.
    const boot = setTimeout(() => {
      const chunks: Blob[] = [];
      try {
        recorder = new MediaRecorder(stream, { mimeType });
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        });
        recorder.addEventListener("stop", () => {
          if (finished) {
            onRecorded(new Blob(chunks, { type: mimeType }));
          }
        });
        recorder.start();
      } catch {
        onFailed("recorder");
        return;
      }
      challenges.slice(1).forEach((_, index) => {
        timers.push(setTimeout(() => setCurrent(index + 1), (index + 1) * challengeMs));
      });
      timers.push(
        setTimeout(() => {
          finished = true;
          recorder?.stop();
        }, challenges.length * challengeMs),
      );
    }, 0);
    return () => {
      clearTimeout(boot);
      timers.forEach(clearTimeout);
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };
  }, [stream, mimeType, challenges, onRecorded, onFailed]);

  return (
    <div className="grid w-full max-w-face-check grid-cols-1 gap-24 md:grid-cols-5 md:rounded-2xl md:bg-surface md:p-32 md:shadow-elevation-2">
      <div className="md:col-span-3">
        <CameraFrame
          overlay={
            <>
              <p className="absolute inset-s-16 top-16 flex items-center gap-8 rounded-full bg-night-2 px-12 py-4 type-label-s text-on-brand">
                <span aria-hidden="true" className="size-8 rounded-full bg-danger" />
                {t("face.recording")}
              </p>
              <p
                aria-live="assertive"
                className="absolute inset-s-16 inset-e-16 bottom-16 mx-auto w-fit rounded-full bg-surface px-16 py-8 text-center type-label-m text-ink"
              >
                {challenge && t(`enums:identity_challenge.${challenge}`)}
              </p>
            </>
          }
        >
          {/* The picture is mirrored, like a mirror, so moves feel natural. */}
          <video autoPlay className="size-full -scale-x-100 object-cover" muted playsInline ref={preview} />
        </CameraFrame>
      </div>
      <div className="flex flex-col gap-20 md:col-span-2">
        <div className="flex flex-col gap-8">
          <h1 className="type-h2 text-ink">{t("face.cameraTitle")}</h1>
          <p className="type-body-m text-muted">{t("face.cameraDescription")}</p>
          <p className="type-label-s text-muted">
            {t("face.challengeCount", { current: Math.min(current + 1, challenges.length), total: challenges.length })}
          </p>
        </div>
        <ChallengeSteps challenges={challenges} current={current} />
        <Button block className="mt-auto" onClick={onCancel} size="l">
          {t("face.cancel")}
        </Button>
      </div>
    </div>
  );
}
