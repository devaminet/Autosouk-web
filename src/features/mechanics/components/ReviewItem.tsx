import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { formatDay } from "../../../lib/format";
import type { Review } from "../api";
import { initialsOf } from "../workshopForm";

type ReviewItemProps = {
  review: Review;
  // The reviewer's name. The API leaves it out of the buyer's own review.
  name: string;
  // Such as the "Your review" badge.
  badge?: ReactNode;
  // Such as the edit and delete buttons of the buyer's own review.
  children?: ReactNode;
};

const stars = [1, 2, 3, 4, 5];

// One review: who wrote it and when, its stars and its words.
export function ReviewItem({ review, name, badge, children }: ReviewItemProps) {
  const { t, i18n } = useTranslation("mechanics");

  return (
    <article className="flex flex-col gap-12 py-20">
      <header className="flex items-start gap-12">
        <span
          aria-hidden="true"
          className="flex size-40 shrink-0 items-center justify-center rounded-full bg-brand-soft type-label-m text-brand-ink"
          dir="auto"
        >
          {initialsOf(name)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-8">
            <h3 className="type-label-l text-ink" dir="auto">
              {name}
            </h3>
            {badge}
          </div>
          <p className="type-body-xs text-muted">{formatDay(review.createdAt, i18n.language)}</p>
        </div>
        <p className="flex shrink-0 items-center gap-4 type-label-s text-ink">
          <span aria-hidden="true" className="flex text-saffron">
            {stars.map((star) => (
              <Icon className={star <= review.rating ? "fill-current" : "text-line-strong"} key={star} name="star" size={14} />
            ))}
          </span>
          <span className="sr-only">{t("profile.reviewRating", { rating: review.rating })}</span>
          <bdi aria-hidden="true" dir="ltr">
            {review.rating.toFixed(1)}
          </bdi>
        </p>
      </header>
      {review.message && (
        <p className="type-body-m whitespace-pre-line text-ink-2" dir="auto">
          {review.message}
        </p>
      )}
      {children}
    </article>
  );
}
