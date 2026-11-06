import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Icon } from "../../../components/Icon";
import { paths } from "../../../lib/paths";

type ListingBreadcrumbProps = {
  // The name of the current page.
  current: string;
};

// The way back to My listings, on wide screens.
export function ListingBreadcrumb({ current }: ListingBreadcrumbProps) {
  const { t } = useTranslation("listings");

  return (
    <nav aria-label={t("wizard.breadcrumb")}>
      <ol className="flex items-center gap-8 type-label-m">
        <li>
          <Link
            className="flex items-center gap-8 rounded-xs text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            to={paths.myListings}
          >
            <Icon name="arrow-left" size={16} />
            {t("myListings.title")}
          </Link>
        </li>
        <li aria-hidden="true" className="text-muted">
          /
        </li>
        <li aria-current="page" className="min-w-0 truncate text-muted" dir="auto">
          {current}
        </li>
      </ol>
    </nav>
  );
}
