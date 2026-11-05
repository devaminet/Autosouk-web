import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Alert } from "../../../components/Alert";
import { PageTitle } from "../../../components/PageTitle";
import { draftStepPath, paths } from "../../../lib/paths";
import { carFormFrom, emptyCarForm, toCarInput } from "../carForm";
import type { CarFormValues } from "../carForm";
import { CarDetailsForm } from "../components/CarDetailsForm";
import { DraftFallback } from "../components/DraftFallback";
import { ListingWizardShell } from "../components/ListingWizardShell";
import { useAttachCar, useEquipment, useLookups, useMakes, useUpdateListing } from "../hooks";
import { useDraftFromRoute } from "../useDraftFromRoute";

export function CarDetailsPage() {
  const { t } = useTranslation("listings");
  const navigate = useNavigate();
  const { id, query } = useDraftFromRoute();
  const lookups = useLookups();
  const makes = useMakes();
  const equipment = useEquipment();
  const attach = useAttachCar();
  const update = useUpdateListing();
  const listing = query.data;
  const backTo = id === null ? paths.myListings : draftStepPath(id, "listing");
  const options = [lookups, makes, equipment];
  const optionsError = options.find((option) => option.error)?.error;

  const content = () => {
    if (id === null || !listing || listing.status !== "draft") {
      return <DraftFallback error={query.error} id={id} isPending={query.isPending} listing={listing} />;
    }
    if (optionsError) {
      return (
        <div className="px-20 md:px-0" role="alert">
          <Alert tone="danger">{optionsError.message}</Alert>
        </div>
      );
    }
    if (!lookups.data || !makes.data || !equipment.data) {
      return <output className="block px-20 type-body-m text-muted md:px-0">{t("common:loading")}</output>;
    }

    // A draft gets its car once. After that, its car is changed like the rest of it.
    const save = (values: CarFormValues) => {
      const car = toCarInput(values);
      const done = {
        onSuccess: () => {
          void navigate(paths.myListings, { state: { notice: t("newListing.saved") } });
        },
      };
      if (listing.car) {
        update.mutate({ id, changes: { car } }, done);
      } else {
        attach.mutate({ id, car }, done);
      }
    };

    return (
      <CarDetailsForm
        backTo={backTo}
        equipment={equipment.data}
        error={listing.car ? update.error : attach.error}
        initial={listing.car ? carFormFrom(listing.car) : emptyCarForm}
        isPending={attach.isPending || update.isPending}
        key={listing.id}
        lookups={lookups.data}
        makes={makes.data}
        onSubmit={save}
        title={listing.title}
      />
    );
  };

  return (
    <ListingWizardShell backTo={backTo} draft={listing} step="car">
      <PageTitle>{t("carDetails.title")}</PageTitle>
      {content()}
    </ListingWizardShell>
  );
}
