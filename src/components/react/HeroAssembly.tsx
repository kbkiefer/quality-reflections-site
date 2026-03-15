import { useRef, useEffect, useState, useCallback } from 'react';

/* =============================================
   HERO ASSEMBLY — Auto-Play + 3D Rotation
   =============================================
   Curtain wall cross-section with 9 component layers.
   Auto-assembles on page load over ~4 seconds, then
   gently rotates in 3D on the hero section.
   ============================================= */

// ----- Layer metadata for the detail panel -----

interface LayerData {
  name: string;
  desc: string;
  why: string;
  specs: Record<string, string>;
}

const layerData: Record<number, LayerData> = {
  1: {
    name: 'Insulated Glass Unit',
    desc: 'Double-pane insulated unit with Low-E coating and argon gas fill. Laminated inner lite for safety, tempered outer lite for impact resistance.',
    why: 'The IGU is the performance heart of the wall. Low-E coatings reject solar heat gain while maximizing visible light. Argon fill reduces conductive heat transfer by 30% vs. air.',
    specs: { Type: '1" IGU (6mm/12mm/6mm)', Coating: 'Low-E 366', SHGC: '0.27', Finish: 'Clear / Argon Fill' },
  },
  2: {
    name: 'Perimeter Seal',
    desc: 'Continuous EPDM or silicone gasket forming the primary weather barrier between glass and frame. Dual-durometer design with soft lip and rigid base.',
    why: 'Seals are the first defense against water and air infiltration. They must accommodate glass thermal movement (\u00b13mm) while maintaining compression.',
    specs: { Type: 'EPDM 60A Shore', Width: '15mm wedge', Rating: 'AAMA 501.1', Finish: 'Black' },
  },
  3: {
    name: 'Glazing Cap',
    desc: 'Exterior pressure plates clamping glass units against gaskets. Secured with stainless steel screws at regular intervals.',
    why: 'Uniform gasket compression is critical for weather performance. Under-compressed seals leak; over-compressed seals deform.',
    specs: { Type: '6063-T6 Aluminum', Width: '52mm', Fasteners: 'M6 @ 300mm o.c.', Finish: 'Color-Matched Anodized' },
  },
  4: {
    name: 'Vertical Mullion',
    desc: 'Primary structural vertical extrusions spanning floor-to-floor. Resists wind loads in bending and transfers all gravity loads to structural anchors.',
    why: 'Mullions are the backbone of the curtain wall. Their moment of inertia determines deflection under wind load.',
    specs: { Type: '6063-T6 Aluminum', Depth: '178mm', Moment: '85 kNm', Finish: 'Class I Anodized' },
  },
  5: {
    name: 'Horizontal Rail',
    desc: 'Extruded aluminum horizontal members spanning between vertical mullions. Carries glass dead load and transfers wind loads laterally.',
    why: 'Rails include weep systems for draining infiltrated water. Pressure-equalized design prevents water from being pushed inward by wind.',
    specs: { Type: '6063-T6 Aluminum', Depth: '65mm', Moment: '45 kNm', Finish: 'Anodized Clear' },
  },
  6: {
    name: 'Thermal Break',
    desc: 'Polyamide (PA66) strips reinforced with glass fiber, inserted into the aluminum frame to interrupt the thermal path.',
    why: 'Aluminum conducts heat 1000x faster than glass. Without thermal breaks, frames become condensation magnets. Breaks improve U-value by up to 60%.',
    specs: { Type: 'PA66 + 25% Glass Fiber', Width: '24mm', Conductivity: '0.3 W/mK', Finish: 'Structural Insert' },
  },
  7: {
    name: 'Interior Seal',
    desc: 'Secondary air and vapor barrier on the interior side. Forms the warm-side seal essential for condensation resistance.',
    why: 'The interior seal completes the rain-screen principle. Without it, warm moist interior air penetrates the assembly.',
    specs: { Type: 'Silicone Gasket', Width: '12mm', Durability: 'ASTM C1193', Finish: 'Black' },
  },
  8: {
    name: 'Structural Anchor',
    desc: 'Steel L-bracket anchors connecting the curtain wall framework to the building\'s structural slab.',
    why: 'Anchors must absorb building movement, seismic loads, and thermal expansion without transferring stress to the glass.',
    specs: { Type: '316 Stainless Steel', Thickness: '8mm plate', Capacity: '12 kN dead / 8 kN live', Finish: 'Mill Finish' },
  },
  9: {
    name: 'Floor Slab',
    desc: 'Structural concrete floor slab providing the foundational support for the entire curtain wall system.',
    why: 'The slab edge condition determines anchorage capacity. Proper detailing prevents thermal bridging at the wall-to-floor junction.',
    specs: { Type: 'Reinforced Concrete', Thickness: '200mm', Strength: '40 MPa', Finish: 'Formed Edge' },
  },
};

