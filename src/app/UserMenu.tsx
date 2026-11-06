import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import type { AuthUser } from "../features/auth/api";
import { useLogout } from "../features/auth/hooks";
import { useMenu } from "../hooks/useMenu";

type UserMenuProps = {
  user: AuthUser;
};

// The avatar in the header. Log out lives here until the account page exists.
export function UserMenu({ user }: UserMenuProps) {
  const { t } = useTranslation();
  const { open, setOpen, root } = useMenu();
  const logout = useLogout();
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  return (
    <div className="relative shrink-0" ref={root}>
      <button
        aria-expanded={open}
        aria-label={t("nav.account")}
        className="flex size-40 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-brand-soft type-label-m text-brand-ink uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {user.imageUrl ? (
          <img alt="" className="size-40 object-cover" src={user.imageUrl} />
        ) : (
          initials
        )}
      </button>
      {open && (
        <div className="absolute inset-e-0 top-full z-10 mt-8 flex min-w-max flex-col gap-4 rounded-md bg-surface p-4 shadow-elevation-2">
          <p className="px-12 py-8 type-label-m text-ink">
            {user.firstName} {user.lastName}
          </p>
          <button
            aria-busy={logout.isPending}
            className="flex min-h-control-s w-full cursor-pointer items-center gap-8 rounded-sm px-12 text-start type-label-m text-danger hover:bg-paper focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-not-allowed"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
            type="button"
          >
            <Icon name="logout" size={16} />
            {t("nav.logOut")}
          </button>
          {logout.isError && (
            <p className="px-12 py-4 type-body-xs text-danger" role="alert">
              {t("errors.unexpected")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
