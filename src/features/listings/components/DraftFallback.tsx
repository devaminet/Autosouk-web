import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import { Alert } from "../../../components/Alert";
import { ButtonLink } from "../../../components/ButtonLink";
import { paths } from "../../../lib/paths";
import type { ListingDetail } from "../api";

type DraftFallbackProps = {
  id: number | null;
  isPending: boolean;
  error: Error | null;
  listing?: ListingDetail;
};

// What a draft step shows until it has a draft to work on.
export function DraftFallback({ id, isPending, error, listing }: DraftFallbackProps) {
  const { t } = useTranslation("listings");

  // A listing that left the draft stage is changed from the edit page instead.
  if (id === null || (listing && listing.status !== "draft")) {
    return <Navigate replace to={paths.myListings} />;
  }
  if (error) {
    return (
      <div className="flex flex-col items-start gap-16 px-20 md:px-0" role="alert">
        <Alert tone="danger">{error.message}</Alert>
        <ButtonLink to={paths.myListings}>{t("wizard.back")}</ButtonLink>
      </div>
    );
  }
  if (isPending) {
    return <output className="block px-20 type-body-m text-muted md:px-0">{t("common:loading")}</output>;
  }
  return null;
}
