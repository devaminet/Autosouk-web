import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { PageTitle } from "../../../components/PageTitle";
import { useSession } from "../../auth/hooks";
import type { Mechanic } from "../api";
import { AcceptingRequestsCard } from "../components/AcceptingRequestsCard";
import { GaragePhotos } from "../components/GaragePhotos";
import { WorkshopForm } from "../components/WorkshopForm";
import { useOwnMechanic, useSaveWorkshop } from "../hooks";

type WorkshopEditorProps = {
  // Null until the mechanic sets the workshop up.
  mechanic: Mechanic | null;
  userCityId: number | null;
};

function WorkshopEditor({ mechanic, userCityId }: WorkshopEditorProps) {
  const { t } = useTranslation("mechanics");
  const formId = useId();
  const isNew = mechanic === null;
  const save = useSaveWorkshop(isNew);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="type-overline text-brand">{t("workshop.overline")}</p>
          <h1 className="type-h1 text-ink md:type-display-m">
            {t(isNew ? "workshop.setupTitle" : "workshop.title")}
          </h1>
          {isNew && <p className="type-body-m text-muted">{t("workshop.setupDescription")}</p>}
        </div>
        <div className="flex flex-col items-end gap-8">
          <Button form={formId} isPending={save.isPending} size="l" type="submit" variant="primary">
            {t(isNew ? "workshop.create" : "workshop.save")}
          </Button>
          <output className="type-body-s text-success empty:hidden">
            {save.isSuccess && t("workshop.saved")}
          </output>
        </div>
      </header>
      {mechanic && <AcceptingRequestsCard mechanic={mechanic} />}
      <WorkshopForm
        error={save.error}
        id={formId}
        isPending={save.isPending}
        isSaved={save.isSuccess}
        mechanic={mechanic}
        onSave={(details, logo, done) => save.mutate({ details, logo }, { onSuccess: done })}
        submitLabel={t(isNew ? "workshop.create" : "workshop.save")}
        userCityId={userCityId}
      />
      <GaragePhotos mechanic={mechanic} />
    </>
  );
}

// The mechanic's workshop as buyers see it in search, rankings and listings.
// The first visit sets it up.
export function WorkshopProfilePage() {
  const { t } = useTranslation("mechanics");
  const { user } = useSession();
  const mechanic = useOwnMechanic();

  const content = () => {
    if (mechanic.isError) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{mechanic.error.message}</Alert>
          <Button onClick={() => void mechanic.refetch()}>{t("workshop.retry")}</Button>
        </div>
      );
    }
    if (mechanic.isPending) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }
    // Creating the workshop gives it an id, which starts a fresh form.
    return (
      <WorkshopEditor key={mechanic.data?.id ?? "new"} mechanic={mechanic.data} userCityId={user?.cityId ?? null} />
    );
  };

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:px-80 md:py-48">
      <PageTitle>{t("workshop.pageTitle")}</PageTitle>
      {content()}
    </div>
  );
}
