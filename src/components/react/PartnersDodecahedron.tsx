import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { t } from '../../i18n/translations';
import { useLang } from '../../i18n/useLang';

/* ═══════════════════════════════════════════════════════
   Partner data
   ═══════════════════════════════════════════════════════ */

interface Partner {
  name: string;
  logo: string;
  specialty: string;
  description: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const PARTNERS: Partner[] = [
  { name: 'KAWNEER', logo: `${BASE}/logos/kawneer.svg`, specialty: 'Curtain Walls & Entrances', description: 'Our primary curtain wall partner. Kawneer\'s 1600 and 1700 series wall systems anchor the majority of our mid- and high-rise projects. As an authorized dealer, we get factory-direct pricing, dedicated engineering support, and priority lead times that independent installers can\'t match.' },
  { name: 'YKK AP', logo: `${BASE}/logos/ykk-ap.png`, specialty: 'Window & Door Systems', description: 'YKK AP\'s thermally broken window and door systems deliver some of the highest U-values in commercial aluminum framing. We spec their ProTek and ThermaShade lines for projects requiring ENERGY STAR compliance without sacrificing sightlines.' },
  { name: 'OLDCASTLE', logo: `${BASE}/logos/oldcastle.png`, specialty: 'Building Envelope', description: 'Oldcastle BuildingEnvelope gives us single-source access to both glass fabrication and aluminum framing under one roof. Their Reliance and CrystalBlue product lines let us consolidate suppliers and simplify coordination on complex building envelope projects.' },
  { name: 'VIRACON', logo: `${BASE}/logos/viracon.svg`, specialty: 'Architectural Glass', description: 'When the spec calls for high-performance coated glass, including low-e, solar control, and bird-friendly options, Viracon is our go-to fabricator. Their VRE and VNE coatings consistently meet the tightest energy code requirements across Texas climate zones.' },
  { name: 'AGC GLASS', logo: `${BASE}/logos/agc.png`, specialty: 'Float & Specialty Glass', description: 'AGC supplies our float glass, fire-rated assemblies, and decorative glass needs. Their Pyrobel fire-rated glass and Lacobel back-painted panels give us options for specialty applications that most glazing contractors can\'t source directly.' },
  { name: 'TUBELITE', logo: `${BASE}/logos/tubelite.png`, specialty: 'Storefront & Framing', description: 'Tubelite\'s T14000 storefront and 400 series curtain wall systems are our workhorses for retail, medical, and education projects. Thermally broken profiles, Cradle to Cradle certified aluminum, and fast turnaround from their Texas distribution.' },
  { name: 'ATLAS', logo: `${BASE}/logos/atlas.png`, specialty: 'Metal & Glazing Systems', description: 'Atlas Wall Systems provides unitized curtain wall and panel systems for projects requiring factory-assembled modules. Their pre-glazed unitized approach reduces field labor and improves quality control on large-scale commercial facades.' },
  { name: 'EFCO', logo: `${BASE}/logos/efco.svg`, specialty: 'Windows & Curtain Wall', description: 'As part of the Apogee family alongside Tubelite and Wausau, EFCO\'s commercial window and curtain wall lines give us access to projected, fixed, and operable window systems engineered for institutional and high-wind applications.' },
  { name: 'STANLEY', logo: `${BASE}/logos/stanley.svg`, specialty: 'Automatic Entrances', description: 'Stanley Access Technologies handles our automatic entrance systems, including sliding, swinging, revolving, and folding doors. We\'re certified installers for their Dura-Glide, Magnum, and All-Glass lines, covering everything from retail storefronts to hospital ICU entries.' },
  { name: 'GUARDIAN', logo: `${BASE}/logos/guardian.png`, specialty: 'Glass Manufacturing', description: 'Guardian Glass provides float glass, coated glass, and fabricated insulating units. Their SunGuard solar control coatings and ClimaGuard low-e products are staples in our commercial and multi-family residential glazing projects.' },
  { name: 'PPG', logo: `${BASE}/logos/ppg.svg`, specialty: 'Glass & Coatings', description: 'PPG\'s Solarban solar control glass and Starphire ultra-clear glass are specified by name on projects demanding peak optical clarity and energy performance. We order direct through PPG\'s IdeaScapes network for competitive dealer pricing.' },
  { name: 'ARCADIA', logo: `${BASE}/logos/arcadia.png`, specialty: 'Custom Window Systems', description: 'Arcadia specializes in custom aluminum and steel window and door systems for architecturally demanding projects. Their steel-look thermally broken profiles give us the thin sightlines of historic steel with modern thermal performance.' },
];

// Translation key mapping for each partner (by index)
const PARTNER_KEYS = [
  'kawneer', 'ykkAp', 'oldcastle', 'viracon', 'agcGlass', 'tubelite',
  'atlas', 'efco', 'stanley', 'guardian', 'ppg', 'arcadia',
];

const GLASS_BLUE = '#4A90D9';
const ACCENT_RED = '#D31111';
const RADIUS = 2.4;

/* ═══════════════════════════════════════════════════════
   Theme detection hook
   ═══════════════════════════════════════════════════════ */

function useTheme(): 'dark' | 'light' {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof document === 'undefined') return 'dark';
    return (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const update = () => {
      const t = (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
      setTheme(t);
    };
    // Observe attribute changes on <html>
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') update();
      }
    });
    observer.observe(document.documentElement, { attributes: true });
    update();
    return () => observer.disconnect();
  }, []);

  return theme;
}

