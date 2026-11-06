import { useEffect, useRef } from "react";

// Opens and closes a native dialog as a modal. The browser then traps focus,
// closes it on Escape and returns focus to the element that opened it.
export const useModalDialog = (isOpen: boolean) => {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (isOpen && !element?.open) {
      element?.showModal();
    } else if (!isOpen && element?.open) {
      element.close();
    }
  }, [isOpen]);

  return dialog;
};
