import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { Challenge } from "../api";

type ChallengeStepsProps = {
  challenges: Challenge[];
  // The one being done now. Steps before it are done; past the end, all are.
  current: number;
};

export function ChallengeSteps({ challenges, current }: ChallengeStepsProps) {
  const { t } = useTranslation(["identity", "enums"]);

  return (
    <ol aria-label={t("face.stepsLabel")} className="flex flex-col gap-12">
      {challenges.map((challenge, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo";
        return (
          <li
            aria-current={state === "current" ? "step" : undefined}
            className="flex items-center gap-12"
            key={challenge}
          >
            <span
              className={`flex size-32 shrink-0 items-center justify-center rounded-full type-label-s ${state === "done" ? "bg-success-soft text-success" : state === "current" ? "bg-brand text-on-brand" : "bg-surface text-muted ring-1 ring-line ring-inset"}`}
            >
              {state === "done" ? <Icon name="check" size={16} /> : <bdi dir="ltr">{index + 1}</bdi>}
            </span>
            <span className={`type-body-s ${state === "todo" ? "text-muted" : "text-ink"}`}>
              {t(`enums:identity_challenge.${challenge}`)}
              {state !== "todo" && (
                <span className="sr-only"> ({t(state === "done" ? "face.stepDone" : "face.stepCurrent")})</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
