import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { buttonClasses } from "../../../components/buttonStyles";
import { Icon } from "../../../components/Icon";
import { formatDay, formatDayTime, formatNumber, formatTimeAgo } from "../../../lib/format";
import { inspectionReportPath, listingPath } from "../../../lib/paths";
import { shortName } from "../../mechanics/names";
import type { QueuedInspection } from "../api";
import { useMoveInspection } from "../hooks";
import { carName } from "../queue";
import { RejectRequestDialog } from "./RejectRequestDialog";

type QueueCardProps = {
  inspection: QueuedInspection;
};

// One request in the mechanic's queue, with the next step it allows.
export function QueueCard({ inspection }: QueueCardProps) {
  const { t, i18n } = useTranslation(["inspections", "enums", "listings"]);
  const titleId = useId();
  const move = useMoveInspection();
  const [rejecting, setRejecting] = useState(false);
  const { car, status } = inspection;
  const name = carName(inspection);
  const buyer = shortName(`${inspection.buyer.firstName} ${inspection.buyer.lastName}`);
  const seller = car.seller ? shortName(`${car.seller.firstName} ${car.seller.lastName}`) : null;
  const locale = i18n.language;
  // The seller shows the car, so the mechanic calls them once they accept.
  const showsSeller = status === "accepted" || status === "in_progress";

  const details = () => {
    if (status === "pending") {
      return t("queue.card.requested", { name: buyer, time: formatTimeAgo(inspection.requestedAt, locale) });
    }
    if (status === "completed") {
      const parts = [buyer];
      if (inspection.overallScore !== null) {
        parts.push(t("queue.card.score", { score: inspection.overallScore }));
      }
      if (inspection.verdict) {
        parts.push(t(`enums:inspection_verdict.${inspection.verdict}`));
      }
      return parts.join(" · ");
    }
    return seller && status === "accepted" ? `${buyer} · ${t("queue.card.sellerName", { name: seller })}` : buyer;
  };

  const when = () => {
    if (status === "completed" && inspection.completedAt) {
      return formatDayTime(inspection.completedAt, locale);
    }
    if (inspection.acceptedAt && showsSeller) {
      return t("queue.card.accepted", { time: formatDayTime(inspection.acceptedAt, locale) });
    }
    return formatDay(inspection.requestedAt, locale);
  };

  const pendingMove = move.isPending ? move.variables.status : null;

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-12 rounded-xl border border-line bg-surface p-12"
    >
      {car.photoUrl ? (
        <img alt="" className="aspect-video w-full rounded-md object-cover" loading="lazy" src={car.photoUrl} />
      ) : (
        <span className="flex aspect-video w-full items-center justify-center rounded-md bg-paper text-muted">
          <Icon name="car" size={40} />
        </span>
      )}
      <div className="flex flex-col gap-4">
        <h3 className="type-h4 text-ink" dir="auto" id={titleId}>
          {car.listingId === null ? (
            name
          ) : (
            <Link
              className="rounded-xs hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              to={listingPath(car.listingId)}
            >
              {name}
            </Link>
          )}
        </h3>
        <p className="type-body-xs text-muted" dir="auto">
          {details()}
        </p>
      </div>
      {showsSeller && car.seller && (
        <a
          aria-label={t("queue.card.callSeller", { name: seller, phone: car.seller.phone })}
          className="flex w-fit items-center gap-8 rounded-xs type-body-xs text-ink-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          href={`tel:${car.seller.phone}`}
        >
          <Icon name="phone" size={14} />
          <span>
            {t("queue.card.seller")} <bdi dir="ltr">{car.seller.phone}</bdi>
          </span>
        </a>
      )}
      <div className="flex items-baseline justify-between gap-8">
        <p className="type-label-l text-ink">
          <bdi dir="ltr">{formatNumber(inspection.priceAtRequest)}</bdi> {t("listings:units.mad")}
        </p>
        <p className="type-body-xs text-muted">{when()}</p>
      </div>
      {status === "pending" && (
        <div className="grid grid-cols-2 gap-8">
          <Button
            disabled={move.isPending}
            isPending={pendingMove === "accepted"}
            onClick={() => move.mutate({ id: inspection.id, status: "accepted" })}
            size="s"
            variant="success"
          >
            <Icon name="check-circle" size={16} />
            {t("queue.card.accept")}
          </Button>
          <Button disabled={move.isPending} onClick={() => setRejecting(true)} size="s">
            <Icon name="x" size={16} />
            {t("queue.card.reject")}
          </Button>
        </div>
      )}
      {status === "accepted" && (
        <Button
          block
          isPending={pendingMove === "in_progress"}
          onClick={() => move.mutate({ id: inspection.id, status: "in_progress" })}
          size="s"
          variant="dark"
        >
          <Icon name="play" size={16} />
          {t("queue.card.start")}
        </Button>
      )}
      {status === "in_progress" && (
        <ButtonLink block size="s" to={inspectionReportPath(inspection.id)} variant="primary">
          <Icon name="file" size={16} />
          {t("queue.card.completeReport")}
        </ButtonLink>
      )}
      {status === "completed" && inspection.reportPdfLink && (
        <a
          aria-label={t("queue.card.reportLabel", { car: name })}
          className={buttonClasses({ variant: "secondary", size: "s", block: true })}
          href={inspection.reportPdfLink}
          rel="noreferrer"
          target="_blank"
        >
          <Icon name="download" size={16} />
          {t("queue.card.report")}
        </a>
      )}
      <div className="empty:hidden" role="alert">
        {move.error && !rejecting && <Alert tone="danger">{move.error.message}</Alert>}
      </div>
      <RejectRequestDialog
        buyer={buyer}
        car={name}
        error={move.error?.message ?? null}
        isPending={move.isPending}
        onClose={() => {
          setRejecting(false);
          move.reset();
        }}
        onConfirm={() =>
          move.mutate({ id: inspection.id, status: "rejected" }, { onSuccess: () => setRejecting(false) })
        }
        open={rejecting}
      />
    </article>
  );
}
