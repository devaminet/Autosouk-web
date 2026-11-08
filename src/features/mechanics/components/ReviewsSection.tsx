import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { Alert } from "../../../components/Alert";
import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { paths } from "../../../lib/paths";
import { useSession } from "../../auth/hooks";
import type { PublicMechanic } from "../api";
import { useDeleteReview, useOwnReview, useReviews } from "../hooks";
import { DeleteReviewDialog } from "./DeleteReviewDialog";
import { RatingBreakdown } from "./RatingBreakdown";
import { ReviewDialog } from "./ReviewDialog";
import { shortName } from "../names";
import { ReviewItem } from "./ReviewItem";

type ReviewsSectionProps = {
  mechanic: PublicMechanic;
};

// The workshop's rating and reviews. Buyers write, change and delete their own.
export function ReviewsSection({ mechanic }: ReviewsSectionProps) {
  const { t } = useTranslation("mechanics");
  const { user } = useSession();
  const location = useLocation();
  const isBuyer = user?.role === "buyer";
  const reviews = useReviews(mechanic.id);
  const own = useOwnReview(mechanic.id, isBuyer);
  const remove = useDeleteReview(mechanic.id);
  const [writing, setWriting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ownReview = own.data ?? null;
  // The buyer's own review comes first, so the list leaves it out.
  const others = (reviews.data?.pages ?? [])
    .flatMap((page) => page.reviews)
    .filter(({ buyer }) => !isBuyer || buyer?.id !== user.id);
  const rating = reviews.data?.pages[0]?.rating ?? mechanic.rating;
  const ownName = user ? `${user.firstName} ${user.lastName}` : "";

  const writeAction = () => {
    if (!user) {
      return (
        <ButtonLink block size="l" state={{ from: `${location.pathname}${location.search}` }} to={paths.login} variant="dark">
          <Icon name="pencil" size={18} />
          {t("profile.loginToReview")}
        </ButtonLink>
      );
    }
    if (!isBuyer || !own.isSuccess || ownReview) {
      return null;
    }
    return (
      <Button block onClick={() => setWriting(true)} size="l" variant="dark">
        <Icon name="pencil" size={18} />
        {t("profile.writeReview")}
      </Button>
    );
  };

  const list = () => {
    if (reviews.error) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{reviews.error.message}</Alert>
          <Button onClick={() => void reviews.refetch()}>{t("profile.retry")}</Button>
        </div>
      );
    }
    if (!reviews.data) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }
    if (!ownReview && others.length === 0) {
      return <p className="py-20 type-body-m text-muted">{t("profile.noReviews")}</p>;
    }
    return (
      <>
        <ul className="flex flex-col divide-y divide-line">
          {ownReview && (
            <li>
              <ReviewItem
                badge={<Badge tone="brand">{t("profile.yourReview")}</Badge>}
                name={t("profile.you", { name: shortName(ownName) })}
                review={ownReview}
              >
                <div className="flex flex-wrap gap-8">
                  <Button onClick={() => setWriting(true)} size="s">
                    <Icon name="pencil" size={16} />
                    {t("profile.editReview")}
                  </Button>
                  <Button onClick={() => setDeleting(true)} size="s" variant="ghost">
                    <Icon name="trash" size={16} />
                    {t("profile.deleteReview")}
                  </Button>
                </div>
              </ReviewItem>
            </li>
          )}
          {others.map((review) => (
            <li key={review.id}>
              <ReviewItem name={shortName(review.buyer?.name ?? "")} review={review} />
            </li>
          ))}
        </ul>
        {reviews.hasNextPage && (
          <div className="flex justify-center pt-8">
            <Button isPending={reviews.isFetchingNextPage} onClick={() => void reviews.fetchNextPage()}>
              {t("profile.moreReviews")}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-32 md:grid-cols-3">
      <div className="flex flex-col gap-24">
        <RatingBreakdown rating={rating} />
        {writeAction()}
      </div>
      <div aria-busy={reviews.isFetching} className="flex flex-col md:col-span-2">
        {list()}
      </div>
      <ReviewDialog
        garage={{ id: mechanic.id, name: mechanic.name, logo: mechanic.profileImageUrl }}
        onClose={() => setWriting(false)}
        open={writing}
        review={ownReview}
      />
      <DeleteReviewDialog
        error={remove.error?.message ?? null}
        isPending={remove.isPending}
        onClose={() => {
          setDeleting(false);
          remove.reset();
        }}
        onConfirm={() => remove.mutate(undefined, { onSuccess: () => setDeleting(false) })}
        open={deleting}
      />
    </div>
  );
}
