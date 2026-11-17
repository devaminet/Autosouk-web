import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "../../../components/Badge";
import { formatTimeAgo } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import type { ReviewSummary } from "../adminApi";

type ReviewQueueProps = {
  reviews: ReviewSummary[];
  selected: number | null;
};

const initials = (review: ReviewSummary) =>
  (review.mechanic?.name ?? `${review.user.firstName} ${review.user.lastName}`)
    .split(/\s+/u)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toUpperCase();

// The mechanics waiting, longest first. The selected one lives in the URL.
export function ReviewQueue({ reviews, selected }: ReviewQueueProps) {
  const { t } = useTranslation(["documents", "enums"]);

  return (
    <nav aria-labelledby="review-queue-title" className="flex flex-col gap-4 rounded-xl bg-surface p-8 ring-1 ring-line ring-inset">
      <div className="flex items-center justify-between gap-8 px-12 py-8">
        <h2 className="type-h5 text-ink" id="review-queue-title">
          {t("admin.queue.title")} <span className="type-body-s text-muted">{reviews.length}</span>
        </h2>
        <span className="type-body-xs text-muted">{t("admin.queue.order")}</span>
      </div>
      {reviews.length === 0 ? (
        <p className="px-12 py-16 type-body-s text-muted">{t("admin.queue.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => {
            const current = review.user.id === selected;
            const name = review.mechanic?.name ?? `${review.user.firstName} ${review.user.lastName}`;
            return (
              <li key={review.user.id}>
                <Link
                  aria-current={current ? "page" : undefined}
                  className={`flex items-start gap-12 rounded-lg p-12 focus-visible:outline-2 focus-visible:outline-brand ${current ? "bg-brand-soft/40 ring-2 ring-brand ring-inset" : "hover:bg-paper"}`}
                  to={`?mechanic=${review.user.id}`}
                >
                  <span className={`flex size-40 shrink-0 items-center justify-center rounded-md type-label-m ${current ? "bg-brand-soft text-brand" : "bg-paper text-ink-2"}`}>
                    {initials(review)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-4">
                    <span className="truncate type-label-m text-ink">{name}</span>
                    <span className="type-body-xs text-muted">
                      {[review.mechanic?.city, t("admin.queue.documents", { count: review.pendingCount })].filter(Boolean).join(" · ")}
                    </span>
                    <span className="flex flex-wrap gap-4">
                      {review.kind && <Badge tone={review.kind === "garage" ? "brand" : "neutral"}>{t(`enums:mechanic_kind.${review.kind}`)}</Badge>}
                      {review.resent && <Badge tone="warning">{t("admin.queue.resent")}</Badge>}
                    </span>
                  </span>
                  {review.submittedAt && (
                    <span className="shrink-0 type-body-xs text-muted">{formatTimeAgo(review.submittedAt, getLocale())}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
