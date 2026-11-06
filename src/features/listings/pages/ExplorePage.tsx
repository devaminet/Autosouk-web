import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { PageTitle } from "../../../components/PageTitle";
import { paths } from "../../../lib/paths";
import { useSession } from "../../auth/hooks";
import { ExploreHero } from "../components/explore/ExploreHero";
import { HowItWorks } from "../components/explore/HowItWorks";
import { RecentListings } from "../components/explore/RecentListings";
import { SellerBanner } from "../components/explore/SellerBanner";
import {
  clearedSearch,
  explorePageSize,
  readListingSearch,
  toListingsFilter,
  writeListingSearch,
} from "../listingSearch";
import type { ListingSearch } from "../listingSearch";
import { useLookups, usePublicListings } from "../hooks";

// The home page: search, the latest approved listings, and how AutoSouk works.
export function ExplorePage() {
  const { t } = useTranslation(["listings", "enums"]);
  const [params, setParams] = useSearchParams();
  const search = readListingSearch(params);
  const results = usePublicListings(toListingsFilter(search, explorePageSize));
  // The count of every approved listing, whatever the search.
  const all = usePublicListings({ limit: 1 });
  const lookups = useLookups();
  const { user } = useSession();
  const city = lookups.data?.cities.find(({ id }) => id === search.cityId);

  const update = (next: ListingSearch) => {
    setParams(writeListingSearch(next), { preventScrollReset: true });
  };
  // A new search starts again from its first page.
  const onSearch = (changes: Partial<ListingSearch>) => update({ ...search, ...changes, page: 1 });
  const onClear = () => update(clearedSearch(search));

  // Only sellers publish, and guests can sign up as one.
  const sellTo = !user ? paths.register : user.role === "seller" ? paths.newListing : null;

  return (
    <div className="flex flex-col gap-48 pb-48 md:gap-96 md:pb-96">
      <PageTitle>{t("explore.pageTitle")}</PageTitle>
      <ExploreHero
        firstName={user?.firstName}
        onSearch={(changes) => {
          onSearch(changes);
          document.getElementById("listings")?.scrollIntoView({ block: "start" });
        }}
        search={search}
        total={all.data?.meta.total}
      />
      <RecentListings
        cityName={city ? t(`enums:city.${city.slug}`, { defaultValue: city.name }) : undefined}
        error={results.error}
        onClear={onClear}
        onRetry={() => void results.refetch()}
        onSearch={onSearch}
        results={results.data}
        search={search}
      />
      <HowItWorks />
      {sellTo && <SellerBanner to={sellTo} />}
    </div>
  );
}
