'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Fokus-Management für modale Dialoge/Sheets (WAI-ARIA APG "Dialog (Modal)"):
 * - setzt den Fokus beim Öffnen auf das erste fokussierbare Element im Dialog
 * - hält Tab/Shift+Tab innerhalb des Dialogs (Fokus-Falle)
 * - schliesst mit Escape
 * - stellt den Fokus beim Schliessen auf das auslösende Element zurück
 *
 * `active` steuert, ob die Falle aktiv ist (z.B. an ein `open`-Flag koppeln,
 * damit der Hook auch in immer gemounteten Komponenten funktioniert).
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  active: boolean,
  onClose: () => void,
) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    const focusFirst = () => {
      const first = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? container)?.focus();
    };
    // Kleines Delay: Sheet-Inhalt muss erst gerendert/gemountet sein
    const focusTimer = setTimeout(focusFirst, 10);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !container) return;
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && activeEl === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown, true);
      previouslyFocused.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return containerRef;
}
