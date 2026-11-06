import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { useModalDialog } from "../../../../hooks/useModalDialog";
import { SearchFilters } from "./SearchFilters";

type FiltersSheetProps = {
  open: boolean;
  onClose: () => void;
} & Omit<ComponentProps<typeof SearchFilters>, "compact" | "onClose">;

// The filters in a sheet from the bottom, on screens too narrow for the sidebar.
export function FiltersSheet({ open, onClose, ...filters }: FiltersSheetProps) {
  const { t } = useTranslation("listings");
  const dialog = useModalDialog(open);

  return (
    <dialog
      aria-label={t("search.filters.title")}
      className="mt-auto mb-0 max-h-dvh w-full max-w-none rounded-t-2xl bg-paper p-20 text-ink shadow-overlay backdrop:bg-night/50 md:m-auto md:max-w-auth-wide md:rounded-2xl"
      onClose={onClose}
      ref={dialog}
    >
      {/* Mounted only while open, so each opening starts from the search. */}
      {open && <SearchFilters {...filters} compact onClose={onClose} />}
    </dialog>
  );
}
