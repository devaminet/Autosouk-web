import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { ButtonLink } from "../../../components/ButtonLink";
import { Icon } from "../../../components/Icon";
import { SelectField } from "../../../components/SelectField";
import { formatNumber } from "../../../lib/format";
import { paths } from "../../../lib/paths";
import { useSession } from "../../auth/hooks";
import { useSavedCarsInCity } from "../../favorites/hooks";
import { useRequestInspection } from "../../inspections/hooks";
import type { PublicMechanic } from "../api";
import { ShareButton } from "./ShareButton";

type InspectionCardProps = {
  mechanic: PublicMechanic;
  // The city's name, translated.
  city: string;
};

const linkClass =
  "rounded-xs type-label-m text-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// The price, and the ways to reach the garage: an inspection request for
// buyers, a call and a share for everyone.
export function InspectionCard({ mechanic, city }: InspectionCardProps) {
  const { t } = useTranslation(["mechanics", "listings"]);
  const { user } = useSession();
  const location = useLocation();
  const isBuyer = user?.role === "buyer";
  const isOwner = user?.id === mechanic.userId;
  const cars = useSavedCarsInCity(mechanic.cityId, isBuyer && mechanic.isActive);
  const send = useRequestInspection();
  const [chosenId, setChosenId] = useState("");
  // The latest saved car is chosen until the buyer picks another.
  const chosen = cars.data?.find(({ carId }) => String(carId) === chosenId) ?? cars.data?.[0];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (chosen) {
      send.mutate({ carId: chosen.carId, mechanicId: mechanic.id });
    }
  };

  const request = () => {
    if (isOwner) {
      return (
        <ButtonLink block size="l" to={paths.workshop} variant="dark">
          <Icon name="pencil" size={18} />
          {t("profile.editWorkshop")}
        </ButtonLink>
      );
    }
    if (!mechanic.isActive || (user && !isBuyer)) {
      return null;
    }
    if (!user) {
      return (
        <ButtonLink
          block
          size="l"
          state={{ from: `${location.pathname}${location.search}` }}
          to={paths.login}
          variant="primary"
        >
          <Icon name="shield" size={18} />
          {t("profile.loginToRequest")}
        </ButtonLink>
      );
    }
    if (send.isSuccess && chosen) {
      return (
        <output className="block">
          <Alert title={t("profile.requestSent")} tone="success">
            {t("profile.requestSentDescription", { car: chosen.title })}
          </Alert>
        </output>
      );
    }
    if (cars.error) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{cars.error.message}</Alert>
          <Button onClick={() => void cars.refetch()} size="s">
            {t("profile.retry")}
          </Button>
        </div>
      );
    }
    if (!cars.data) {
      return <output className="block type-body-s text-muted">{t("common:loading")}</output>;
    }
    if (cars.data.length === 0) {
      return (
        <p className="flex flex-col gap-8 rounded-xl bg-paper p-16 type-body-s text-ink-2">
          {t("profile.noSavedCar", { city })}
          <Link className={linkClass} to={paths.search}>
            {t("profile.findCar")}
          </Link>
        </p>
      );
    }
    return (
      <form className="flex flex-col gap-16" noValidate onSubmit={submit}>
        <SelectField
          disabled={send.isPending}
          icon="car"
          label={t("profile.carToInspect")}
          onChange={(event) => {
            setChosenId(event.target.value);
            send.reset();
          }}
          value={chosen ? String(chosen.carId) : ""}
        >
          {cars.data.map(({ carId, title, year }) => (
            <option key={carId} value={carId}>
              {title} · {year}
            </option>
          ))}
        </SelectField>
        {send.error && (
          <div role="alert">
            <Alert tone="danger">{send.error.message}</Alert>
          </div>
        )}
        <Button block isPending={send.isPending} size="l" type="submit" variant="primary">
          <Icon name="shield" size={18} />
          {t("profile.requestInspection")}
        </Button>
      </form>
    );
  };

  return (
    <section
      aria-label={t("profile.inspectionCard")}
      className="flex flex-col gap-20 rounded-2xl bg-surface p-24 shadow-elevation-2"
    >
      <p className="flex flex-wrap items-baseline justify-between gap-8">
        {mechanic.inspectionPrice === null ? (
          <span className="type-h4 text-ink">{t("rankings.priceAtGarage")}</span>
        ) : (
          <span>
            <bdi className="type-display-m text-ink" dir="ltr">
              {formatNumber(mechanic.inspectionPrice)}
            </bdi>{" "}
            <span className="type-mono-s text-muted">{t("listings:units.mad")}</span>
          </span>
        )}
        <span className="type-body-s text-muted">{t("profile.perInspection")}</span>
      </p>
      {request()}
      <div className="flex items-center gap-12">
        {mechanic.phone && (
          <a
            className="inline-flex min-h-control-m flex-1 items-center justify-center gap-8 rounded-full bg-surface px-16 type-label-m text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            href={`tel:${mechanic.phone.replace(/[^\d+]/gu, "")}`}
          >
            <Icon name="phone" size={18} />
            <span className="sr-only">{t("profile.call")} </span>
            <bdi dir="ltr">{mechanic.phone}</bdi>
          </a>
        )}
        <ShareButton title={mechanic.name} />
      </div>
    </section>
  );
}
