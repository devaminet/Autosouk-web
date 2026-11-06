import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router";
import { Alert } from "../../../components/Alert";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { paths } from "../../../lib/paths";
import { ListingBreadcrumb } from "../components/ListingBreadcrumb";
import { ManageMedia } from "../components/ManageMedia";
import { StatusBadge } from "../components/StatusBadge";
import { useDraftFromRoute } from "../useDraftFromRoute";
import { resumeDraftPath } from "../wizardSteps";

export function ListingMediaPage() {
  const { t } = useTranslation("listings");
  const { id, query } = useDraftFromRoute();
  const listing = query.data;

  if (id === null) {
    return <Navigate replace to={paths.myListings} />;
  }
  if (listing?.status === "draft") {
    // A draft's media is part of the wizard.
    return <Navigate replace to={resumeDraftPath(listing)} />;
  }
  if (listing && (listing.status === "sold" || !listing.car)) {
    // A sold car stays as it was sold.
    return <Navigate replace to={paths.myListings} />;
  }

  const content = () => {
    if (query.error) {
      return (
        <div className="flex flex-col items-start gap-16" role="alert">
          <Alert tone="danger">{query.error.message}</Alert>
          <ButtonLink to={paths.myListings}>{t("wizard.back")}</ButtonLink>
        </div>
      );
    }
    if (!listing?.car) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }
    return <ManageMedia car={listing.car} key={listing.id} listingId={listing.id} status={listing.status} />;
  };

  return (
    <div className="flex flex-1 flex-col gap-24 px-20 pt-16 pb-24 md:gap-32 md:px-80 md:py-48">
      <PageTitle>{t("photos.title")}</PageTitle>
      <Link
        aria-label={t("wizard.back")}
        className="flex size-40 items-center justify-center rounded-full border border-line bg-surface text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:hidden"
        to={paths.myListings}
      >
        <Icon name="arrow-left" size={18} />
      </Link>
      <div className="hidden md:block">
        <ListingBreadcrumb current={listing?.title ?? t("photos.title")} />
      </div>
      <header className="flex flex-wrap items-end justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="type-overline text-brand">{t("media.overline")}</p>
          <h1 className="type-h1 text-ink md:type-display-m">{t("photos.title")}</h1>
        </div>
        {listing && <StatusBadge status={listing.status} />}
      </header>
      {content()}
    </div>
  );
}
