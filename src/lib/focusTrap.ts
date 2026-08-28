const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0
  );
}

export function trapFocus(container: HTMLElement, onEscape?: () => void): () => void {
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  const focusFirst = () => {
    const focusable = getFocusableElements(container);
    (focusable[0] ?? container).focus();
  };

  queueMicrotask(focusFirst);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onEscape?.();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKeyDown);

  return () => {
    container.removeEventListener("keydown", onKeyDown);
    previousFocus?.focus();
  };
}
