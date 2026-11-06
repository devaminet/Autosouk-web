import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { PageTitle } from "../../../components/PageTitle";
import { draftStepPath } from "../../../lib/paths";
import { DraftFallback } from "../components/DraftFallback";
import { ListingTextForm } from "../components/ListingTextForm";
import { ListingWizardShell } from "../components/ListingWizardShell";
import { useUpdateListing } from "../hooks";
import { useDraftFromRoute } from "../useDraftFromRoute";

// The first step again, for a draft that already exists.
export function DraftListingPage() {
  const { t } = useTranslation("listings");
  const navigate = useNavigate();
  const { id, query } = useDraftFromRoute();
  const update = useUpdateListing();
  const listing = query.data;

  return (
    <ListingWizardShell draft={listing} step="listing">
      <PageTitle>{t("wizard.title")}</PageTitle>
      {id === null || !listing || listing.status !== "draft" ? (
        <DraftFallback error={query.error} id={id} isPending={query.isPending} listing={listing} />
      ) : (
        <ListingTextForm
          error={update.error}
          initial={listing}
          isPending={update.isPending}
          onSubmit={(changes) =>
            update.mutate(
              { id, changes },
              { onSuccess: () => void navigate(draftStepPath(id, "car")) },
            )
          }
        />
      )}
    </ListingWizardShell>
  );
}
