import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { formatNumber } from "../../../lib/format";

type CarPreviewProps = {
  title: string;
  details: string[];
  price?: number;
  city?: string;
};

// How the listing card will look in search, with what is filled in so far.
export function CarPreview({ title, details, price, city }: CarPreviewProps) {
  const { t } = useTranslation("listings");

  return (
    <section aria-label={t("carDetails.preview")} className="flex flex-col gap-12">
      <p aria-hidden="true" className="type-overline text-muted">
        {t("carDetails.preview")}
      </p>
      <div className="flex flex-col gap-12 rounded-xl border border-line bg-surface p-8 pb-16">
        <div className="flex aspect-video items-center justify-center rounded-lg bg-night text-subtle">
          <Icon name="car" size={48} />
        </div>
        <div className="flex flex-col gap-4 px-8">
          <p className="type-h5 text-ink" dir="auto">
            {title}
          </p>
          {details.length > 0 && <p className="type-body-s text-muted">{details.join(" · ")}</p>}
          <div className="flex items-center justify-between gap-8">
            <p className="type-price-m text-ink">
              {price ? (
                <>
                  <bdi dir="ltr">{formatNumber(price)}</bdi>{" "}
                  <span className="type-mono-s text-muted">{t("units.mad")}</span>
                </>
              ) : (
                "—"
              )}
            </p>
            {city && (
              <p className="flex items-center gap-4 type-body-xs text-muted">
                <Icon name="map-pin" size={14} />
                {city}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