/* ═══════════════════════════════════════════════════════
   Extract EXACT face geometry from DodecahedronGeometry
   ═══════════════════════════════════════════════════════ */

interface FaceData {
  geometry: THREE.BufferGeometry;
  center: THREE.Vector3;
  normal: THREE.Vector3;
  bitangent: THREE.Vector3; // texture "up" direction (aligned to world up)
}

function extractFaces(radius: number): FaceData[] {
  const dodGeo = new THREE.DodecahedronGeometry(radius, 0);
  const pos = dodGeo.getAttribute('position');
  const faces: FaceData[] = [];

  for (let f = 0; f < 12; f++) {
    const base = f * 9;
    const verts: THREE.Vector3[] = [];
    for (let i = 0; i < 9; i++) {
      verts.push(new THREE.Vector3(pos.getX(base + i), pos.getY(base + i), pos.getZ(base + i)));
    }

    const unique: THREE.Vector3[] = [];
    const seen = new Set<string>();
    for (const v of verts) {
      const key = `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`;
      if (!seen.has(key)) { seen.add(key); unique.push(v.clone()); }
    }

    const center = new THREE.Vector3();
    unique.forEach((v) => center.add(v));
    center.divideScalar(unique.length);
    const normal = center.clone().normalize();

    // Align texture so "up" on the texture matches world "up" as closely as possible.
    // Project world-up onto the face plane to get the bitangent (texture Y axis).
    const worldUp = new THREE.Vector3(0, 1, 0);
    let projected = worldUp.clone().sub(normal.clone().multiplyScalar(worldUp.dot(normal)));
    // If normal is nearly vertical, fall back to world-Z
    if (projected.lengthSq() < 0.001) {
      projected = new THREE.Vector3(0, 0, 1).sub(normal.clone().multiplyScalar(new THREE.Vector3(0, 0, 1).dot(normal)));
    }
    const bitangent = projected.normalize();
    const tangent = new THREE.Vector3().crossVectors(bitangent, normal).normalize();
    const circumR = unique[0].clone().sub(center).length();
    const uvScale = 2.3 * circumR;

    const positions = new Float32Array(27);
    const uvs = new Float32Array(18);
    const norms = new Float32Array(27);

    for (let i = 0; i < 9; i++) {
      positions[i * 3] = verts[i].x;
      positions[i * 3 + 1] = verts[i].y;
      positions[i * 3 + 2] = verts[i].z;
      norms[i * 3] = normal.x;
      norms[i * 3 + 1] = normal.y;
      norms[i * 3 + 2] = normal.z;
      const rel = verts[i].clone().sub(center);
      uvs[i * 2] = 0.5 + rel.dot(tangent) / uvScale;
      uvs[i * 2 + 1] = 0.5 + rel.dot(bitangent) / uvScale;
    }

    const faceGeo = new THREE.BufferGeometry();
    faceGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    faceGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    faceGeo.setAttribute('normal', new THREE.BufferAttribute(norms, 3));
    faces.push({ geometry: faceGeo, center, normal, bitangent: bitangent.clone() });
  }

  dodGeo.dispose();
  return faces;
}

/* ═══════════════════════════════════════════════════════
   Canvas texture — high quality face rendering
   ═══════════════════════════════════════════════════════ */

