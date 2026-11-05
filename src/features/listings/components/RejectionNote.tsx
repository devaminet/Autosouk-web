import { useTranslation } from "react-i18next";

type RejectionNoteProps = {
  reason: string;
};

export function RejectionNote({ reason }: RejectionNoteProps) {
  const { t } = useTranslation("listings");

  return (
    <p className="rounded-md bg-danger-soft px-12 py-8 type-body-xs text-ink-2">
      <span className="type-label-s text-danger">{t("myListings.rejectedBecause")}</span>{" "}
      <span dir="auto">{reason}</span>
    </p>
  );
}
