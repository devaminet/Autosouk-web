import { useTranslation } from "react-i18next";
import { Navigate } from "react-router";
import { Alert } from "../../../components/Alert";
import { PageTitle } from "../../../components/PageTitle";
import { draftStepPath, paths } from "../../../lib/paths";
import { DraftFallback } from "../components/DraftFallback";
import { ListingSubmitted } from "../components/ListingSubmitted";
import { ListingWizardShell } from "../components/ListingWizardShell";
import { ReviewStep } from "../components/ReviewStep";
import { SaveDraftLink } from "../components/SaveDraftLink";
import { useLookups, useSubmitListing } from "../hooks";
import { useDraftFromRoute } from "../useDraftFromRoute";

export function ReviewPage() {
  const { t } = useTranslation("listings");
  const { id, query } = useDraftFromRoute();
  const lookups = useLookups();
  const submission = useSubmitListing();
  const listing = query.data;

  // Checked first: once submitted, the listing is no longer a draft.
  if (submission.isSuccess && listing?.car) {
    return (
      <>
        <PageTitle>{t("submitted.title")}</PageTitle>
        <ListingSubmitted car={listing.car} title={listing.title} />
      </>
    );
  }

  const content = () => {
    if (id === null || !listing || listing.status !== "draft") {
      return <DraftFallback error={query.error} id={id} isPending={query.isPending} listing={listing} />;
    }
    if (!listing.car) {
      return <Navigate replace to={draftStepPath(id, "car")} />;
    }
    if (lookups.error) {
      return (
        <div className="px-20 md:px-0" role="alert">
          <Alert tone="danger">{lookups.error.message}</Alert>
        </div>
      );
    }
    if (!lookups.data) {
      return <output className="block px-20 type-body-m text-muted md:px-0">{t("common:loading")}</output>;
    }
    return (
      <ReviewStep
        car={listing.car}
        error={submission.error}
        isPending={submission.isPending}
        listing={listing}
        lookups={lookups.data}
        onSubmit={() => submission.mutate(id)}
      />
    );
  };

  return (
    <ListingWizardShell
      actions={<SaveDraftLink />}
      backTo={id === null ? paths.myListings : draftStepPath(id, "photos")}
      draft={listing}
      step="review"
    >
      <PageTitle>{t("review.title")}</PageTitle>
      {content()}
    </ListingWizardShell>
  );
}
