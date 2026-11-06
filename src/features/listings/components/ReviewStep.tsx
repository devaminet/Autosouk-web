import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { formatNumber } from "../../../lib/format";
import { draftStepPath } from "../../../lib/paths";
import type { ListingCar, ListingDetail, Lookups } from "../api";
import { MediaChecks } from "./MediaChecks";
import { ListingCarPreview } from "./ListingCarPreview";
import { ReviewSection } from "./ReviewSection";
import { WizardCard } from "./WizardCard";
import { WizardStepForm } from "./WizardStepForm";

const shownMedia = 6;

type ReviewStepProps = {
  listing: ListingDetail;
  car: ListingCar;
  lookups: Lookups;
  isPending: boolean;
  error: Error | null;
  onSubmit: () => void;
};

export function ReviewStep({ listing, car, lookups, isPending, error, onSubmit }: ReviewStepProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const slugOf = (items: { id: number; slug: string }[], id: number) =>
    items.find((item) => item.id === id)?.slug;
  const fuel = slugOf(lookups.carburants, car.carburantId);
  const origin = slugOf(lookups.origins, car.originId);
  const condition = slugOf(lookups.states, car.stateId);
  const number = (value: number | string, unit?: string) => (
    <>
      <bdi dir="ltr">{formatNumber(Number(value))}</bdi>
      {unit && ` ${unit}`}
    </>
  );
  const facts = [
    { label: t("review.makeModel"), value: <span dir="auto">{`${car.make.name} ${car.model.name}`}</span> },
    { label: t("carDetails.year"), value: <bdi dir="ltr">{car.year}</bdi> },
    { label: t("carDetails.price"), value: number(car.price, t("units.mad")) },
    { label: t("carDetails.mileage"), value: number(car.distance, t("units.km")) },
    { label: t("carDetails.city"), value: t(`enums:city.${car.city.slug}`, { defaultValue: car.city.name }) },
    { label: t("carDetails.fuel"), value: fuel ? t(`enums:carburant.${fuel}`) : "—" },
    { label: t("carDetails.transmission"), value: t(`enums:transmission.${car.transmission}`) },
    { label: t("carDetails.doors"), value: <bdi dir="ltr">{car.doorsNumber}</bdi> },
    { label: t("carDetails.fiscalPower"), value: number(car.fiscalPower, t("units.cv")) },
    { label: t("carDetails.owners"), value: <bdi dir="ltr">{car.ownersCount}</bdi> },
    { label: t("carDetails.origin"), value: origin ? t(`enums:car_origin.${origin}`) : "—" },
    { label: t("carDetails.condition"), value: condition ? t(`enums:car_state.${condition}`) : "—" },
    { label: t("equipment.title"), value: <bdi dir="ltr">{car.equipment.length}</bdi> },
  ];
  const media = car.carMedias;
  const photos = media.filter(({ type }) => type === "image").length;
  const hasCover = media.some(({ isPrimary, type }) => isPrimary && type === "image");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <WizardStepForm
      aside={<ListingCarPreview car={car} />}
      back={
        <ButtonLink size="l" to={draftStepPath(listing.id, "photos")}>
          <Icon name="arrow-left" size={18} />
          {t("carDetails.back")}
        </ButtonLink>
      }
      onSubmit={submit}
      submit={
        <Button block className="md:w-auto" isPending={isPending} size="l" type="submit" variant="primary">
          {t("review.submit")}
          <Icon name="arrow-right" size={18} />
        </Button>
      }
    >
      <WizardCard description={t("review.description")} headingLevel={1} title={t("review.title")}>
        {error && (
          <div role="alert">
            <Alert tone="danger">{error.message}</Alert>
          </div>
        )}
        <ReviewSection editTo={draftStepPath(listing.id, "listing")} title={t("wizard.steps.listing")}>
          <p className="type-h5 text-ink" dir="auto">
            {listing.title}
          </p>
          <p className="type-body-m whitespace-pre-line text-ink-2" dir="auto">
            {listing.description}
          </p>
        </ReviewSection>
        <ReviewSection editTo={draftStepPath(listing.id, "car")} title={t("wizard.steps.car")}>
          <dl className="grid grid-cols-1 gap-x-24 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {facts.map(({ label, value }) => (
              <div className="flex flex-col gap-2" key={label}>
                <dt className="type-body-xs text-muted">{label}</dt>
                <dd className="type-label-m text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </ReviewSection>
        <ReviewSection editTo={draftStepPath(listing.id, "photos")} title={t("photos.title")}>
          <MediaChecks files={media.length} hasCover={hasCover} photos={photos} />
          {media.length > 0 && (
            <ul className="grid grid-cols-3 gap-8 sm:grid-cols-6">
              {media.slice(0, shownMedia).map((item, index) => (
                <li className="aspect-4/3 overflow-hidden rounded-md bg-night" key={item.id}>
                  {item.type === "image" ? (
                    <img
                      alt={t("photos.photo", { number: index + 1 })}
                      className="size-full object-cover"
                      loading="lazy"
                      src={item.link}
                    />
                  ) : (
                    <video
                      aria-label={t("photos.video", { number: index + 1 })}
                      className="size-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                      src={item.link}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </ReviewSection>
        <Alert tone="info">{t("review.note")}</Alert>
      </WizardCard>
    </WizardStepForm>
  );
}
