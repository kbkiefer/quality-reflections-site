import { useEffect, useRef } from 'react';

/**
 * Curtain Wall Grid Reveal
 *
 * As the cursor moves, it reveals the architectural mullion framework
 * hidden beneath the website surface — like looking through a glass
 * curtain wall facade.
 *
 * Layers:
 *  1. Mullion grid with connection nodes at intersections
 *  2. Soft panel reflection (light on glass between mullions)
 *  3. Construction-document crosshair / reticle
 *
 * Pure CSS with custom properties — no Framer Motion needed.
 * CSS for this component lives in global.css.
 */
export default function GlassCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Hide on touch devices — no cursor to follow
    if (window.matchMedia('(hover: none)').matches) return;

    let rafId: number;

    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.setProperty('--cx', `${e.clientX}px`);
        el.style.setProperty('--cy', `${e.clientY}px`);
        el.style.opacity = '1';
      });
    };

    const handleLeave = () => {
      el.style.opacity = '0';
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <div className="glass-cursor" ref={ref} aria-hidden="true">
      {/* Layer 1 — Curtain wall mullion grid */}
      <div className="glass-cursor__mullions" />

      {/* Layer 2 — Glass panel reflection */}
      <div className="glass-cursor__reflection" />

      {/* Layer 3 — Construction reticle */}
      <div className="glass-cursor__reticle" />
    </div>
  );
}
