import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import type { ListingDetail } from "../api";

type SellerCardProps = {
  seller: NonNullable<ListingDetail["user"]>;
};

export function SellerCard({ seller }: SellerCardProps) {
  const { t } = useTranslation(["listings", "enums"]);
  const initials = `${seller.firstName.charAt(0)}${seller.lastName.charAt(0)}`.toUpperCase();

  return (
    <section className="flex flex-col gap-12 rounded-xl border border-line bg-surface p-20">
      <h2 className="type-overline text-muted">{t("listing.seller")}</h2>
      <div className="flex items-center gap-12">
        <span
          aria-hidden="true"
          className="flex size-control-m shrink-0 items-center justify-center rounded-full bg-brand-soft type-label-m text-brand-ink"
        >
          {initials}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="flex items-center gap-4 type-label-l text-ink">
            <span dir="auto">{`${seller.firstName} ${seller.lastName}`}</span>
            {seller.isVerified && (
              <span className="text-brand" title={t("listing.verified")}>
                <Icon name="shield" size={14} />
                <span className="sr-only">{t("listing.verified")}</span>
              </span>
            )}
          </p>
          <p className="type-body-xs text-muted">
            {[
              t("listing.privateSeller"),
              seller.city && t(`enums:city.${seller.city.slug}`, { defaultValue: seller.city.name }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
    </section>
  );
}
