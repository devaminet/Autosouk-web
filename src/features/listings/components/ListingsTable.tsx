import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../components/ButtonLink";
import { Link } from "react-router";
import { Icon } from "../../../components/Icon";
import { formatDay } from "../../../lib/format";
import { listingPath } from "../../../lib/paths";
import type { SellerListing } from "../api";
import { editActionFor, mediaPathFor, rowPathFor } from "../editAction";
import { resumeDraftPath } from "../wizardSteps";
import { ListingActionsMenu } from "./ListingActionsMenu";
import { ListingMeta } from "./ListingMeta";
import { ListingPrice } from "./ListingPrice";
import { ListingThumb } from "./ListingThumb";
import { RejectionNote } from "./RejectionNote";
import { StatusBadge } from "./StatusBadge";

const headerCell = "pe-16 pb-12 text-start type-overline font-normal whitespace-nowrap text-muted";

type ListingsTableProps = {
  listings: SellerListing[];
  // The link that opens a listing in the edit drawer.
  editTo: (listing: SellerListing) => string;
  onDelete: (listing: SellerListing) => void;
};

// The layout for wide screens. ListingCards is the one for small screens.
export function ListingsTable({ listings, editTo, onDelete }: ListingsTableProps) {
  const { t, i18n } = useTranslation("listings");

  return (
    // Scrolls sideways when the window is too narrow for every column.
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full">
        <thead className="border-b border-line">
          <tr>
            {/* Takes the room the other columns don't need. */}
            <th className={`${headerCell} w-full`} scope="col">
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
            <th className="w-px pb-12 text-end type-overline font-normal text-muted" scope="col">
              {t("table.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => {
            const edit = editActionFor(listing.status);
            const mediaTo = mediaPathFor(listing);
            return (
            // The title's link covers the row, so a click anywhere on it opens the listing.
            <tr className="relative border-b border-line last:border-b-0 hover:bg-paper" key={listing.id}>
              <td className="py-16 pe-16">
                <div className="flex items-center gap-16">
                  <ListingThumb listing={listing} />
                  {/* Wide enough that titles don't break word by word before the table scrolls. */}
                  <div className="flex min-w-3xs flex-col gap-4">
                    <p className="type-h5" dir="auto">
                      <Link className="rounded-xs text-ink after:absolute after:inset-0 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand" to={rowPathFor(listing)}>
                        {listing.title}
                      </Link>
                    </p>
                    <ListingMeta car={listing.car} />
                    {listing.status === "rejected" && listing.rejectionReason && (
                      <RejectionNote reason={listing.rejectionReason} />
                    )}
                  </div>
                </div>
              </td>
              <td className="py-16 pe-16 whitespace-nowrap">
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
                {/* Positioned, so the actions stay above the row's link. */}
                <div className="relative flex items-center justify-end gap-8">
                  {listing.status === "draft" && (
                    <ButtonLink
                      className="whitespace-nowrap"
                      aria-label={t("actions.continueListing", { title: listing.title })}
                      size="s"
                      to={resumeDraftPath(listing)}
                      variant="dark"
                    >
                      <Icon name="arrow-right" size={16} />
                      {t("actions.continue")}
                    </ButtonLink>
                  )}
                  {edit && (
                    <ButtonLink
                      className="whitespace-nowrap"
                      aria-label={t(`actions.${edit.label}Listing`, { title: listing.title })}
                      preventScrollReset
                      size="s"
                      to={editTo(listing)}
                      variant={edit.variant}
                    >
                      <Icon name="pencil" size={16} />
                      {t(`actions.${edit.label}`)}
                    </ButtonLink>
                  )}
                  {listing.status === "sold" && (
                    <ButtonLink
                      className="whitespace-nowrap"
                      aria-label={t("actions.viewListing", { title: listing.title })}
                      size="s"
                      to={listingPath(listing.id)}
                    >
                      <Icon name="eye" size={16} />
                      {t("actions.view")}
                    </ButtonLink>
                  )}
                  {mediaTo && (
                    <Link
                      aria-label={t("actions.mediaListing", { title: listing.title })}
                      className="flex size-control-s shrink-0 items-center justify-center rounded-full bg-surface text-brand ring-1 ring-line-strong ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      to={mediaTo}
                    >
                      <Icon name="image" size={16} />
                    </Link>
                  )}
                  <ListingActionsMenu
                    onDelete={() => onDelete(listing)}
                    title={listing.title}
                  />
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
