import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { PageTitle } from "../../../components/PageTitle";
import { draftStepPath } from "../../../lib/paths";
import { ListingTextForm } from "../components/ListingTextForm";
import { ListingWizardShell } from "../components/ListingWizardShell";
import { useCreateListing } from "../hooks";

export function NewListingPage() {
  const { t } = useTranslation("listings");
  const navigate = useNavigate();
  const create = useCreateListing();

  return (
    <ListingWizardShell step="listing">
      <PageTitle>{t("wizard.title")}</PageTitle>
      <ListingTextForm
        error={create.error}
        isPending={create.isPending}
        onSubmit={(values) =>
          create.mutate(values, {
            // Replace, so going back can't create a second draft.
            onSuccess: ({ listing }) => {
              void navigate(draftStepPath(listing.id, "car"), { replace: true });
            },
          })
        }
      />
    </ListingWizardShell>
  );
}
