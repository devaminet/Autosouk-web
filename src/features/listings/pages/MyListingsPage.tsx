import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { z } from "zod";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { PageTitle } from "../../../components/PageTitle";
import { Pagination } from "../../../components/Pagination";
import { paths } from "../../../lib/paths";
import type { SellerListing } from "../api";
import { DeleteListingDialog } from "../components/DeleteListingDialog";
import { EditListingDrawer } from "../components/EditListingDrawer";
import { ListingCards } from "../components/ListingCards";
import { ListingStats } from "../components/ListingStats";
import { ListingsTable } from "../components/ListingsTable";
import { StatusTabs } from "../components/StatusTabs";
import { useDeleteListing, useMyListings } from "../hooks";
import { myListingsSearch, parseEditParam, parseMyListingsSearch } from "../myListingsSearch";

const noticeSchema = z.object({ notice: z.string() });

type ListingRef = { id: number; title: string };

export function MyListingsPage() {
  const { t } = useTranslation("listings");
  const [searchParams] = useSearchParams();
  const { status, page } = parseMyListingsSearch(searchParams);
  const editId = parseEditParam(searchParams);
  const navigate = useNavigate();
  const query = useMyListings({ status, page });
  const data = query.data;
  const deletion = useDeleteListing();
  const [listingToDelete, setListingToDelete] = useState<ListingRef | null>(null);
  const [deletedListing, setDeletedListing] = useState<ListingRef | null>(null);
  const location = useLocation();
  const routeNotice = noticeSchema.safeParse(location.state);
  const notice = deletedListing
    ? t("myListings.deleted", { title: deletedListing.title })
    : routeNotice.data?.notice;
  const noticeElement = useRef<HTMLOutputElement>(null);

  // A deleted row or a left page held the focus, so keyboard and screen reader
  // users continue from the notice. A parent's effect runs after the dialog's,
  // which has closed by then. An open modal dialog would block this focus.
  useEffect(() => {
    if (notice) {
      noticeElement.current?.focus();
    }
  }, [notice]);

  // The drawer lives in the URL, so a link opens it and Back closes it.
  const editTo = (listing: SellerListing) => myListingsSearch({ status, page, edit: listing.id });
  const closeEdit = (state?: { notice: string }) => {
    if (editId !== null) {
      void navigate(
        { search: myListingsSearch({ status, page }) },
        { replace: true, preventScrollReset: true, state },
      );
    }
  };

  const askToDelete = (listing: ListingRef) => {
    deletion.reset();
    setDeletedListing(null);
    setListingToDelete(listing);
  };

  const confirmDelete = () => {
    if (!listingToDelete) {
      return;
    }
    deletion.mutate(listingToDelete.id, {
      onSuccess: () => {
        setDeletedListing(listingToDelete);
        setListingToDelete(null);
        // Deleting from the drawer closes it too.
        closeEdit();
      },
    });
  };

  // The last listing of a page can disappear, which leaves a page that is gone.
  const lastPage =
    data && !query.isPlaceholderData && data.meta.totalPages > 0 && page > data.meta.totalPages
      ? data.meta.totalPages
      : null;

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:gap-32 md:px-80 md:py-48">
      <PageTitle>{t("myListings.title")}</PageTitle>
      <header className="flex items-center justify-between gap-16">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="hidden type-overline text-brand md:block">{t("myListings.overline")}</p>
          <h1 className="type-h1 text-ink md:type-display-m">{t("myListings.title")}</h1>
        </div>
        <div className="hidden shrink-0 md:block">
          <ButtonLink size="l" to={paths.newListing} variant="primary">
            <Icon name="plus" size={20} />
            {t("myListings.newListing")}
          </ButtonLink>
        </div>
        <Link
          aria-label={t("myListings.newListing")}
          className="flex size-control-m shrink-0 items-center justify-center rounded-full bg-brand text-on-brand shadow-elevation-brand hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:hidden"
          to={paths.newListing}
        >
          <Icon name="plus" size={20} />
        </Link>
      </header>

      {notice && (
        <output className="block focus:outline-none" ref={noticeElement} tabIndex={-1}>
          <Alert tone="success">{notice}</Alert>
        </output>
      )}

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

      {lastPage !== null && (
        <Navigate replace to={{ search: myListingsSearch({ status, page: lastPage }) }} />
      )}

      {data && lastPage === null && (
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
                <ListingsTable editTo={editTo} listings={data.listings} onDelete={askToDelete} />
                <ListingCards editTo={editTo} listings={data.listings} onDelete={askToDelete} />
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

      <EditListingDrawer
        listingId={editId}
        onClose={() => closeEdit()}
        onDelete={askToDelete}
        onSaved={() => {
          setDeletedListing(null);
          closeEdit({ notice: t("edit.saved") });
        }}
      />
      {/* Opened later than the drawer, so it shows on top of it. */}
      <DeleteListingDialog
        error={deletion.error?.message ?? null}
        isPending={deletion.isPending}
        listing={listingToDelete}
        onClose={() => setListingToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
