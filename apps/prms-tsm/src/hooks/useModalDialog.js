import { useEffect, useRef } from "react";

/**
 * Keeps modal behaviour consistent across the staff portal.
 * The hook only owns focus and keyboard interaction; business actions stay
 * in the page or feature component that opens the dialog.
 */
export function useModalDialog({ isOpen = true, isBusy = false, onClose }) {
  const dialogRef = useRef(null);
  const focusBeforeOpenRef = useRef(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(isBusy);

  closeRef.current = onClose;
  busyRef.current = isBusy;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    focusBeforeOpenRef.current = document.activeElement;

    const frameId = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    function handleKeyDown(event) {
      if (event.key !== "Escape" || busyRef.current) {
        return;
      }

      event.preventDefault();
      closeRef.current?.();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      focusBeforeOpenRef.current?.focus?.();
      focusBeforeOpenRef.current = null;
    };
  }, [isOpen]);

  return dialogRef;
}
