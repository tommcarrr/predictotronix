'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  initialIndex: number;
}

export function GameweekCarousel({ children, initialIndex }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = scroller.current?.children.item(initialIndex) as HTMLElement | null;
    target?.scrollIntoView({ block: 'nearest', inline: 'start' });
  }, [initialIndex]);

  return (
    <div ref={scroller} className="participant-gameweeks" aria-label="Gameweeks">
      {children}
    </div>
  );
}