function createFaceTexture(
  name: string,
  logoImg: HTMLImageElement | null,
  theme: 'dark' | 'light' = 'dark',
): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  const isDark = theme === 'dark';

  // ── Base fill ──
  ctx.fillStyle = isDark ? '#010E2F' : '#C8D8E8';
  ctx.fillRect(0, 0, S, S);

  // ── Radial gradient for depth ──
  const grd = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.5);
  if (isDark) {
    grd.addColorStop(0, 'rgba(1, 42, 137, 0.15)');
    grd.addColorStop(0.6, 'rgba(1, 27, 90, 0.08)');
    grd.addColorStop(1, 'rgba(1, 14, 47, 0)');
  } else {
    grd.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    grd.addColorStop(0.6, 'rgba(255, 255, 255, 0.06)');
    grd.addColorStop(1, 'rgba(200, 216, 232, 0)');
  }
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, S, S);

  // ── Pentagon outline ──
  const pentR = S * 0.42;
  ctx.strokeStyle = isDark ? 'rgba(74, 144, 217, 0.18)' : 'rgba(26, 74, 122, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const px = S / 2 + Math.cos(a) * pentR;
    const py = S / 2 + Math.sin(a) * pentR;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // ── Inner pentagon (subtle) ──
  ctx.strokeStyle = isDark ? 'rgba(74, 144, 217, 0.06)' : 'rgba(26, 74, 122, 0.06)';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const px = S / 2 + Math.cos(a) * pentR * 0.6;
    const py = S / 2 + Math.sin(a) * pentR * 0.6;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const maxDim = S * 0.52;
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
    const w = aspect > 1 ? maxDim : maxDim * aspect;
    const h = aspect > 1 ? maxDim / aspect : maxDim;
    const x = (S - w) / 2;
    const y = (S - h) / 2;

    // ── Draw logo, removing background ──
    const tmp = document.createElement('canvas');
    tmp.width = S;
    tmp.height = S;
    const tctx = tmp.getContext('2d')!;
    tctx.drawImage(logoImg, x, y, w, h);
    const imageData = tctx.getImageData(0, 0, S, S);
    const d = imageData.data;

    // Detect background: sample corners of the logo area
    const lx = Math.round(x), ly = Math.round(y);
    const lw = Math.round(w), lh = Math.round(h);
    const cornerCoords = [
      [ly, lx], [ly, lx + lw - 1],
      [ly + lh - 1, lx], [ly + lh - 1, lx + lw - 1],
      [ly + 1, lx + 1], [ly + 1, lx + lw - 2],
      [ly + Math.round(lh / 2), lx],
      [ly + Math.round(lh / 2), lx + lw - 1],
      [ly, lx + Math.round(lw / 2)],
      [ly + lh - 1, lx + Math.round(lw / 2)],
    ];
    const cornerIndices = cornerCoords
      .map(([row, col]) => (row * S + col) * 4)
      .filter(i => i >= 0 && i + 3 < d.length);

    // Check if logo has opaque corners (solid bg) or transparent (SVG/PNG with alpha)
    // PPG's blue rounded rect IS the logo — don't treat it as removable background
    const opaqueCorners = cornerIndices.filter(i => d[i + 3] > 200);
    let hasOpaqueBg = name === 'PPG' ? false : opaqueCorners.length >= 3;


    let bgR = 255, bgG = 255, bgB = 255;
    if (hasOpaqueBg) {
      let sr = 0, sg = 0, sb = 0;
      for (const ci of opaqueCorners) { sr += d[ci]; sg += d[ci + 1]; sb += d[ci + 2]; }
      bgR = Math.round(sr / opaqueCorners.length);
      bgG = Math.round(sg / opaqueCorners.length);
      bgB = Math.round(sb / opaqueCorners.length);
    }

    for (let pi = 0; pi < d.length; pi += 4) {
      const a = d[pi + 3];
      if (a < 10) continue;

      // Only remove background if the image has a solid bg
      if (hasOpaqueBg) {
        const r = d[pi], g = d[pi + 1], b = d[pi + 2];
        const distFromBg = Math.sqrt(
          ((r - bgR) / 255) ** 2 + ((g - bgG) / 255) ** 2 + ((b - bgB) / 255) ** 2
        ) / Math.sqrt(3);
        if (distFromBg < 0.15) {
          d[pi + 3] = 0;
          continue;
        }
      }

      if (isDark) {
        if (name === 'PPG') {
          // PPG: white rounded rect with letters cut out
          const r = d[pi], g = d[pi + 1], b = d[pi + 2];
          const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
          if (lum > 0.7) {
            // White letters → make transparent (cut out)
            d[pi + 3] = 0;
          } else {
            // Blue rect → make white
            d[pi] = 255; d[pi + 1] = 255; d[pi + 2] = 255;
          }
        } else {
          // All other logos: convert foreground to white silhouette
          d[pi] = 255;
          d[pi + 1] = 255;
          d[pi + 2] = 255;
          d[pi + 3] = a;
        }
      }
    }
    tctx.putImageData(imageData, 0, 0);
    ctx.globalAlpha = isDark ? 0.95 : 1;
    ctx.drawImage(tmp, 0, 0);
    ctx.globalAlpha = 1;
  } else {
    // ── Text fallback ──
    ctx.fillStyle = '#D1D5DB';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = name.length <= 3 ? S * 0.24 : name.length <= 6 ? S * 0.16 : S * 0.12;
    ctx.font = `800 ${fontSize}px Arial, Helvetica, sans-serif`;
    ctx.fillText(name, S / 2, S / 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/* ═══════════════════════════════════════════════════════
   Wireframe edges with glow
   ═══════════════════════════════════════════════════════ */

function WireframeEdges({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const geo = useMemo(() => {
    const d = new THREE.DodecahedronGeometry(RADIUS, 0);
    const e = new THREE.EdgesGeometry(d, 1);
    d.dispose();
    return e;
  }, []);

  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={theme === 'dark' ? GLASS_BLUE : '#1a4a7a'} transparent opacity={theme === 'dark' ? 0.8 : 0.6} />
      </lineSegments>
      {/* Glow layer */}
      <lineSegments geometry={geo} scale={1.002}>
        <lineBasicMaterial color={theme === 'dark' ? '#6AB0FF' : '#2a6aaa'} transparent opacity={theme === 'dark' ? 0.2 : 0.15} />
      </lineSegments>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Vertex dots
   ═══════════════════════════════════════════════════════ */

function VertexDots({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const verts = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(RADIUS, 0);
    const pos = geo.getAttribute('position');
    const unique = new Map<string, THREE.Vector3>();
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      const k = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
      if (!unique.has(k)) unique.set(k, v);
    }
    geo.dispose();
    return Array.from(unique.values());
  }, []);

  const dotGeo = useMemo(() => new THREE.SphereGeometry(0.035, 8, 8), []);
  const dotMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: theme === 'dark' ? '#6AB0FF' : '#1a4a7a', transparent: true, opacity: 0.9 }),
    [theme],
  );

  return (
    <group>
      {verts.map((v, i) => (
        <mesh key={i} position={v} geometry={dotGeo} material={dotMat} />
      ))}
    </group>
  );
}


/* ═══════════════════════════════════════════════════════
   Connection lines — subtle lines from dodecahedron
   to outer orbit ring
   ═══════════════════════════════════════════════════════ */

