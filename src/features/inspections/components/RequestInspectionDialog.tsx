import { useId, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import carImage from "../../../assets/car.svg";
import { Alert } from "../../../components/Alert";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { useModalDialog } from "../../../hooks/useModalDialog";
import { formatNumber } from "../../../lib/format";
import { getLocale } from "../../../lib/i18n";
import type { Locale } from "../../../lib/locale";
import type { ListingCar } from "../../listings/api";
import { useCityGarages, useRequestInspection } from "../hooks";
import { GarageOption } from "./GarageOption";
import { ReportLanguageField } from "./ReportLanguageField";

type RequestInspectionDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  car: ListingCar;
};

// What every inspection covers, as in the report.
const included = ["identity", "mileage", "papers", "checklist", "roadTest", "pdf"] as const;

const closeClass =
  "flex size-40 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-brand ring-1 ring-line ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// Asks a garage in the car's city to inspect it. Full screen on small screens,
// a centred modal on wide ones.
export function RequestInspectionDialog({ open, onClose, title, car }: RequestInspectionDialogProps) {
  const { t } = useTranslation(["inspections", "listings", "enums"]);
  const dialog = useModalDialog(open);
  const titleId = useId();
  const garages = useCityGarages(car.cityId, open);
  const send = useRequestInspection();
  const [chosenId, setChosenId] = useState<number | null>(null);
  // The interface's language until the buyer picks another.
  const [reportLanguage, setReportLanguage] = useState<Locale | null>(null);
  const city = t(`enums:city.${car.city.slug}`, { defaultValue: car.city.name });
  // The best rated garage is chosen until the buyer picks another.
  const chosen = garages.data?.find(({ mechanicId }) => mechanicId === chosenId) ?? garages.data?.[0];
  const image = car.carMedias.find(({ type }) => type === "image");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (chosen) {
      send.mutate({ carId: car.id, mechanicId: chosen.mechanicId, reportLanguage: reportLanguage ?? getLocale() });
    }
  };

  const close = () => {
    onClose();
    send.reset();
    setChosenId(null);
    setReportLanguage(null);
  };

  const garageList = () => {
    if (garages.error) {
      return (
        <div className="flex flex-col items-start gap-12" role="alert">
          <Alert tone="danger">{garages.error.message}</Alert>
          <Button onClick={() => void garages.refetch()}>{t("listings:explore.results.retry")}</Button>
        </div>
      );
    }
    if (!garages.data) {
      return <output className="block type-body-m text-muted">{t("common:loading")}</output>;
    }
    if (garages.data.length === 0) {
      return <Alert tone="info">{t("request.noGarage", { city })}</Alert>;
    }
    return (
      <div className="flex flex-col gap-12">
        {garages.data.map((garage) => (
          <GarageOption
            checked={garage.mechanicId === chosen?.mechanicId}
            city={city}
            garage={garage}
            key={garage.mechanicId}
            name={titleId}
            onChoose={() => setChosenId(garage.mechanicId)}
          />
        ))}
      </div>
    );
  };

  return (
    <dialog
      aria-labelledby={titleId}
      className="m-0 h-dvh max-h-dvh w-full max-w-none bg-surface text-ink shadow-overlay backdrop:bg-night/50 open:flex open:flex-col md:m-auto md:h-fit md:max-h-dialog md:max-w-dialog md:rounded-2xl"
      onCancel={(event) => {
        // The request can't be called back, so stay open until it finishes.
        if (send.isPending) {
          event.preventDefault();
        }
      }}
      onClose={close}
      ref={dialog}
    >
      {open && (
        <>
          <header className="flex items-start gap-12 border-b border-line px-20 py-20 md:px-24">
            <div className="flex flex-1 flex-col gap-4">
              <p className="type-overline text-brand">{t("request.overline")}</p>
              <h2 className="type-h3 text-ink" id={titleId}>
                {t("request.title")}
              </h2>
            </div>
            <button aria-label={t("request.close")} className={closeClass} disabled={send.isPending} onClick={close} type="button">
              <Icon name="x" size={18} />
            </button>
          </header>
          {send.isSuccess && chosen ? (
            <output className="flex flex-1 flex-col items-center justify-center gap-16 px-20 py-48 text-center md:px-24">
              <span className="flex size-64 items-center justify-center rounded-full bg-success-soft text-success">
                <Icon name="check-circle" size={32} />
              </span>
              <p className="type-h4 text-ink">{t("request.sent")}</p>
              <p className="max-w-auth type-body-m text-muted">
                {t("request.sentDescription", { garage: chosen.name })}
              </p>
              <Button onClick={close} size="l" variant="dark">
                {t("request.done")}
              </Button>
            </output>
          ) : (
            <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={submit}>
              <div className="flex flex-1 flex-col gap-20 overflow-y-auto px-20 py-24 md:px-24">
                <div className="flex items-center gap-16 rounded-xl bg-paper p-12">
                  <span className="size-64 shrink-0 overflow-hidden rounded-lg bg-linear-to-br from-brand to-brand-ink">
                    <img alt="" className={image ? "size-full object-cover" : "size-full object-contain p-8"} src={image?.link ?? carImage} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <p className="truncate type-h5 text-ink" dir="auto">
                      {title}
                    </p>
                    <p className="type-body-s text-muted">
                      <bdi dir="ltr">{car.year}</bdi> · {city}
                    </p>
                  </div>
                  <p className="hidden whitespace-nowrap sm:block">
                    <bdi className="type-price-m text-ink" dir="ltr">
                      {formatNumber(car.price)}
                    </bdi>{" "}
                    <span className="type-mono-s text-muted">{t("listings:units.mad")}</span>
                  </p>
                </div>
                <ReportLanguageField onChange={setReportLanguage} value={reportLanguage ?? getLocale()} />
                <fieldset className="flex flex-col gap-12">
                  <legend className="pb-12 type-label-m text-ink">{t("request.chooseGarage", { city })}</legend>
                  {garageList()}
                </fieldset>
                <div className="flex flex-col gap-8">
                  <p className="sr-only">{t("request.includedLabel")}</p>
                  <ul className="flex flex-wrap gap-8">
                    {included.map((item) => (
                      <li className="rounded-full bg-paper px-8 py-4 type-label-s text-ink-2 ring-1 ring-line ring-inset" key={item}>
                        {t(`request.included.${item}`)}
                      </li>
                    ))}
                  </ul>
                </div>
                <Alert tone="info">{t("request.oneActive")}</Alert>
                {send.error && (
                  <div role="alert">
                    <Alert tone="danger">{send.error.message}</Alert>
                  </div>
                )}
              </div>
              <footer className="flex flex-wrap items-center justify-between gap-16 border-t border-line bg-surface-2 px-20 py-16 md:px-24">
                <p className="flex flex-col">
                  <span className="type-label-s text-muted">{t("request.total")}</span>
                  {chosen && chosen.inspectionPrice !== null ? (
                    <span>
                      <bdi className="type-price-m text-ink" dir="ltr">
                        {formatNumber(chosen.inspectionPrice)}
                      </bdi>{" "}
                      <span className="type-mono-s text-muted">{t("listings:units.mad")}</span>
                    </span>
                  ) : (
                    <span className="type-body-m text-ink">{t("request.priceAtGarage")}</span>
                  )}
                </p>
                <Button disabled={!chosen} isPending={send.isPending} size="l" type="submit" variant="primary">
                  {t("request.send")}
                  <Icon name="arrow-right" size={18} />
                </Button>
              </footer>
            </form>
          )}
        </>
      )}
    </dialog>
  );
}