// ----- Explosion config per layer -----

interface ExplosionConfig {
  tx: number;
  ty: number;
  s: number;
  startPct: number;
  endPct: number;
  spreadX?: number;
  spreadY?: number;
}

const explosionConfig: Record<number, ExplosionConfig> = {
  1: { tx: -90, ty: -130, s: 1.12, startPct: 8, endPct: 28 },
  2: { tx: -70, ty: -100, s: 1.09, startPct: 8, endPct: 28 },
  3: { tx: -55, ty: -150, s: 1.07, startPct: 10, endPct: 32 },
  4: { tx: -35, ty: 0, s: 1.0, startPct: 25, endPct: 45, spreadX: 50 },
  5: { tx: 0, ty: 0, s: 1.0, startPct: 25, endPct: 45, spreadY: 40 },
  6: { tx: -15, ty: 10, s: 1.0, startPct: 30, endPct: 48 },
  7: { tx: 50, ty: 60, s: 0.95, startPct: 32, endPct: 52 },
  8: { tx: 70, ty: 120, s: 0.92, startPct: 42, endPct: 60 },
  9: { tx: 90, ty: 170, s: 0.88, startPct: 45, endPct: 65 },
};

// ----- Easing & helper functions -----

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getExplosionFactor(p: number, startPct: number, endPct: number): number {
  if (p >= startPct && p <= endPct) {
    return Math.max(0, Math.min(1, (p - startPct) / (endPct - startPct)));
  }
  return p > endPct ? 1 : 0;
}

// ----- Component -----

const ASSEMBLY_DURATION = 4000; // ms to auto-assemble
const ASSEMBLY_DELAY = 800; // ms delay before starting