function ConnectionLines() {
  const linesRef = useRef<THREE.Group>(null);

  const lineData = useMemo(() => {
    const phi = (1 + Math.sqrt(5)) / 2;
    const normals: [number, number, number][] = [
      [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
      [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
      [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1],
    ];
    return normals.map(([x, y, z]) => {
      const n = new THREE.Vector3(x, y, z).normalize();
      const inner = n.clone().multiplyScalar(RADIUS * 1.05);
      const outer = n.clone().multiplyScalar(RADIUS * 1.8);
      return { inner, outer };
    });
  }, []);

  return (
    <group ref={linesRef}>
      {lineData.map((line, i) => {
        const points = [line.inner, line.outer];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <lineSegments key={i} geometry={geo}>
            <lineBasicMaterial color={GLASS_BLUE} transparent opacity={0.08} />
          </lineSegments>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Glowing halo effect for selected/hovered face
   Multiple concentric scaled pentagon meshes with
   additive blending create a soft bloom-like glow.
   ═══════════════════════════════════════════════════════ */

function FaceGlow({ faces, selectedFace, hoveredFace, theme = 'dark' }: {
  faces: FaceData[];
  selectedFace: number | null;
  hoveredFace: number | null;
  theme?: 'dark' | 'light';
}) {
  // For each face, create a ring of glow meshes (scaled-up copies of the face)
  // Each layer is slightly larger and more transparent → soft bloom
  const GLOW_LAYERS = 5;
  const noopRaycast = () => {};

  const glowData = useMemo(() => {
    return faces.map((face) => {
      const layers: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = [];

      for (let layer = 0; layer < GLOW_LAYERS; layer++) {
        // Scale outward from face center + push along normal
        const spread = 1.0 + (layer + 1) * 0.025; // 1.025, 1.05, 1.075, 1.1, 1.125
        const normalOffset = 0.01 + layer * 0.005;

        // Clone face geometry and scale vertices outward from face center
        const srcPos = face.geometry.getAttribute('position');
        const positions = new Float32Array(srcPos.count * 3);
        for (let vi = 0; vi < srcPos.count; vi++) {
          const v = new THREE.Vector3(srcPos.getX(vi), srcPos.getY(vi), srcPos.getZ(vi));
          // Scale from face center
          v.sub(face.center).multiplyScalar(spread).add(face.center);
          // Offset along face normal
          v.add(face.normal.clone().multiplyScalar(normalOffset));
          positions[vi * 3] = v.x;
          positions[vi * 3 + 1] = v.y;
          positions[vi * 3 + 2] = v.z;
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        // Copy index if it exists
        if (face.geometry.index) geo.setIndex(face.geometry.index.clone());

        const mat = new THREE.MeshBasicMaterial({
          color: GLASS_BLUE,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: false,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.raycast = noopRaycast; // Don't intercept clicks
        layers.push({ mesh, mat });
      }

      return layers;
    });
  }, [faces]);

  useFrame(() => {
    const t = Date.now() * 0.003;
    const pulse = 0.5 + Math.sin(t) * 0.5;

    glowData.forEach((layers, faceIdx) => {
      const isSelected = faceIdx === selectedFace;
      const isHovered = faceIdx === hoveredFace && selectedFace !== faceIdx;

      layers.forEach(({ mat }, layerIdx) => {
        if (theme === 'light') {
          // Light mode: only subtle outline glow, no additive blowout
          if (isSelected) {
            const baseOpacity = [0.08, 0.04, 0.02, 0.01, 0.005][layerIdx];
            mat.color.setHex(0x1a5fa8);
            mat.opacity = baseOpacity;
          } else if (isHovered) {
            const baseOpacity = [0.05, 0.025, 0.01, 0.005, 0.002][layerIdx];
            mat.color.setHex(0x1a5fa8);
            mat.opacity = baseOpacity;
          } else {
            mat.opacity = 0;
          }
        } else if (isSelected) {
          const baseOpacity = [0.35, 0.25, 0.15, 0.08, 0.04][layerIdx];
          mat.color.setHex(layerIdx < 2 ? 0x4A90D9 : 0x6AB0FF);
          mat.opacity = baseOpacity * (0.7 + pulse * 0.3);
        } else if (isHovered) {
          const baseOpacity = [0.2, 0.12, 0.06, 0.03, 0.015][layerIdx];
          mat.color.setHex(layerIdx < 2 ? 0x6AB0FF : 0x8EC8FF);
          mat.opacity = baseOpacity * (0.6 + pulse * 0.4);
        } else {
          mat.opacity = 0;
        }
      });
    });
  });

  return (
    <group>
      {glowData.map((layers, faceIdx) => (
        <group key={faceIdx}>
          {layers.map(({ mesh }, layerIdx) => (
            <primitive key={layerIdx} object={mesh} />
          ))}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Main 3D scene
   ═══════════════════════════════════════════════════════ */

function Scene({ onHover, onSelect, selectedFace, scale = 1, theme = 'dark' as 'dark' | 'light' }: {
  onHover: (idx: number | null) => void;
  onSelect: (idx: number | null) => void;
  selectedFace: number | null;
  scale?: number;
  theme?: 'dark' | 'light';
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredFace, setHoveredFace] = useState<number | null>(null);
  const isDragging = useRef(false);
  const autoRotate = useRef(true);
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>();
  const dragStart = useRef({ x: 0, y: 0 });
  const dragDist = useRef(0);
  const vel = useRef({ x: 0, y: 0 });
  const { gl, camera } = useThree();

  // Smooth rotation to target face
  const targetQuat = useRef<THREE.Quaternion | null>(null);
  const isAnimatingToFace = useRef(false);

  const faces = useMemo(() => extractFaces(RADIUS), []);
  const [textures, setTextures] = useState<THREE.CanvasTexture[]>([]);

  // Cache loaded images so theme changes don't re-fetch
  const logoImagesRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Load images if not already cached
      if (logoImagesRef.current.length === 0) {
        const imgs: (HTMLImageElement | null)[] = [];
        for (const partner of PARTNERS) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          let loaded = false;
          await new Promise<void>((resolve) => {
            img.onload = () => { loaded = true; resolve(); };
            img.onerror = () => resolve();
            img.src = partner.logo;
          });
          if (cancelled) return;
          imgs.push(loaded ? img : null);
        }
        logoImagesRef.current = imgs;
      }
      // Generate textures with current theme
      const results: THREE.CanvasTexture[] = [];
      for (let i = 0; i < PARTNERS.length; i++) {
        results.push(createFaceTexture(PARTNERS[i].name, logoImagesRef.current[i], theme));
      }
      if (!cancelled) setTextures(results);
    })();
    return () => { cancelled = true; };
  }, [theme]);

  // Materials per face — MeshBasicMaterial in light mode (unlit, no shine),
  // MeshStandardMaterial in dark mode (subtle lighting)
  const materials = useMemo(
    () => faces.map(() => {
      if (theme === 'light') {
        return new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0.92,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
      }
      return new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 0.4,
        metalness: 0.1,
      });
    }),
    [faces, theme],
  );

  useEffect(() => {
    if (textures.length !== materials.length) return;
    materials.forEach((mat, i) => { mat.map = textures[i]; mat.needsUpdate = true; });
  }, [textures, materials]);

  useEffect(() => {
    materials.forEach((mat, i) => {
      const active = hoveredFace === i || selectedFace === i;
      if (theme === 'dark') {
        mat.opacity = active ? 1 : 0.88;
        if ('emissive' in mat) {
          (mat as THREE.MeshStandardMaterial).emissive = active ? new THREE.Color(0x4A90D9) : new THREE.Color(0x000000);
          (mat as THREE.MeshStandardMaterial).emissiveIntensity = active ? (selectedFace === i ? 0.25 : 0.15) : 0;
        }
      } else {
        mat.opacity = active ? 1 : 0.92;
      }
    });
  }, [hoveredFace, selectedFace, materials, theme]);

  // Click a face → compute target quaternion to rotate that face toward camera
  const handleClick = useCallback((i: number) => {
    if (dragDist.current > 8) return; // was a drag, not a click

    if (selectedFace === i) {
      // Clicking the same face deselects
      onSelect(null);
      autoRotate.current = false;
      resumeTimer.current = setTimeout(() => { autoRotate.current = true; onSelect(null); }, 3000);
      return;
    }

    onSelect(i);
    autoRotate.current = false;
    isAnimatingToFace.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    // Auto-deselect and resume rotation after 5 seconds
    resumeTimer.current = setTimeout(() => { autoRotate.current = true; onSelect(null); }, 5000);

    if (!groupRef.current) return;

    const currentQuat = groupRef.current.quaternion.clone();
    const localNormal = faces[i].normal.clone();
    const localBitangent = faces[i].bitangent.clone();

    // Transform face vectors to world space
    const worldNormal = localNormal.clone().applyQuaternion(currentQuat);

    // Camera direction (where we want the face to point)
    const camDir = camera.position.clone().normalize();

    // Step 1: rotation that points the face at the camera
    const step1 = new THREE.Quaternion().setFromUnitVectors(worldNormal, camDir);
    const afterStep1 = step1.clone().multiply(currentQuat);

    // Step 2: twist correction so logo "up" aligns with screen "up"
    // Get where the bitangent ends up after step 1
    const worldBitangent = localBitangent.clone().applyQuaternion(afterStep1);

    // Project both worldBitangent and screen-up onto the plane perpendicular to camDir
    const screenUp = camera.up.clone();
    const projBitangent = worldBitangent.clone().sub(camDir.clone().multiplyScalar(worldBitangent.dot(camDir))).normalize();
    const projScreenUp = screenUp.clone().sub(camDir.clone().multiplyScalar(screenUp.dot(camDir))).normalize();

    // Rotation around camDir to align projected bitangent with projected screen-up
    const twist = new THREE.Quaternion().setFromUnitVectors(projBitangent, projScreenUp);

    // Final: twist * step1 * current
    targetQuat.current = twist.multiply(afterStep1);
  }, [faces, camera, selectedFace, onSelect]);

  // Drag
  useEffect(() => {
    const c = gl.domElement;
    const down = (e: PointerEvent) => {
      isDragging.current = true;
      autoRotate.current = false;
      isAnimatingToFace.current = false;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      dragStart.current = { x: e.clientX, y: e.clientY };
      dragDist.current = 0;
      vel.current = { x: 0, y: 0 };
    };
    const move = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragDist.current += Math.abs(dx) + Math.abs(dy);
      vel.current = { x: dy * 0.003, y: dx * 0.003 };
      dragStart.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      isDragging.current = false;
      resumeTimer.current = setTimeout(() => { autoRotate.current = true; onSelect(null); }, 3000);
    };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointerleave', up);
    return () => {
      c.removeEventListener('pointerdown', down);
      c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerup', up);
      c.removeEventListener('pointerleave', up);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [gl]);

  // Temp quaternions for frame updates (avoid allocation per frame)
  const _spinQuat = useMemo(() => new THREE.Quaternion(), []);
  const _tiltAxis = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const _yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const _xAxis = useMemo(() => new THREE.Vector3(1, 0, 0), []);

  useFrame((_, dt) => {
    if (!groupRef.current) return;

    if (isAnimatingToFace.current && targetQuat.current) {
      // Smooth slerp to target rotation
      groupRef.current.quaternion.slerp(targetQuat.current, 0.06);
      const angleDiff = groupRef.current.quaternion.angleTo(targetQuat.current);
      if (angleDiff < 0.005) {
        groupRef.current.quaternion.copy(targetQuat.current);
        isAnimatingToFace.current = false;
      }
    } else if (autoRotate.current) {
      // Slow Y rotation + gentle X wobble — all via quaternion
      _spinQuat.setFromAxisAngle(_yAxis, dt * 0.1);
      groupRef.current.quaternion.premultiply(_spinQuat);

      const t = Date.now() * 0.00015;
      const tiltTarget = Math.sin(t) * 0.002;
      _spinQuat.setFromAxisAngle(_tiltAxis, tiltTarget);
      groupRef.current.quaternion.premultiply(_spinQuat);
    } else {
      // Manual drag momentum — apply as incremental quaternion rotations
      if (Math.abs(vel.current.y) > 0.0001 || Math.abs(vel.current.x) > 0.0001) {
        _spinQuat.setFromAxisAngle(_yAxis, vel.current.y);
        groupRef.current.quaternion.premultiply(_spinQuat);
        _spinQuat.setFromAxisAngle(_xAxis, vel.current.x);
        groupRef.current.quaternion.premultiply(_spinQuat);
        vel.current.x *= 0.93;
        vel.current.y *= 0.93;
      }
    }
  });

  const handleHover = useCallback((i: number | null) => {
    setHoveredFace(i);
    onHover(i);
  }, [onHover]);

  return (
    <>
      <group ref={groupRef} scale={scale}>
        {/* Textured faces */}
        {faces.map((face, i) => (
          <mesh
            key={i}
            geometry={face.geometry}
            material={materials[i]}
            onPointerEnter={(e) => { e.stopPropagation(); handleHover(i); }}
            onPointerLeave={() => handleHover(null)}
            onClick={(e) => { e.stopPropagation(); handleClick(i); }}
          />
        ))}

        {/* Glowing edge outline on selected/hovered face */}
        <FaceGlow faces={faces} selectedFace={selectedFace} hoveredFace={hoveredFace} theme={theme} />

        {/* Glass outer shell — raycast disabled so clicks pass through to faces */}
        <mesh raycast={() => null}>
          <dodecahedronGeometry args={[RADIUS * 1.004, 0]} />
          <meshPhysicalMaterial
            color={theme === 'dark' ? '#4A90D9' : '#a3c4e8'}
            transparent
            opacity={theme === 'dark' ? 0.07 : 0.04}
            roughness={0.02}
            metalness={theme === 'dark' ? 0.15 : 0.05}
            clearcoat={1}
            clearcoatRoughness={0.03}
            envMapIntensity={theme === 'dark' ? 2 : 1.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Glass inner shell — raycast disabled */}
        <mesh raycast={() => null}>
          <dodecahedronGeometry args={[RADIUS * 0.996, 0]} />
          <meshPhysicalMaterial
            color={theme === 'dark' ? '#012A89' : '#B0C4DE'}
            transparent
            opacity={theme === 'dark' ? 0.04 : 0.06}
            roughness={0}
            metalness={theme === 'dark' ? 0.3 : 0.1}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        <WireframeEdges theme={theme} />
        <VertexDots theme={theme} />
        <ConnectionLines />
      </group>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   HTML overlay — hover label
   ═══════════════════════════════════════════════════════ */

function HoverLabel({ partner }: { partner: Partner | null }) {
  return (
    <div
      className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      style={{ opacity: partner ? 1 : 0, transition: 'opacity 0.25s cubic-bezier(0.25,0.1,0.25,1)' }}
    >
      <div className="glass-card-strong corner-brackets px-6 py-3 text-center">
        <div className="relative z-10 flex items-center gap-3">
          <span className="w-2 h-2 bg-[#D31111] flex-shrink-0"></span>
          <span className="font-mono text-base text-white font-bold tracking-wider">
            {partner?.name ?? ''}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Detail panel — appears below the dodecahedron
   ═══════════════════════════════════════════════════════ */

function DetailPanel({ partner, onClose, lang, partnerIndex }: { partner: Partner | null; onClose: () => void; lang: 'en' | 'es'; partnerIndex: number | null }) {
  const pKey = partnerIndex !== null ? PARTNER_KEYS[partnerIndex] : null;
  return (
    <div className="w-full h-full px-4 lg:px-6 flex items-center">
      {partner && (
        <div className="partner-info-panel w-full border border-[rgba(74,144,217,0.2)] bg-[rgba(1,14,47,0.92)] backdrop-blur-sm flex flex-col" style={{ minHeight: '320px' }}>
          {/* Top accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#D31111] to-transparent flex-shrink-0"></div>

          <div className="p-6 lg:p-8 flex flex-col flex-1 justify-between">
            {/* Top section */}
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 bg-[#D31111] flex-shrink-0"></span>
                    <span className="font-mono text-[14px] uppercase tracking-[0.2em] text-[#D31111]">{t('partners.detail.badge', lang)}</span>
                  </div>
                  <h3 className="font-mono text-2xl lg:text-3xl font-bold text-white tracking-wider mb-2">{partner.name}</h3>
                  <span className="font-mono text-base uppercase tracking-widest text-[#4A90D9]">{pKey ? t(`partners.${pKey}.specialty`, lang) : partner.specialty}</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 border border-[rgba(74,144,217,0.15)] flex items-center justify-center text-[#8A919A] hover:text-white hover:border-[rgba(74,144,217,0.4)] transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="1" y1="1" x2="9" y2="9" />
                    <line x1="9" y1="1" x2="1" y2="9" />
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-[rgba(74,144,217,0.1)] mb-5"></div>

              {/* Description */}
              <p className="text-lg lg:text-xl text-[#8A919A] leading-relaxed">{pKey ? t(`partners.${pKey}.desc`, lang) : partner.description}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(74,144,217,0.06)]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500"></span>
                  <span className="font-mono text-[13px] uppercase tracking-widest text-[#8A919A]">{t('partners.detail.authorizedDealer', lang)}</span>
                </div>
                <span className="w-px h-3 bg-[rgba(74,144,217,0.12)]"></span>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#4A90D9]"></span>
                  <span className="font-mono text-[13px] uppercase tracking-widest text-[#8A919A]">{t('partners.detail.factoryDirect', lang)}</span>
                </div>
              </div>
              <span className="font-mono text-[13px] text-[rgba(74,144,217,0.3)] tracking-widest">QR-{String(PARTNERS.indexOf(partner) + 1).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Bottom accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#4A90D9] to-transparent flex-shrink-0"></div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Exported component
   ═══════════════════════════════════════════════════════ */

export default function PartnersDodecahedron({ heroMode = false, compact = false }: { heroMode?: boolean; compact?: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const lang = useLang();
  const theme = useTheme();

  // Hero mode: 3D canvas filling its container with interactive face selection
  if (heroMode) {
    // compact = mobile inline (bigger model, closer camera)
    // default = desktop absolute right half (original sizing)
    const camZ = compact ? 5.5 : 7;
    const camFov = compact ? 50 : 40;
    const modelScale = compact ? 1.0 : 0.55;
    const selectedPartner = selected !== null ? PARTNERS[selected] : null;

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Canvas
            camera={{ position: [0, 0, camZ], fov: camFov }}
            style={{ background: 'transparent', pointerEvents: 'auto' }}
            gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={theme === 'dark' ? 0.25 : 0.6} />
            <directionalLight position={[5, 8, 5]} intensity={theme === 'dark' ? 1 : 1.5} color="#ffffff" />
            <directionalLight position={[-4, -2, -6]} intensity={theme === 'dark' ? 0.5 : 0.8} color={theme === 'dark' ? '#4A90D9' : '#6AB0FF'} />
            <pointLight position={[0, 4, 3]} intensity={theme === 'dark' ? 0.6 : 1} color="#ffffff" distance={15} />
            <pointLight position={[-3, -3, 2]} intensity={theme === 'dark' ? 0.4 : 0.6} color={theme === 'dark' ? '#4A90D9' : '#6AB0FF'} distance={12} />
            <pointLight position={[3, 0, -3]} intensity={theme === 'dark' ? 0.3 : 0.5} color="#6AB0FF" distance={10} />
            <Environment preset="city" environmentIntensity={theme === 'dark' ? 0.2 : 0.5} />
            <fog attach="fog" args={[theme === 'dark' ? '#010E2F' : '#C8D8E8', 12, 24]} />

            <Scene onHover={setHovered} onSelect={setSelected} selectedFace={selected} scale={modelScale} theme={theme} />
          </Canvas>
        </div>

        {/* Hover label — only when no face is selected */}
        {!compact && selected === null && <HoverLabel partner={hovered !== null ? PARTNERS[hovered] : null} />}

        {/* Selected face detail overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: compact ? '8px' : '24px',
            left: compact ? '8px' : '16px',
            right: compact ? '8px' : '16px',
            opacity: selectedPartner ? 1 : 0,
            transform: selectedPartner ? 'translate3d(0,0,0)' : 'translate3d(0,12px,0)',
            transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: selectedPartner ? 'auto' : 'none',
            zIndex: 30,
          }}
        >
          {selectedPartner && (
            <div
              style={{
                border: '1px solid rgba(74,144,217,0.25)',
                background: 'rgba(1,14,47,0.92)',
                backdropFilter: 'blur(12px)',
                maxWidth: compact ? '100%' : '380px',
              }}
            >
              {/* Top accent line */}
              <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #D31111, transparent)' }} />

              <div style={{ padding: compact ? '12px 14px' : '16px 20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ width: '6px', height: '6px', background: '#D31111', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#D31111' }}>{t('partners.detail.badge', lang)}</span>
                    </div>
                    <h4 style={{ fontFamily: 'monospace', fontSize: compact ? '18px' : '20px', fontWeight: 700, color: 'white', letterSpacing: '0.05em', margin: 0, lineHeight: 1.2 }}>{selectedPartner.name}</h4>
                    <span style={{ fontFamily: 'monospace', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4A90D9' }}>{selected !== null ? t(`partners.${PARTNER_KEYS[selected]}.specialty`, lang) : selectedPartner.specialty}</span>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    style={{
                      width: '24px', height: '24px', border: '1px solid rgba(74,144,217,0.2)',
                      background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#8A919A', cursor: 'pointer', flexShrink: 0, padding: 0,
                    }}
                    aria-label="Close"
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <line x1="1" y1="1" x2="9" y2="9" />
                      <line x1="9" y1="1" x2="1" y2="9" />
                    </svg>
                  </button>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(74,144,217,0.1)', marginBottom: '8px' }} />

                {/* Description */}
                <p style={{
                  fontSize: compact ? '15px' : '16px', color: '#8A919A', lineHeight: 1.6, margin: 0,
                  display: '-webkit-box', WebkitLineClamp: compact ? 3 : 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {selected !== null ? t(`partners.${PARTNER_KEYS[selected]}.desc`, lang) : selectedPartner.description}
                </p>
              </div>

              {/* Bottom accent */}
              <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #4A90D9, transparent)' }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Partners section: full layout with detail panel
  return (
    <div className="w-full flex flex-col lg:flex-row items-center lg:items-stretch gap-0 lg:h-[900px]">
      {/* Left: 3D Canvas */}
      <div className="relative w-full lg:w-[65%] h-[350px] sm:h-[450px] lg:h-full">
        <Canvas
          camera={{ position: [0, 0.3, 9.5], fov: 36 }}
          style={{ background: 'transparent' }}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={theme === 'dark' ? 0.25 : 0.6} />
          <directionalLight position={[5, 8, 5]} intensity={theme === 'dark' ? 1 : 1.5} color="#ffffff" />
          <directionalLight position={[-4, -2, -6]} intensity={theme === 'dark' ? 0.5 : 0.8} color={theme === 'dark' ? '#4A90D9' : '#6AB0FF'} />
          <pointLight position={[0, 4, 3]} intensity={theme === 'dark' ? 0.6 : 1} color="#ffffff" distance={15} />
          <pointLight position={[-3, -3, 2]} intensity={theme === 'dark' ? 0.4 : 0.6} color={theme === 'dark' ? '#4A90D9' : '#6AB0FF'} distance={12} />
          <pointLight position={[3, 0, -3]} intensity={theme === 'dark' ? 0.3 : 0.5} color="#6AB0FF" distance={10} />
          <Environment preset="city" environmentIntensity={theme === 'dark' ? 0.2 : 0.5} />
          <fog attach="fog" args={[theme === 'dark' ? '#010E2F' : '#C8D8E8', 12, 22]} />

          <Scene onHover={setHovered} onSelect={setSelected} selectedFace={selected} theme={theme} />
        </Canvas>

        {/* Hover label (hidden when detail panel is open) */}
        {selected === null && (
          <HoverLabel partner={hovered !== null ? PARTNERS[hovered] : null} />
        )}

      </div>

      {/* Right: Info panel — default intro or partner detail */}
      <div className="w-full lg:w-[35%] lg:h-full relative" style={{ minHeight: '280px' }}>
        {/* Default intro — visible when no face selected */}
        <div
          className="lg:absolute lg:inset-0 will-change-transform"
          style={{
            opacity: selected === null ? 1 : 0,
            transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: selected === null ? 'auto' : 'none',
            ...(selected !== null ? { position: 'absolute', inset: 0 } : {}),
          }}
        >
          <div className="w-full h-full px-4 lg:px-6 flex items-center">
            <div className="partner-info-panel w-full border border-[rgba(74,144,217,0.12)] bg-[rgba(1,14,47,0.6)]">
              <div className="h-px bg-gradient-to-r from-transparent via-[rgba(74,144,217,0.3)] to-transparent"></div>
              <div className="p-4 sm:p-6 lg:p-8 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 lg:mb-4">
                    <span className="w-2 h-2 bg-[#4A90D9] flex-shrink-0"></span>
                    <span className="font-mono text-[12px] sm:text-[14px] uppercase tracking-[0.2em] text-[#4A90D9]">{t('partners.panel.badge', lang)}</span>
                  </div>
                  <h3 className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-wider mb-3 lg:mb-4">{t('partners.panel.heading', lang)}</h3>
                  <div className="h-px bg-[rgba(74,144,217,0.1)] mb-3 lg:mb-5"></div>
                  <p className="text-base sm:text-lg lg:text-xl text-[#8A919A] leading-relaxed mb-3 lg:mb-4">
                    {t('partners.panel.body1', lang)}
                  </p>
                </div>
                <div className="flex items-center gap-6 pt-4 border-t border-[rgba(74,144,217,0.06)]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-bold text-white">{PARTNERS.length}</span>
                    <span className="font-mono text-[13px] uppercase tracking-widest text-[#8A919A]">{lang === 'es' ? 'Socios' : 'Partners'}</span>
                  </div>
                  <span className="w-px h-4 bg-[rgba(74,144,217,0.12)]"></span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500"></span>
                    <span className="font-mono text-[13px] uppercase tracking-widest text-[#8A919A]">{t('partners.panel.allActive', lang)}</span>
                  </div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-[rgba(74,144,217,0.15)] to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Partner detail — visible when a face is selected */}
        <div
          className="lg:absolute lg:inset-0 will-change-transform"
          style={{
            opacity: selected !== null ? 1 : 0,
            transform: selected !== null ? 'translate3d(0,0,0)' : 'translate3d(40px,0,0)',
            transition: 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: selected !== null ? 'auto' : 'none',
            ...(selected === null ? { position: 'absolute', inset: 0 } : {}),
          }}
        >
          <DetailPanel
            partner={selected !== null ? PARTNERS[selected] : null}
            onClose={() => setSelected(null)}
            lang={lang}
            partnerIndex={selected}
          />
        </div>
      </div>
    </div>
  );
}
