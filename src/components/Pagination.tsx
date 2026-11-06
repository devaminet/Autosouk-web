import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

const circle =
  "flex size-40 items-center justify-center rounded-full type-label-m focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const idle = "border border-line bg-surface text-ink hover:bg-surface-2";

// The first and last pages, and the pages around the current one.
const visiblePages = (page: number, totalPages: number) =>
  [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

type ArrowProps = {
  to: string;
  label: string;
  icon: IconName;
  disabled: boolean;
};

function Arrow({ to, label, icon, disabled }: ArrowProps) {
  if (disabled) {
    return (
      <span aria-hidden="true" className={`${circle} border border-line text-muted opacity-45`}>
        <Icon name={icon} size={16} />
      </span>
    );
  }
  return (
    <Link aria-label={label} className={`${circle} ${idle}`} preventScrollReset to={to}>
      <Icon name={icon} size={16} />
    </Link>
  );
}

type PaginationProps = {
  page: number;
  totalPages: number;
  // The link target for a page, usually its query string.
  hrefFor: (page: number) => string;
};

export function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav aria-label={t("pagination.label")}>
      <ul className="flex flex-wrap items-center justify-center gap-8">
        <li>
          <Arrow
            disabled={page <= 1}
            icon="chevron-left"
            label={t("pagination.previous")}
            to={hrefFor(page - 1)}
          />
        </li>
        {visiblePages(page, totalPages).map((item, index, pages) => (
          <Fragment key={item}>
            {item - (pages[index - 1] ?? item) > 1 && (
              <li aria-hidden="true" className={`${circle} text-muted`}>
                …
              </li>
            )}
            <li>
              <Link
                aria-current={item === page ? "page" : undefined}
                aria-label={t("pagination.page", { page: item })}
                className={`${circle} ${item === page ? "bg-ink text-surface" : idle}`}
                preventScrollReset
                to={hrefFor(item)}
              >
                <bdi dir="ltr">{item}</bdi>
              </Link>
            </li>
          </Fragment>
        ))}
        <li>
          <Arrow
            disabled={page >= totalPages}
            icon="chevron-right"
            label={t("pagination.next")}
            to={hrefFor(page + 1)}
          />
        </li>
      </ul>
    </nav>
  );
}
