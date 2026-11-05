import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { formatDay } from "../../../lib/format";
import { draftStepPath } from "../../../lib/paths";
import type { SellerListing } from "../api";
import { ListingActionsMenu } from "./ListingActionsMenu";
import { ListingMeta } from "./ListingMeta";
import { ListingPrice } from "./ListingPrice";
import { ListingThumb } from "./ListingThumb";
import { RejectionNote } from "./RejectionNote";
import { StatusBadge } from "./StatusBadge";

const headerCell = "pe-16 pb-12 text-start type-overline font-normal text-muted";

type ListingsTableProps = {
  listings: SellerListing[];
  onDelete: (listing: SellerListing) => void;
};

// The layout for wide screens. ListingCards is the one for small screens.
export function ListingsTable({ listings, onDelete }: ListingsTableProps) {
  const { t, i18n } = useTranslation("listings");

  return (
    <table className="hidden w-full md:table">
      <thead className="border-b border-line">
        <tr>
          <th className={headerCell} scope="col">
            {t("table.listing")}
          </th>
          <th className={headerCell} scope="col">
            {t("table.price")}
          </th>
          <th className={headerCell} scope="col">
            {t("table.status")}
          </th>
          <th className={headerCell} scope="col">
            {t("table.inspections")}
          </th>
          <th className={headerCell} scope="col">
            {t("table.updated")}
          </th>
          <th className="pb-12 text-end type-overline font-normal text-muted" scope="col">
            {t("table.actions")}
          </th>
        </tr>
      </thead>
      <tbody>
        {listings.map((listing) => (
          <tr className="border-b border-line last:border-b-0" key={listing.id}>
            <td className="py-16 pe-16">
              <div className="flex items-center gap-16">
                <ListingThumb listing={listing} />
                <div className="flex min-w-0 flex-col gap-4">
                  <p className="type-h5 text-ink" dir="auto">
                    {listing.title}
                  </p>
                  <ListingMeta car={listing.car} />
                  {listing.status === "rejected" && listing.rejectionReason && (
                    <RejectionNote reason={listing.rejectionReason} />
                  )}
                </div>
              </div>
            </td>
            <td className="py-16 pe-16">
              <ListingPrice car={listing.car} />
            </td>
            <td className="py-16 pe-16 whitespace-nowrap">
              <StatusBadge status={listing.status} />
            </td>
            <td className="py-16 pe-16 type-body-s text-ink-2">
              {listing.completedInspectionsCount > 0
                ? t("table.inspectionsCompleted", {
                    count: listing.completedInspectionsCount,
                  })
                : "—"}
            </td>
            <td className="py-16 pe-16 type-body-s whitespace-nowrap text-muted">
              {formatDay(listing.updatedAt, i18n.language)}
            </td>
            <td className="py-16">
              <div className="flex items-center justify-end gap-8">
                {listing.status === "draft" && (
                  <ButtonLink
                    aria-label={t("actions.continueListing", { title: listing.title })}
                    size="s"
                    to={draftStepPath(listing.id, "car")}
                    variant="dark"
                  >
                    <Icon name="arrow-right" size={16} />
                    {t("actions.continue")}
                  </ButtonLink>
                )}
                <ListingActionsMenu
                  onDelete={() => onDelete(listing)}
                  title={listing.title}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
