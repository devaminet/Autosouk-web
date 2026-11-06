import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { TextLink } from "../../../components/TextLink";
import { formatNumber } from "../../../lib/format";
import { paths } from "../../../lib/paths";
import type { ListingCar } from "../api";
import { StatusBadge } from "./StatusBadge";

type ListingSubmittedProps = {
  title: string;
  car: ListingCar;
};

export function ListingSubmitted({ title, car }: ListingSubmittedProps) {
  const { t } = useTranslation("listings");
  const heading = useRef<HTMLHeadingElement>(null);
  const cover = car.carMedias.find(({ isPrimary, type }) => isPrimary && type === "image");

  // The page changes without a navigation, so say what happened.
  useEffect(() => heading.current?.focus(), []);

  return (
    <div className="mx-auto flex w-full max-w-auth flex-col items-center gap-24 px-20 py-48 text-center">
      <div className="relative flex size-96 items-center justify-center rounded-full bg-success-soft text-success">
        <Icon name="check" size={48} />
        <span className="absolute -top-4 -inset-e-4 flex size-40 items-center justify-center rounded-full bg-saffron text-ink">
          <Icon name="clock" size={20} />
        </span>
      </div>
      <div className="flex flex-col gap-12">
        <h1 className="type-h1 text-ink outline-none" ref={heading} tabIndex={-1}>{t("submitted.title")}</h1>
        <p className="type-body-m text-muted">{t("submitted.description")}</p>
      </div>
      <div className="flex w-full items-center gap-12 rounded-lg bg-surface p-8 text-start shadow-elevation-1">
        {cover ? (
          <img alt="" className="h-64 w-96 shrink-0 rounded-md object-cover" src={cover.link} />
        ) : (
          <span className="flex h-64 w-96 shrink-0 items-center justify-center rounded-md bg-paper text-muted">
            <Icon name="car" size={24} />
          </span>
        )}
        <div className="flex min-w-0 flex-col items-start gap-4">
          <p className="type-h5 text-ink" dir="auto">
            {title}
          </p>
          <p className="whitespace-nowrap">
            <bdi className="type-price-m text-ink" dir="ltr">
              {formatNumber(car.price)}
            </bdi>{" "}
            <span className="type-mono-s text-muted">{t("units.mad")}</span>
          </p>
          <StatusBadge status="pending" />
        </div>
      </div>
      <ButtonLink block size="l" to={paths.myListings} variant="dark">
        {t("submitted.myListings")}
      </ButtonLink>
      <TextLink className="inline-flex items-center gap-8" to={paths.newListing}>
        <Icon name="plus" size={16} />
        {t("submitted.another")}
      </TextLink>
    </div>
  );
}
