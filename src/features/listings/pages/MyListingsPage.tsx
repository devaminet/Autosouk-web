import { useTranslation } from "react-i18next";
import { Navigate, useSearchParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { Pagination } from "../../../components/Pagination";
import { ListingCards } from "../components/ListingCards";
import { ListingStats } from "../components/ListingStats";
import { ListingsTable } from "../components/ListingsTable";
import { StatusTabs } from "../components/StatusTabs";
import { useMyListings } from "../hooks";
import { myListingsSearch, parseMyListingsSearch } from "../myListingsSearch";

export function MyListingsPage() {
  const { t } = useTranslation("listings");
  const [searchParams] = useSearchParams();
  const { status, page } = parseMyListingsSearch(searchParams);
  const query = useMyListings({ status, page });
  const data = query.data;

  // The last listing of a page can disappear, which leaves a page that is gone.
  if (data && !query.isPlaceholderData && data.meta.totalPages > 0 && page > data.meta.totalPages) {
    return (
      <Navigate
        replace
        to={{ search: myListingsSearch({ status, page: data.meta.totalPages }) }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:gap-32 md:px-80 md:py-48">
      <PageTitle>{t("myListings.title")}</PageTitle>
      <header className="flex flex-col gap-4">
        <p className="hidden type-overline text-brand md:block">{t("myListings.overline")}</p>
        <h1 className="type-h1 text-ink md:type-display-m">{t("myListings.title")}</h1>
      </header>

      {query.isPending && (
        <output className="block type-body-m text-muted">{t("common:loading")}</output>
      )}

      {query.isError && !data && (
        <div role="alert">
          <Alert
            action={
              <Button
                isPending={query.isFetching}
                onClick={() => void query.refetch()}
                size="s"
              >
                {t("myListings.retry")}
              </Button>
            }
            tone="danger"
          >
            {query.error.message}
          </Alert>
        </div>
      )}

      {data && (
        <>
          <ListingStats counts={data.meta.statusCounts} />
          <section
            aria-busy={query.isPlaceholderData}
            aria-label={t("myListings.title")}
            className="flex flex-col gap-16 md:rounded-xl md:border md:border-line md:bg-surface md:p-24"
          >
            <StatusTabs active={status} counts={data.meta.statusCounts} />
            <p className="hidden items-center gap-8 type-body-s text-muted md:flex">
              <Icon name="eye" size={16} />
              {t("myListings.visibility")}
            </p>
            {data.listings.length > 0 ? (
              <>
                <ListingsTable listings={data.listings} />
                <ListingCards listings={data.listings} />
                <Pagination
                  hrefFor={(target) => myListingsSearch({ status, page: target })}
                  page={page}
                  totalPages={data.meta.totalPages}
                />
              </>
            ) : (
              <p className="py-48 text-center type-body-m text-muted">
                {status ? t("myListings.emptyFilter") : t("myListings.empty")}
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
