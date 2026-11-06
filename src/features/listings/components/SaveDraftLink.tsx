import { useTranslation } from "react-i18next";
import { ButtonLink } from "../../../components/ButtonLink";
import { paths } from "../../../lib/paths";

// For steps that save as they go: it only leaves, with a reassuring notice.
export function SaveDraftLink() {
  const { t } = useTranslation("listings");

  return (
    <ButtonLink state={{ notice: t("newListing.saved") }} to={paths.myListings} variant="ghost">
      {t("wizard.saveDraft")}
    </ButtonLink>
  );
}
