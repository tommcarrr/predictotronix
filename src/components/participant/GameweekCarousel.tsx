'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  initialIndex: number;
}

export function GameweekCarousel({ children, initialIndex }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateControls = useCallback(() => {
    const element = scroller.current;
    if (!element) return;

    setCanScrollBack(element.scrollLeft > 1);
    setCanScrollForward(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const element = scroller.current;
    const target = element?.children.item(initialIndex) as HTMLElement | null;
    if (!element || !target) return;

    element.scrollTo({ left: target.offsetLeft });
    updateControls();

    const resizeObserver = new ResizeObserver(updateControls);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [initialIndex, updateControls]);

  function scrollByGameweek(direction: -1 | 1) {
    const element = scroller.current;
    if (!element) return;

    const gameweeks = Array.from(element.children) as HTMLElement[];
    const currentIndex = gameweeks.reduce((closestIndex, gameweek, index) => {
      const closestDistance = Math.abs(gameweeks[closestIndex].offsetLeft - element.scrollLeft);
      const distance = Math.abs(gameweek.offsetLeft - element.scrollLeft);
      return distance < closestDistance ? index : closestIndex;
    }, 0);
    const targetIndex = Math.min(gameweeks.length - 1, Math.max(0, currentIndex + direction));

    element.scrollTo({ left: gameweeks[targetIndex].offsetLeft, behavior: 'smooth' });
  }

  return (
    <div className="participant-gameweek-carousel">
      <nav className="participant-gameweek-controls" aria-label="Browse gameweeks">
        <button
          type="button"
          className="participant-gameweek-control"
          onClick={() => scrollByGameweek(-1)}
          disabled={!canScrollBack}
          aria-label="Previous gameweek"
        >
          <span aria-hidden="true">←</span> Previous
        </button>
        <span className="participant-gameweek-controls__hint">Swipe to browse</span>
        <button
          type="button"
          className="participant-gameweek-control"
          onClick={() => scrollByGameweek(1)}
          disabled={!canScrollForward}
          aria-label="Next gameweek"
        >
          Next <span aria-hidden="true">→</span>
        </button>
      </nav>
      <div
        ref={scroller}
        className="participant-gameweeks"
        aria-label="Gameweeks"
        onScroll={updateControls}
      >
        {children}
      </div>
    </div>
  );
}
