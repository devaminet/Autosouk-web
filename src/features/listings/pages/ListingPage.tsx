import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { formatNumber } from "../../../lib/format";
import { paths } from "../../../lib/paths";
import { ListingEquipment } from "../components/ListingEquipment";
import { ListingGallery } from "../components/ListingGallery";
import { ListingSpecs } from "../components/ListingSpecs";
import { MediaViewer } from "../components/MediaViewer";
import { SellerCard } from "../components/SellerCard";
import { StatusBadge } from "../components/StatusBadge";
import { useSession } from "../../auth/hooks";
import { useListing, useLookups } from "../hooks";
import { listingIdFrom } from "../useDraftFromRoute";

const backClass =
  "flex w-fit cursor-pointer items-center gap-8 rounded-xs type-label-m text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// A listing as buyers see it. Its seller also sees it before approval.
export function ListingPage() {
  const { t } = useTranslation(["listings", "enums"]);
  const id = listingIdFrom(useParams());
  // A listing in review is found only with its seller's token, which is
  // restored after a page load. Asking before then would answer not found.
  const session = useSession();
  const query = useListing(id, !session.isPending);
  const lookups = useLookups();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewing, setViewing] = useState<number | null>(null);
  const listing = query.data;
  const car = listing?.car;

  // Back to wherever the buyer came from, or to the home page from a shared link.
  const back =
    location.key === "default" ? (
      <Link className={backClass} to={paths.home}>
        <Icon name="arrow-left" size={16} />
        {t("listing.back")}
      </Link>
    ) : (
      <button className={backClass} onClick={() => void navigate(-1)} type="button">
        <Icon name="arrow-left" size={16} />
        {t("listing.back")}
      </button>
    );

  const content = () => {
    if (id === null || query.error) {
      return (
        <div className="flex flex-col items-start gap-16" role="alert">
          <Alert tone="danger">{query.error?.message ?? t("listing.notFound")}</Alert>
          <ButtonLink to={paths.home}>{t("listing.home")}</ButtonLink>
        </div>
      );
    }
    if (!listing) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }
    const media = car?.carMedias ?? [];
    return (
      <>
        <div className="-mx-20 md:mx-0">
          <ListingGallery media={media} onOpen={setViewing} />
        </div>
        <div className="flex flex-col gap-24 md:grid md:grid-cols-3 md:items-start md:gap-32">
          <div className="flex flex-col gap-24 md:col-span-2">
            {listing.status !== "approved" && (
              <Alert tone="info">{t("listing.notApproved")}</Alert>
            )}
            <header className="flex flex-col gap-8">
              {listing.status !== "approved" && <StatusBadge status={listing.status} />}
              <h1 className="type-h1 text-ink md:type-display-m" dir="auto">
                {listing.title}
              </h1>
              {car && (
                <p className="flex items-center gap-4 type-body-s text-muted">
                  <Icon name="map-pin" size={14} />
                  {t(`enums:city.${car.city.slug}`, { defaultValue: car.city.name })}
                </p>
              )}
            </header>
            {car && (
              <p className="type-price-l text-ink md:hidden">
                <bdi dir="ltr">{formatNumber(car.price)}</bdi>{" "}
                <span className="type-mono-s text-muted">{t("units.mad")}</span>
              </p>
            )}
            {car && <ListingSpecs car={car} lookups={lookups.data} />}
            {car && <ListingEquipment equipment={car.equipment} />}
            <section className="flex flex-col gap-12">
              <h2 className="type-h4 text-ink">{t("listing.description")}</h2>
              <p className="type-body-m whitespace-pre-line text-ink-2" dir="auto">
                {listing.description}
              </p>
            </section>
          </div>
          <aside className="flex flex-col gap-16 md:sticky md:top-24">
            {car && (
              <section className="hidden flex-col gap-4 rounded-xl border border-line bg-surface p-24 md:flex">
                <h2 className="sr-only">{t("carDetails.price")}</h2>
                <p className="type-price-l text-ink">
                  <bdi dir="ltr">{formatNumber(car.price)}</bdi>{" "}
                  <span className="type-mono-s text-muted">{t("units.mad")}</span>
                </p>
              </section>
            )}
            {listing.user && <SellerCard seller={listing.user} />}
          </aside>
        </div>
        <MediaViewer
          index={viewing}
          media={media}
          onClose={() => setViewing(null)}
          onIndexChange={setViewing}
          title={listing.title}
        />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:gap-32 md:px-80 md:py-48">
      <PageTitle>{listing?.title ?? t("listing.loadingTitle")}</PageTitle>
      {back}
      {content()}
    </div>
  );
}