export default function HeroAssembly() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Map<number, SVGGElement>>(new Map());

  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const animState = useRef({
    startTime: 0,
    assembled: false,
    rotationAngle: 0,
    panelOpen: false,
  });

  useEffect(() => {
    animState.current.panelOpen = panelOpen;
  }, [panelOpen]);

  const setLayerRef = useCallback((layerNum: number, el: SVGGElement | null) => {
    if (el) layerRefs.current.set(layerNum, el);
  }, []);

  // ----- Main animation loop -----
  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    let rafId: number;

    function animate(timestamp: number) {
      const state = animState.current;
      if (state.startTime === 0) state.startTime = timestamp;

      const elapsed = timestamp - state.startTime;

      // Phase 1: Auto-assembly (starts exploded, assembles over time)
      if (elapsed < ASSEMBLY_DELAY) {
        // Waiting — show fully exploded
        const buildProgress = 100;
        container!.style.opacity = '0.6';

        layerRefs.current.forEach((layer, layerNum) => {
          const config = explosionConfig[layerNum];
          if (!config) return;
          const rawFactor = getExplosionFactor(buildProgress, config.startPct, config.endPct);
          const factor = easeInOutCubic(rawFactor);
          let tx = config.tx * factor;
          let ty = config.ty * factor;
          const s = 1 + (config.s - 1) * factor;
          if (config.spreadX) tx += config.spreadX * factor * (layerNum % 2 === 0 ? 1 : -1);
          if (config.spreadY) ty += config.spreadY * factor * (layerNum % 2 === 0 ? 1 : -1);
          layer.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
          layer.style.filter = 'none';
          layer.querySelectorAll<SVGTextElement>('.label-text').forEach((l) => {
            l.style.opacity = String(factor > 0.5 ? Math.min(1, (factor - 0.5) * 4) * 0.7 : 0);
          });
        });

        svg!.style.transform = 'rotateX(15deg) rotateY(-25deg)';
        rafId = requestAnimationFrame(animate);
        return;
      }

      const assemblyElapsed = elapsed - ASSEMBLY_DELAY;

      if (!state.assembled && assemblyElapsed < ASSEMBLY_DURATION) {
        // Assembling — progress goes from 100 (exploded) to 0 (assembled)
        const t = Math.min(1, assemblyElapsed / ASSEMBLY_DURATION);
        const easedT = easeInOutCubic(t);
        const buildProgress = 100 * (1 - easedT);

        // Fade in as it assembles
        const opacity = 0.5 + easedT * 0.3;
        container!.style.opacity = state.panelOpen ? '0.3' : String(opacity);

        layerRefs.current.forEach((layer, layerNum) => {
          const config = explosionConfig[layerNum];
          if (!config) return;
          const rawFactor = getExplosionFactor(buildProgress, config.startPct, config.endPct);
          const factor = easeInOutCubic(rawFactor);
          let tx = config.tx * factor;
          let ty = config.ty * factor;
          const s = 1 + (config.s - 1) * factor;
          if (config.spreadX) tx += config.spreadX * factor * (layerNum % 2 === 0 ? 1 : -1);
          if (config.spreadY) ty += config.spreadY * factor * (layerNum % 2 === 0 ? 1 : -1);
          layer.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;

          // Thermal break glow during assembly
          if (!layer.matches(':hover')) {
            if (layerNum === 6 && factor > 0.3) {
              const glowIntensity = Math.sin(timestamp / 800) * 0.15 + 0.15;
              layer.style.filter = `drop-shadow(0 0 6px rgba(217,160,74,${glowIntensity * factor}))`;
            } else {
              layer.style.filter = 'none';
            }
          }

          // Labels fade out as assembly progresses
          layer.querySelectorAll<SVGTextElement>('.label-text').forEach((l) => {
            if (factor > 0.5 && buildProgress >= 50) {
              l.style.opacity = String(Math.min(1, (factor - 0.5) * 4) * 0.7);
            } else {
              l.style.opacity = '0';
            }
          });
        });

        // Gentle rotation during assembly
        const rotY = -25 + easedT * 10;
        svg!.style.transform = `rotateX(15deg) rotateY(${rotY}deg)`;

        rafId = requestAnimationFrame(animate);
        return;
      }

      // Phase 2: Assembled — continuous slow 3D rotation
      if (!state.assembled) {
        state.assembled = true;
        // Snap all layers to assembled position
        layerRefs.current.forEach((layer) => {
          layer.style.transform = 'translate(0px, 0px) scale(1)';
          layer.style.filter = 'none';
          layer.querySelectorAll<SVGTextElement>('.label-text').forEach((l) => {
            l.style.opacity = '0';
          });
        });
      }

      container!.style.opacity = state.panelOpen ? '0.3' : '0.8';

      // Slow continuous rotation
      state.rotationAngle += 0.015; // ~0.9 deg/sec
      const rotY = -15 + Math.sin(state.rotationAngle) * 12;
      const rotX = 15 + Math.sin(state.rotationAngle * 0.7) * 3;
      svg!.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ----- Tooltip handlers -----
  const handleLayerEnter = useCallback(
    (layerNum: number, e: React.MouseEvent) => {
      if (panelOpen) return;
      const tip = tooltipRef.current;
      if (!tip) return;
      const data = layerData[layerNum];
      if (!data) return;
      tip.textContent = data.name;
      tip.classList.add('visible');
      tip.style.left = `${e.clientX + 14}px`;
      tip.style.top = `${e.clientY - 30}px`;
    },
    [panelOpen]
  );

  const handleLayerMove = useCallback((e: React.MouseEvent) => {
    const tip = tooltipRef.current;
    if (!tip) return;
    tip.style.left = `${e.clientX + 14}px`;
    tip.style.top = `${e.clientY - 30}px`;
  }, []);

  const handleLayerLeave = useCallback(() => {
    const tip = tooltipRef.current;
    if (tip) tip.classList.remove('visible');
  }, []);

  // ----- Panel open/close -----
  const openPanel = useCallback((layerNum: number) => {
    setActiveLayer(layerNum);
    setPanelOpen(true);
    const tip = tooltipRef.current;
    if (tip) tip.classList.remove('visible');
    layerRefs.current.forEach((layer, num) => {
      if (num === layerNum) {
        layer.style.opacity = '0.6';
        layer.style.filter = 'drop-shadow(0 0 16px rgba(74,144,217,0.6))';
      } else {
        layer.style.opacity = '0.03';
      }
    });
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setActiveLayer(null);
    layerRefs.current.forEach((layer) => {
      layer.style.opacity = '';
      layer.style.filter = '';
    });
  }, []);

  // ----- Keyboard escape to close panel -----
  useEffect(() => {
    if (!panelOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [panelOpen, closePanel]);

  // ----- Click outside to close panel -----
  useEffect(() => {
    if (!panelOpen) return;
    const handleClick = (e: MouseEvent) => {
      const panel = document.getElementById('assembly-detail-panel');
      if (panel && !panel.contains(e.target as Node)) closePanel();
    };
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [panelOpen, closePanel]);

  const activeMeta = activeLayer ? layerData[activeLayer] : null;

  return (
    <>
      <div ref={tooltipRef} id="assembly-tooltip" aria-hidden="true" />

      <div ref={containerRef} id="assembly-container">
        <svg
          ref={svgRef}
          viewBox="0 0 800 700"
          xmlns="http://www.w3.org/2000/svg"
          id="assembly-svg"
        >
          {/* ====== Layer 9: Floor Slab ====== */}
          <g ref={(el) => setLayerRef(9, el)} className="component-group" data-layer="9"
            onMouseEnter={(e) => handleLayerEnter(9, e)} onMouseMove={handleLayerMove}
            onMouseLeave={handleLayerLeave} onClick={(e) => { e.stopPropagation(); openPanel(9); }}>
            <rect x="80" y="520" width="580" height="60" fill="rgba(138,145,154,0.18)" stroke="rgba(138,145,154,1)" strokeWidth="1.8" />
            <polygon points="80,520 120,490 700,490 660,520" fill="rgba(138,145,154,0.09)" stroke="rgba(138,145,154,0.75)" strokeWidth="1.26" />
            <polygon points="660,520 700,490 700,550 660,580" fill="rgba(138,145,154,0.12)" stroke="rgba(138,145,154,0.6)" strokeWidth="1.26" />
            <line x1="120" y1="535" x2="200" y2="555" stroke="rgba(138,145,154,0.36)" strokeWidth="0.9" />
            <line x1="180" y1="525" x2="260" y2="560" stroke="rgba(138,145,154,0.36)" strokeWidth="0.9" />
            <line x1="280" y1="525" x2="360" y2="560" stroke="rgba(138,145,154,0.36)" strokeWidth="0.9" />
            <line x1="380" y1="525" x2="460" y2="560" stroke="rgba(138,145,154,0.36)" strokeWidth="0.9" />
            <line x1="480" y1="525" x2="560" y2="560" stroke="rgba(138,145,154,0.36)" strokeWidth="0.9" />
            <line x1="140" y1="560" x2="220" y2="530" stroke="rgba(138,145,154,0.24)" strokeWidth="0.9" />
            <line x1="300" y1="560" x2="380" y2="530" stroke="rgba(138,145,154,0.24)" strokeWidth="0.9" />
            <line x1="460" y1="560" x2="540" y2="530" stroke="rgba(138,145,154,0.24)" strokeWidth="0.9" />
            <text className="label-text" x="370" y="600" textAnchor="middle" fill="#8A919A" fontSize="10" fontFamily="'JetBrains Mono', monospace">FLOOR SLAB</text>
          </g>

          {/* ====== Layer 8: Structural Anchor ====== */}
          <g ref={(el) => setLayerRef(8, el)} className="component-group" data-layer="8"
            onMouseEnter={(e) => handleLayerEnter(8, e)} onMouseMove={handleLayerMove}
            onMouseLeave={handleLayerLeave} onClick={(e) => { e.stopPropagation(); openPanel(8); }}>
            <polygon points="160,470 160,510 180,510 180,485 210,485 210,470" fill="rgba(138,145,154,0.15)" stroke="rgba(138,145,154,1)" strokeWidth="1.8" />
            <polygon points="160,470 175,458 225,458 210,470" fill="rgba(138,145,154,0.09)" stroke="rgba(138,145,154,0.75)" strokeWidth="1.26" />
            <circle cx="190" cy="478" r="4" fill="none" stroke="rgba(138,145,154,0.9)" strokeWidth="1.44" />
            <circle cx="175" cy="500" r="3" fill="none" stroke="rgba(138,145,154,0.75)" strokeWidth="1.26" />
            <polygon points="480,470 480,510 500,510 500,485 530,485 530,470" fill="rgba(138,145,154,0.15)" stroke="rgba(138,145,154,1)" strokeWidth="1.8" />
            <polygon points="480,470 495,458 545,458 530,470" fill="rgba(138,145,154,0.09)" stroke="rgba(138,145,154,0.75)" strokeWidth="1.26" />
            <circle cx="510" cy="478" r="4" fill="none" stroke="rgba(138,145,154,0.9)" strokeWidth="1.44" />
            <circle cx="495" cy="500" r="3" fill="none" stroke="rgba(138,145,154,0.75)" strokeWidth="1.26" />
            <polygon points="320,470 320,510 340,510 340,485 370,485 370,470" fill="rgba(138,145,154,0.15)" stroke="rgba(138,145,154,1)" strokeWidth="1.8" />
            <polygon points="320,470 335,458 385,458 370,470" fill="rgba(138,145,154,0.09)" stroke="rgba(138,145,154,0.75)" strokeWidth="1.26" />
            <circle cx="350" cy="478" r="4" fill="none" stroke="rgba(138,145,154,0.9)" strokeWidth="1.44" />
            <text className="label-text" x="370" y="525" textAnchor="middle" fill="#8A919A" fontSize="10" fontFamily="'JetBrains Mono', monospace">STRUCTURAL ANCHOR</text>
          </g>

          {/* ====== Layer 7: Interior Seal ====== */}
          <g ref={(el) => setLayerRef(7, el)} className="component-group" data-layer="7"
            onMouseEnter={(e) => handleLayerEnter(7, e)} onMouseMove={handleLayerMove}
            onMouseLeave={handleLayerLeave} onClick={(e) => { e.stopPropagation(); openPanel(7); }}>
            <line x1="180" y1="130" x2="180" y2="430" stroke="rgba(138,145,154,0.6)" strokeWidth="2.7" strokeDasharray="6,4" />
            <line x1="380" y1="130" x2="380" y2="430" stroke="rgba(138,145,154,0.6)" strokeWidth="2.7" strokeDasharray="6,4" />
            <line x1="560" y1="130" x2="560" y2="430" stroke="rgba(138,145,154,0.6)" strokeWidth="2.7" strokeDasharray="6,4" />
            <line x1="180" y1="130" x2="560" y2="130" stroke="rgba(138,145,154,0.6)" strokeWidth="2.7" strokeDasharray="6,4" />
            <line x1="180" y1="280" x2="560" y2="280" stroke="rgba(138,145,154,0.6)" strokeWidth="2.7" strokeDasharray="6,4" />
            <line x1="180" y1="430" x2="560" y2="430" stroke="rgba(138,145,154,0.6)" strokeWidth="2.7" strokeDasharray="6,4" />
            <text className="label-text" x="620" y="280" fill="#8A919A" fontSize="10" fontFamily="'JetBrains Mono', monospace">INT. SEAL</text>
          </g>

          {/* ====== Layer 6: Thermal Break ====== */}
          <g ref={(el) => setLayerRef(6, el)} className="component-group" data-layer="6"
            onMouseEnter={(e) => handleLayerEnter(6, e)} onMouseMove={handleLayerMove}
            onMouseLeave={handleLayerLeave} onClick={(e) => { e.stopPropagation(); openPanel(6); }}>
            <rect x="190" y="135" width="8" height="290" fill="rgba(217,160,74,0.12)" stroke="rgba(217,160,74,0.75)" strokeWidth="1.44" />
            <rect x="374" y="135" width="8" height="290" fill="rgba(217,160,74,0.12)" stroke="rgba(217,160,74,0.75)" strokeWidth="1.44" />
            <rect x="554" y="135" width="8" height="290" fill="rgba(217,160,74,0.12)" stroke="rgba(217,160,74,0.75)" strokeWidth="1.44" />
            <line x1="190" y1="150" x2="198" y2="158" stroke="rgba(217,160,74,0.45)" strokeWidth="0.9" />
            <line x1="190" y1="170" x2="198" y2="178" stroke="rgba(217,160,74,0.45)" strokeWidth="0.9" />
            <line x1="190" y1="190" x2="198" y2="198" stroke="rgba(217,160,74,0.45)" strokeWidth="0.9" />
            <line x1="190" y1="210" x2="198" y2="218" stroke="rgba(217,160,74,0.45)" strokeWidth="0.9" />
            <line x1="190" y1="250" x2="198" y2="258" stroke="rgba(217,160,74,0.45)" strokeWidth="0.9" />
            <line x1="190" y1="310" x2="198" y2="318" stroke="rgba(217,160,74,0.45)" strokeWidth="0.9" />
            <line x1="190" y1="350" x2="198" y2="358" stroke="rgba(217,160,74,0.45)" strokeWidth="0.9" />
            <line x1="190" y1="390" x2="198" y2="398" stroke="rgba(217,160,74,0.45)" strokeWidth="0.9" />
            <rect x="185" y="276" width="370" height="6" fill="rgba(217,160,74,0.12)" stroke="rgba(217,160,74,0.6)" strokeWidth="1.26" />
            <rect x="185" y="126" width="370" height="6" fill="rgba(217,160,74,0.12)" stroke="rgba(217,160,74,0.6)" strokeWidth="1.26" />
            <text className="label-text" x="620" y="210" fill="rgba(217,160,74,0.7)" fontSize="10" fontFamily="'JetBrains Mono', monospace">THERMAL BREAK</text>
          </g>

          {/* ====== Layer 5: Horizontal Rail ====== */}
          <g ref={(el) => setLayerRef(5, el)} className="component-group" data-layer="5"
            onMouseEnter={(e) => handleLayerEnter(5, e)} onMouseMove={handleLayerMove}
            onMouseLeave={handleLayerLeave} onClick={(e) => { e.stopPropagation(); openPanel(5); }}>
            <rect x="175" y="118" width="400" height="14" fill="rgba(138,145,154,0.15)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.8" />
            <polygon points="175,118 185,108 585,108 575,118" fill="rgba(138,145,154,0.09)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.26" />
            <polygon points="575,118 585,108 585,122 575,132" fill="rgba(138,145,154,0.075)" stroke="rgba(74,144,217,0.45)" strokeWidth="1.08" />
            <rect x="260" y="129" width="12" height="3" fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="0.9" />
            <rect x="420" y="129" width="12" height="3" fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="0.9" />
            <rect x="175" y="272" width="400" height="14" fill="rgba(138,145,154,0.15)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.8" />
            <polygon points="175,272 185,262 585,262 575,272" fill="rgba(138,145,154,0.09)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.26" />
            <polygon points="575,272 585,262 585,276 575,286" fill="rgba(138,145,154,0.075)" stroke="rgba(74,144,217,0.45)" strokeWidth="1.08" />
            <rect x="260" y="283" width="12" height="3" fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="0.9" />
            <rect x="420" y="283" width="12" height="3" fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="0.9" />
            <rect x="175" y="425" width="400" height="14" fill="rgba(138,145,154,0.15)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.8" />
            <polygon points="175,425 185,415 585,415 575,425" fill="rgba(138,145,154,0.09)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.26" />
            <text className="label-text" x="620" y="130" fill="#4A90D9" fontSize="10" fontFamily="'JetBrains Mono', monospace">HORIZ. RAIL</text>
          </g>

          {/* ====== Layer 4: Vertical Mullion ====== */}
          <g ref={(el) => setLayerRef(4, el)} className="component-group" data-layer="4"
            onMouseEnter={(e) => handleLayerEnter(4, e)} onMouseMove={handleLayerMove}
            onMouseLeave={handleLayerLeave} onClick={(e) => { e.stopPropagation(); openPanel(4); }}>
            <rect x="170" y="110" width="18" height="340" fill="rgba(138,145,154,0.15)" stroke="rgba(74,144,217,1)" strokeWidth="2.16" />
            <polygon points="170,110 180,98 198,98 188,110" fill="rgba(138,145,154,0.09)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.26" />
            <polygon points="188,110 198,98 198,438 188,450" fill="rgba(138,145,154,0.075)" stroke="rgba(74,144,217,0.54)" strokeWidth="1.08" />
            <line x1="192" y1="115" x2="192" y2="445" stroke="rgba(74,144,217,0.3)" strokeWidth="0.72" />
            <rect x="362" y="110" width="18" height="340" fill="rgba(138,145,154,0.15)" stroke="rgba(74,144,217,1)" strokeWidth="2.16" />
            <polygon points="362,110 372,98 390,98 380,110" fill="rgba(138,145,154,0.09)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.26" />
            <polygon points="380,110 390,98 390,438 380,450" fill="rgba(138,145,154,0.075)" stroke="rgba(74,144,217,0.54)" strokeWidth="1.08" />
            <line x1="384" y1="115" x2="384" y2="445" stroke="rgba(74,144,217,0.3)" strokeWidth="0.72" />
            <rect x="552" y="110" width="18" height="340" fill="rgba(138,145,154,0.15)" stroke="rgba(74,144,217,1)" strokeWidth="2.16" />
            <polygon points="552,110 562,98 580,98 570,110" fill="rgba(138,145,154,0.09)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.26" />
            <polygon points="570,110 580,98 580,438 570,450" fill="rgba(138,145,154,0.075)" stroke="rgba(74,144,217,0.54)" strokeWidth="1.08" />
            <line x1="574" y1="115" x2="574" y2="445" stroke="rgba(74,144,217,0.3)" strokeWidth="0.72" />
            <text className="label-text" x="130" y="280" textAnchor="end" fill="#4A90D9" fontSize="10" fontFamily="'JetBrains Mono', monospace">VERT. MULLION</text>
          </g>

          {/* ====== Layer 3: Glazing Cap ====== */}
          <g ref={(el) => setLayerRef(3, el)} className="component-group" data-layer="3"
            onMouseEnter={(e) => handleLayerEnter(3, e)} onMouseMove={handleLayerMove}
            onMouseLeave={handleLayerLeave} onClick={(e) => { e.stopPropagation(); openPanel(3); }}>
            <rect x="168" y="135" width="6" height="135" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.44" />
            <rect x="168" y="290" width="6" height="135" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.44" />
            <rect x="360" y="135" width="6" height="135" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.44" />
            <rect x="360" y="290" width="6" height="135" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.44" />
            <rect x="550" y="135" width="6" height="135" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.44" />
            <rect x="550" y="290" width="6" height="135" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.44" />
            <circle cx="171" cy="170" r="1.5" fill="rgba(74,144,217,0.6)" />
            <circle cx="171" cy="220" r="1.5" fill="rgba(74,144,217,0.6)" />
            <circle cx="171" cy="330" r="1.5" fill="rgba(74,144,217,0.6)" />
            <circle cx="171" cy="380" r="1.5" fill="rgba(74,144,217,0.6)" />
            <circle cx="363" cy="170" r="1.5" fill="rgba(74,144,217,0.6)" />
            <circle cx="363" cy="330" r="1.5" fill="rgba(74,144,217,0.6)" />
            <circle cx="553" cy="170" r="1.5" fill="rgba(74,144,217,0.6)" />
            <circle cx="553" cy="330" r="1.5" fill="rgba(74,144,217,0.6)" />
            <rect x="190" y="116" width="168" height="5" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.26" />
            <rect x="385" y="116" width="165" height="5" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.26" />
            <rect x="190" y="270" width="168" height="5" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.26" />
            <rect x="385" y="270" width="165" height="5" fill="rgba(74,144,217,0.18)" stroke="rgba(74,144,217,0.9)" strokeWidth="1.26" />
            <text className="label-text" x="130" y="170" textAnchor="end" fill="#4A90D9" fontSize="10" fontFamily="'JetBrains Mono', monospace">GLAZING CAP</text>
          </g>

          {/* ====== Layer 2: Perimeter Seal ====== */}
          <g ref={(el) => setLayerRef(2, el)} className="component-group" data-layer="2"
            onMouseEnter={(e) => handleLayerEnter(2, e)} onMouseMove={handleLayerMove}
            onMouseLeave={handleLayerLeave} onClick={(e) => { e.stopPropagation(); openPanel(2); }}>
            <rect x="193" y="138" width="163" height="128" fill="none" stroke="rgba(138,145,154,0.75)" strokeWidth="3.6" strokeDasharray="4,3" />
            <rect x="388" y="138" width="158" height="128" fill="none" stroke="rgba(138,145,154,0.75)" strokeWidth="3.6" strokeDasharray="4,3" />
            <rect x="193" y="293" width="163" height="128" fill="none" stroke="rgba(138,145,154,0.75)" strokeWidth="3.6" strokeDasharray="4,3" />
            <rect x="388" y="293" width="158" height="128" fill="none" stroke="rgba(138,145,154,0.75)" strokeWidth="3.6" strokeDasharray="4,3" />
            <text className="label-text" x="130" y="390" textAnchor="end" fill="#8A919A" fontSize="10" fontFamily="'JetBrains Mono', monospace">PERIMETER SEAL</text>
          </g>

          {/* ====== Layer 1: Insulated Glass Unit ====== */}
          <g ref={(el) => setLayerRef(1, el)} className="component-group" data-layer="1"
            onMouseEnter={(e) => handleLayerEnter(1, e)} onMouseMove={handleLayerMove}
            onMouseLeave={handleLayerLeave} onClick={(e) => { e.stopPropagation(); openPanel(1); }}>
            <rect x="196" y="141" width="157" height="122" fill="rgba(74,144,217,0.12)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.44" />
            <polygon points="196,141 204,133 361,133 353,141" fill="rgba(74,144,217,0.06)" stroke="rgba(74,144,217,0.36)" strokeWidth="0.9" />
            <polygon points="353,141 361,133 361,255 353,263" fill="rgba(74,144,217,0.075)" stroke="rgba(74,144,217,0.3)" strokeWidth="0.9" />
            <line x1="220" y1="240" x2="330" y2="155" stroke="rgba(74,144,217,0.18)" strokeWidth="1.8" />
            <rect x="391" y="141" width="152" height="122" fill="rgba(74,144,217,0.12)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.44" />
            <polygon points="391,141 399,133 551,133 543,141" fill="rgba(74,144,217,0.06)" stroke="rgba(74,144,217,0.36)" strokeWidth="0.9" />
            <polygon points="543,141 551,133 551,255 543,263" fill="rgba(74,144,217,0.075)" stroke="rgba(74,144,217,0.3)" strokeWidth="0.9" />
            <line x1="415" y1="240" x2="520" y2="155" stroke="rgba(74,144,217,0.18)" strokeWidth="1.8" />
            <rect x="196" y="296" width="157" height="122" fill="rgba(74,144,217,0.12)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.44" />
            <polygon points="196,296 204,288 361,288 353,296" fill="rgba(74,144,217,0.06)" stroke="rgba(74,144,217,0.36)" strokeWidth="0.9" />
            <polygon points="353,296 361,288 361,410 353,418" fill="rgba(74,144,217,0.075)" stroke="rgba(74,144,217,0.3)" strokeWidth="0.9" />
            <line x1="220" y1="395" x2="330" y2="310" stroke="rgba(74,144,217,0.18)" strokeWidth="1.8" />
            <rect x="391" y="296" width="152" height="122" fill="rgba(74,144,217,0.12)" stroke="rgba(74,144,217,0.6)" strokeWidth="1.44" />
            <polygon points="391,296 399,288 551,288 543,296" fill="rgba(74,144,217,0.06)" stroke="rgba(74,144,217,0.36)" strokeWidth="0.9" />
            <polygon points="543,296 551,288 551,410 543,418" fill="rgba(74,144,217,0.075)" stroke="rgba(74,144,217,0.3)" strokeWidth="0.9" />
            <line x1="415" y1="395" x2="520" y2="310" stroke="rgba(74,144,217,0.18)" strokeWidth="1.8" />
            <text className="label-text" x="275" y="90" textAnchor="middle" fill="#4A90D9" fontSize="10" fontFamily="'JetBrains Mono', monospace">INSULATED GLASS UNIT</text>
          </g>
        </svg>
      </div>

      {/* Detail Panel */}
      <div id="assembly-detail-panel" className={panelOpen ? 'open' : ''}>
        <button className="assembly-panel-close" onClick={closePanel} aria-label="Close detail panel" type="button">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" />
            <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        {activeMeta && activeLayer && (
          <div className="assembly-panel-body">
            <p className="assembly-panel-layer-num">LAYER {activeLayer} OF 9</p>
            <h3 className="assembly-panel-title">{activeMeta.name}</h3>
            <p className="assembly-panel-desc">{activeMeta.desc}</p>
            <div className="assembly-panel-section">
              <p className="assembly-panel-section-label">WHY IT MATTERS</p>
              <p className="assembly-panel-section-text">{activeMeta.why}</p>
            </div>
            <div className="assembly-panel-section">
              <p className="assembly-panel-section-label">SPECIFICATIONS</p>
              <table className="assembly-spec-table">
                <tbody>
                  {Object.entries(activeMeta.specs).map(([key, val]) => (
                    <tr key={key}><td>{key}</td><td>{val}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
