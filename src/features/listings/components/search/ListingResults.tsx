import { Trans, useTranslation } from "react-i18next";
import { Alert } from "../../../../components/Alert";
import { Button } from "../../../../components/Button";
import { Icon } from "../../../../components/Icon";
import { Pagination } from "../../../../components/Pagination";
import { formatNumber } from "../../../../lib/format";
import type { PublicListings } from "../../api";
import { PublicListingCard } from "../explore/PublicListingCard";

type ListingResultsProps = {
  results?: PublicListings;
  error: Error | null;
  onRetry: () => void;
  // Whether a search narrowed the results, which changes the empty state.
  filtered: boolean;
  onClear: () => void;
  // The link target for a page of results.
  hrefFor: (page: number) => string;
  gridClassName: string;
  // Shows "Showing 1–9 of 21" next to the pages.
  showRange?: boolean;
};

// A page of approved listings, with its loading, empty and error states.
export function ListingResults({
  results,
  error,
  onRetry,
  filtered,
  onClear,
  hrefFor,
  gridClassName,
  showRange = false,
}: ListingResultsProps) {
  const { t } = useTranslation("listings");

  if (error) {
    return (
      <div className="flex flex-col items-start gap-16" role="alert">
        <Alert tone="danger">{error.message}</Alert>
        <Button onClick={onRetry}>{t("explore.results.retry")}</Button>
      </div>
    );
  }
  if (!results) {
    return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
  }
  if (results.listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-16 rounded-2xl border border-dashed border-line-strong px-24 py-48 text-center">
        <Icon className="text-muted" name="car" size={32} />
        <p className="type-h5 text-ink">{t(filtered ? "explore.results.noMatch" : "explore.results.empty")}</p>
        {filtered && <Button onClick={onClear}>{t("explore.results.clear")}</Button>}
      </div>
    );
  }

  const { page, limit, total, totalPages } = results.meta;
  const from = (page - 1) * limit + 1;
  return (
    <>
      <ul className={`grid gap-16 ${gridClassName}`}>
        {results.listings.map((listing) => (
          <PublicListingCard key={listing.id} listing={listing} />
        ))}
      </ul>
      <div className={`flex flex-col items-center gap-16 ${showRange ? "sm:flex-row sm:justify-between" : ""}`}>
        {showRange && (
          <p className="type-body-s text-muted">
            <Trans
              components={{ n: <bdi dir="ltr" /> }}
              i18nKey="search.showing"
              ns="listings"
              values={{
                from: formatNumber(from),
                to: formatNumber(from + results.listings.length - 1),
                total: formatNumber(total),
              }}
            />
          </p>
        )}
        <Pagination hrefFor={hrefFor} page={page} totalPages={totalPages} />
      </div>
    </>
  );
}
