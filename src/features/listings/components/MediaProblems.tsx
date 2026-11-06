import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import type { MediaProblem } from "../useMediaUploads";

type MediaProblemsProps = {
  problems: MediaProblem[];
  // API errors, such as a failed delete.
  errors: string[];
};

// Screen readers announce an alert when it appears.
export function MediaProblems({ problems, errors }: MediaProblemsProps) {
  const { t } = useTranslation("listings");

  if (problems.length === 0 && errors.length === 0) {
    return null;
  }
  return (
    <div role="alert">
      <Alert title={problems.length > 0 ? t("photos.problems.title") : undefined} tone="danger">
        <ul className="flex flex-col gap-2">
          {problems.map(({ name, reason }, index) => (
            // The same file can be refused twice, so the index keeps keys unique.
            <li key={`${name}-${reason}-${index}`}>{t(`photos.problems.${reason}`, { name })}</li>
          ))}
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </Alert>
    </div>
  );
}
