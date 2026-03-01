import { useRef, useState, useEffect } from 'react';
import { useInView } from 'framer-motion';

interface Props {
  /** Target number to count up to. */
  value: number;
  /** Character(s) appended after the number (e.g. "+", "%", "M"). */
  suffix?: string;
  /** Descriptive label rendered below the number. */
  label?: string;
  /** Animation duration in milliseconds. */
  duration?: number;
}

/**
 * Counter animation component.
 *
 * Animates from 0 to the target number using an eased-out cubic
 * curve when the element scrolls into view. Fires once.
 *
 * Renders inside a glass-card with corner brackets to match the
 * site's construction-document aesthetic.
 */
export default function AnimatedStat({
  value: target,
  suffix = '',
  label,
  duration = 2000,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let start: number | null = null;
    let rafId: number;

    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      // Ease-out cubic for a decelerating finish
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId);
  }, [inView, target, duration]);

  return (
    <span ref={ref} className="stat-number">
      {value}
      {suffix}
    </span>
  );
}
