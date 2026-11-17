import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { PageTitle } from "../../../components/PageTitle";
import { ReviewPanel } from "../components/ReviewPanel";
import { ReviewQueue } from "../components/ReviewQueue";
import { useReview, useReviews } from "../hooks";

// Admins check the documents mechanics send, one mechanic at a time.
export function AdminMechanicsPage() {
  const { t } = useTranslation("documents");
  const [params] = useSearchParams();
  const reviews = useReviews();
  const fromUrl = Number(params.get("mechanic"));
  const selected = Number.isInteger(fromUrl) && fromUrl > 0 ? fromUrl : (reviews.data?.[0]?.user.id ?? null);
  const review = useReview(selected);

  const queue = () => {
    if (reviews.isError) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{reviews.error.message}</Alert>
          <Button onClick={() => void reviews.refetch()}>{t("retry")}</Button>
        </div>
      );
    }
    if (reviews.isPending) {
      return <output className="type-body-m text-muted">{t("common:loading")}</output>;
    }
    return <ReviewQueue reviews={reviews.data} selected={selected} />;
  };

  const panel = () => {
    if (selected === null) {
      return null;
    }
    if (review.isError) {
      return (
        <div role="alert">
          <Alert tone="danger">{review.error.message}</Alert>
        </div>
      );
    }
    if (review.isPending) {
      return <output className="type-body-m text-muted">{t("common:loading")}</output>;
    }
    // A fresh panel for each mechanic, so decisions don't carry over.
    return <ReviewPanel key={review.data.user.id} review={review.data} />;
  };

  return (
    <div className="flex flex-col gap-24 px-20 py-24 md:px-40 md:py-40">
      <PageTitle>{t("admin.pageTitle")}</PageTitle>
      <header className="flex flex-col gap-4">
        <p className="type-overline text-brand">{t("admin.overline")}</p>
        <h1 className="type-h1 text-ink">{t("admin.title")}</h1>
      </header>
      <div className="grid items-start gap-24 lg:grid-cols-3">
        <div className="min-w-0">{queue()}</div>
        <div className="min-w-0 lg:col-span-2">{panel()}</div>
      </div>
    </div>
  );
}
