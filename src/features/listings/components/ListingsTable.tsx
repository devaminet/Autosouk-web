import { useTranslation } from "react-i18next";
import { formatDay } from "../../../lib/format";
import type { SellerListing } from "../api";
import { ListingMeta } from "./ListingMeta";
import { ListingPrice } from "./ListingPrice";
import { ListingThumb } from "./ListingThumb";
import { RejectionNote } from "./RejectionNote";
import { StatusBadge } from "./StatusBadge";

const headerCell = "pe-16 pb-12 text-start type-overline font-normal text-muted";

type ListingsTableProps = {
  listings: SellerListing[];
};

// The layout for wide screens. ListingCards is the one for small screens.
export function ListingsTable({ listings }: ListingsTableProps) {
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
            <td className="py-16 pe-16">
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
          </tr>
        ))}
      </tbody>
    </table>
  );
}
