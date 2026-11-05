import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/Badge";
import type { BadgeTone } from "../../../components/Badge";
import type { ListingStatus } from "../api";

const tones: Record<ListingStatus, BadgeTone> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  withdrawn: "info",
  rejected: "danger",
  sold: "dark",
};

type StatusBadgeProps = {
  status: ListingStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation("enums");

  return <Badge tone={tones[status]}>{t(`listing_status.${status}`)}</Badge>;
}
