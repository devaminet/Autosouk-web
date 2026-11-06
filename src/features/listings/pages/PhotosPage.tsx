import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import { PageTitle } from "../../../components/PageTitle";
import { draftStepPath, paths } from "../../../lib/paths";
import { DraftFallback } from "../components/DraftFallback";
import { ListingWizardShell } from "../components/ListingWizardShell";
import { PhotosStep } from "../components/PhotosStep";
import { SaveDraftLink } from "../components/SaveDraftLink";
import { useDraftFromRoute } from "../useDraftFromRoute";

export function PhotosPage() {
  const { t } = useTranslation("listings");
  const { id, query } = useDraftFromRoute();
  const listing = query.data;

  const content = () => {
    if (id === null || !listing || listing.status !== "draft") {
      return <DraftFallback error={query.error} id={id} isPending={query.isPending} listing={listing} />;
    }
    // The API keeps media on the car, so the car comes first.
    if (!listing.car) {
      return <Navigate replace to={draftStepPath(id, "car")} />;
    }
    return <PhotosStep car={listing.car} listingId={id} />;
  };

  return (
    <ListingWizardShell
      actions={<SaveDraftLink />}
      backTo={id === null ? paths.myListings : draftStepPath(id, "car")}
      draft={listing}
      step="photos"
    >
      <PageTitle>{t("photos.title")}</PageTitle>
      {content()}
    </ListingWizardShell>
  );
}
