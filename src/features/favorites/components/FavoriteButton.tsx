import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { Icon } from "../../../components/Icon";
import { paths } from "../../../lib/paths";
import { useSession } from "../../auth/hooks";
import { useFavoriteIds, useToggleFavorite } from "../hooks";

type FavoriteButtonProps = {
  listingId: number;
  // The listing's title, to name the button.
  title: string;
};

const buttonClass =
  "flex size-40 cursor-pointer items-center justify-center rounded-full bg-surface text-ink ring-1 ring-line ring-inset hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

// A heart that keeps a listing in the buyer's favourites. Visitors are sent
// to log in first. Other roles have no favourites, so they see no heart.
export function FavoriteButton({ listingId, title }: FavoriteButtonProps) {
  const { t } = useTranslation("listings");
  const { pathname, search } = useLocation();
  const { user, isPending } = useSession();
  const isBuyer = user?.role === "buyer";
  const favorites = useFavoriteIds(isBuyer);
  const toggle = useToggleFavorite();

  if (isPending || (user && !isBuyer)) {
    return null;
  }

  if (!user) {
    return (
      <Link
        aria-label={t("explore.card.loginToSave", { title })}
        className={buttonClass}
        state={{ from: `${pathname}${search}` }}
        to={paths.login}
      >
        <Icon name="heart" size={18} />
      </Link>
    );
  }

  const saved = favorites.data?.has(listingId) ?? false;
  return (
    <button
      aria-label={t("explore.card.save", { title })}
      aria-pressed={saved}
      className={buttonClass}
      disabled={!favorites.data}
      onClick={() => toggle.mutate({ listingId, favorite: !saved })}
      type="button"
    >
      <Icon className={saved ? "fill-current text-danger" : ""} name="heart" size={18} />
    </button>
  );
}
