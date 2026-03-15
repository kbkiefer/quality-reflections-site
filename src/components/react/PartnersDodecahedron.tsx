import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════
   Partner data
   ═══════════════════════════════════════════════════════ */

interface Partner {
  name: string;
  logo: string;
  specialty: string;
  description: string;
}

const PARTNERS: Partner[] = [
  { name: 'KAWNEER', logo: '/logos/kawneer.svg', specialty: 'Curtain Walls & Entrances', description: 'Authorized dealer for architectural aluminum curtain wall, storefront, and entrance systems. Full engineering and technical support.' },
  { name: 'YKK AP', logo: '/logos/ykk-ap.png', specialty: 'Window & Door Systems', description: 'Premium aluminum window and door systems for commercial and residential applications. Industry-leading thermal performance.' },
  { name: 'OLDCASTLE', logo: '/logos/oldcastle.png', specialty: 'Building Envelope', description: 'North America\'s leading manufacturer of architectural glass and aluminum glazing systems. Complete building envelope solutions.' },
  { name: 'VIRACON', logo: '/logos/viracon.svg', specialty: 'Architectural Glass', description: 'High-performance architectural glass fabrication. Custom coatings, insulating units, and specialty glass products.' },
  { name: 'AGC GLASS', logo: '/logos/agc.png', specialty: 'Float & Specialty Glass', description: 'Global leader in flat glass manufacturing. Energy-efficient coated glass, decorative glass, and fire-rated solutions.' },
  { name: 'TUBELITE', logo: '/logos/tubelite.png', specialty: 'Storefront & Framing', description: 'Architectural aluminum storefront, curtain wall, and entrance systems. Sustainable and thermally broken designs.' },
  { name: 'ATLAS', logo: '/logos/atlas.png', specialty: 'Glazing Hardware', description: 'Precision glazing hardware and accessories for commercial curtain wall and window installations.' },
  { name: 'EFCO', logo: '/logos/efco.svg', specialty: 'Windows & Curtain Wall', description: 'Commercial aluminum windows, curtain walls, storefronts, and entrances. Part of Apogee Enterprises.' },
  { name: 'STANLEY', logo: '/logos/stanley.svg', specialty: 'Automatic Doors', description: 'Industry-leading automatic sliding, swinging, and revolving door systems for commercial entrances.' },
  { name: 'GUARDIAN', logo: '/logos/guardian.png', specialty: 'Glass & Coatings', description: 'Flat glass and fabricated glass products with advanced coatings for commercial and residential construction.' },
  { name: 'PPG', logo: '/logos/ppg.svg', specialty: 'Glass & Coatings', description: 'Flat glass, fabricated glass products, and high-performance coatings. Solarban and Starphire product lines.' },
  { name: 'ARCADIA', logo: '/logos/arcadia.png', specialty: 'Custom Window Systems', description: 'Custom architectural window and door systems. Aluminum and steel frames for commercial projects.' },
];

const GLASS_BLUE = '#4A90D9';
const ACCENT_RED = '#D31111';
const RADIUS = 2.4;

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
): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;

  // ── Base fill ──
  ctx.fillStyle = '#010E2F';
  ctx.fillRect(0, 0, S, S);

  // ── Radial gradient for depth ──
  const grd = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.5);
  grd.addColorStop(0, 'rgba(1, 42, 137, 0.15)');
  grd.addColorStop(0.6, 'rgba(1, 27, 90, 0.08)');
  grd.addColorStop(1, 'rgba(1, 14, 47, 0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, S, S);

  // ── Pentagon outline ──
  const pentR = S * 0.42;
  ctx.strokeStyle = 'rgba(74, 144, 217, 0.18)';
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
  ctx.strokeStyle = 'rgba(74, 144, 217, 0.06)';
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
    const maxDim = S * 0.44;
    const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
    const w = aspect > 1 ? maxDim : maxDim * aspect;
    const h = aspect > 1 ? maxDim / aspect : maxDim;
    const x = (S - w) / 2;
    const y = (S - h) / 2;

    // Convert logo to white on transparent, then composite onto face
    // Step 1: draw logo to temp canvas
    const tmp = document.createElement('canvas');
    tmp.width = S;
    tmp.height = S;
    const tctx = tmp.getContext('2d')!;
    tctx.drawImage(logoImg, x, y, w, h);
    const imageData = tctx.getImageData(0, 0, S, S);
    const d = imageData.data;

    // Step 2: detect background color by sampling corner pixels of the logo area
    const lx = Math.round(x), ly = Math.round(y);
    const lw = Math.round(w), lh = Math.round(h);
    const cornerCoords = [
      [ly, lx],                   // top-left of logo
      [ly, lx + lw - 1],          // top-right
      [ly + lh - 1, lx],          // bottom-left
      [ly + lh - 1, lx + lw - 1], // bottom-right
      [ly + 1, lx + 1],           // inset top-left
      [ly + 1, lx + lw - 2],      // inset top-right
    ];
    const corners = cornerCoords
      .map(([row, col]) => (row * S + col) * 4)
      .filter(i => i >= 0 && i + 3 < d.length && d[i + 3] > 200);

    // Sample bg color from corners (fall back to white)
    let bgR = 255, bgG = 255, bgB = 255;
    if (corners.length > 0) {
      let sr = 0, sg = 0, sb = 0;
      for (const ci of corners) { sr += d[ci]; sg += d[ci + 1]; sb += d[ci + 2]; }
      bgR = Math.round(sr / corners.length);
      bgG = Math.round(sg / corners.length);
      bgB = Math.round(sb / corners.length);
    }

    // Step 3: convert to white silhouette, removing detected background
    for (let pi = 0; pi < d.length; pi += 4) {
      const a = d[pi + 3];
      if (a < 10) continue; // already transparent

      const r = d[pi], g = d[pi + 1], b = d[pi + 2];

      // Distance from detected background color (0–1 scale)
      const distFromBg = Math.sqrt(
        ((r - bgR) / 255) ** 2 + ((g - bgG) / 255) ** 2 + ((b - bgB) / 255) ** 2
      ) / Math.sqrt(3);

      if (distFromBg < 0.12) {
        // Close to background color — make transparent
        d[pi + 3] = 0;
      } else {
        // Foreground pixel — make white, use contrast as alpha
        d[pi] = 255;
        d[pi + 1] = 255;
        d[pi + 2] = 255;
        d[pi + 3] = Math.min(255, Math.round(distFromBg * (a / 255) * 255 * 2.5));
      }
    }
    tctx.putImageData(imageData, 0, 0);
    ctx.globalAlpha = 0.95;
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

function WireframeEdges() {
  const geo = useMemo(() => {
    const d = new THREE.DodecahedronGeometry(RADIUS, 0);
    const e = new THREE.EdgesGeometry(d, 1);
    d.dispose();
    return e;
  }, []);

  return (
    <group>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={GLASS_BLUE} transparent opacity={0.8} />
      </lineSegments>
      {/* Glow layer */}
      <lineSegments geometry={geo} scale={1.002}>
        <lineBasicMaterial color="#6AB0FF" transparent opacity={0.2} />
      </lineSegments>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Vertex dots
   ═══════════════════════════════════════════════════════ */

function VertexDots() {
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
    () => new THREE.MeshBasicMaterial({ color: '#6AB0FF', transparent: true, opacity: 0.9 }),
    [],
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
   Main 3D scene
   ═══════════════════════════════════════════════════════ */

function Scene({ onHover, onSelect, selectedFace }: {
  onHover: (idx: number | null) => void;
  onSelect: (idx: number | null) => void;
  selectedFace: number | null;
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results: THREE.CanvasTexture[] = [];
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
        results.push(createFaceTexture(partner.name, loaded ? img : null));
      }
      if (!cancelled) setTextures(results);
    })();
    return () => { cancelled = true; };
  }, []);

  // Materials per face
  const materials = useMemo(
    () => faces.map(() => new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.4,
      metalness: 0.1,
    })),
    [faces],
  );

  useEffect(() => {
    if (textures.length !== materials.length) return;
    materials.forEach((mat, i) => { mat.map = textures[i]; mat.needsUpdate = true; });
  }, [textures, materials]);

  useEffect(() => {
    materials.forEach((mat, i) => {
      const active = hoveredFace === i || selectedFace === i;
      mat.opacity = active ? 1 : 0.88;
      mat.emissive = active ? new THREE.Color(0x4A90D9) : new THREE.Color(0x000000);
      mat.emissiveIntensity = active ? (selectedFace === i ? 0.25 : 0.15) : 0;
    });
  }, [hoveredFace, selectedFace, materials]);

  // Click a face → compute target quaternion to rotate that face toward camera
  const handleClick = useCallback((i: number) => {
    if (dragDist.current > 8) return; // was a drag, not a click

    if (selectedFace === i) {
      // Clicking the same face deselects
      onSelect(null);
      autoRotate.current = false;
      resumeTimer.current = setTimeout(() => { autoRotate.current = true; }, 3000);
      return;
    }

    onSelect(i);
    autoRotate.current = false;
    isAnimatingToFace.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);

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
      resumeTimer.current = setTimeout(() => { autoRotate.current = true; }, 3000);
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
      <group ref={groupRef}>
        {/* Textured faces */}
        {faces.map((face, i) => (
          <mesh
            key={i}
            geometry={face.geometry}
            material={materials[i]}
            onPointerEnter={() => handleHover(i)}
            onPointerLeave={() => handleHover(null)}
            onClick={() => handleClick(i)}
          />
        ))}

        {/* Glass outer shell — raycast disabled so clicks pass through to faces */}
        <mesh raycast={() => null}>
          <dodecahedronGeometry args={[RADIUS * 1.004, 0]} />
          <meshPhysicalMaterial
            color="#4A90D9"
            transparent
            opacity={0.07}
            roughness={0.02}
            metalness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.03}
            envMapIntensity={2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Glass inner shell — raycast disabled */}
        <mesh raycast={() => null}>
          <dodecahedronGeometry args={[RADIUS * 0.996, 0]} />
          <meshPhysicalMaterial
            color="#012A89"
            transparent
            opacity={0.04}
            roughness={0}
            metalness={0.3}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>

        <WireframeEdges />
        <VertexDots />
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
          <span className="font-mono text-sm text-white font-bold tracking-wider">
            {partner?.name ?? ''}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Detail panel — slides in when a face is selected
   ═══════════════════════════════════════════════════════ */

function DetailPanel({ partner, onClose }: { partner: Partner | null; onClose: () => void }) {
  const visible = partner !== null;

  return (
    <div
      className="absolute right-0 top-0 bottom-0 z-30 flex items-center pointer-events-none"
      style={{ width: '340px', maxWidth: '90vw' }}
    >
      <div
        className="pointer-events-auto w-full mx-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : 'translateX(40px)',
          transition: 'opacity 0.4s cubic-bezier(0.25,0.1,0.25,1), transform 0.4s cubic-bezier(0.25,0.1,0.25,1)',
        }}
      >
        {partner && (
          <div className="border border-[rgba(74,144,217,0.2)] bg-[rgba(1,14,47,0.92)] backdrop-blur-sm">
            {/* Top accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#4A90D9] to-transparent"></div>

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 bg-[#D31111]"></span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#D31111]">Partner</span>
                  </div>
                  <h3 className="font-mono text-lg font-bold text-white tracking-wider">{partner.name}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 border border-[rgba(74,144,217,0.2)] flex items-center justify-center text-[#8A919A] hover:text-white hover:border-[rgba(74,144,217,0.4)] transition-colors"
                  aria-label="Close detail panel"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="1" y1="1" x2="9" y2="9" />
                    <line x1="9" y1="1" x2="1" y2="9" />
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-[rgba(74,144,217,0.1)] mb-4"></div>

              {/* Specialty */}
              <div className="mb-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#4A90D9] block mb-1.5">Specialty</span>
                <span className="text-sm text-[#D1D5DB] font-medium">{partner.specialty}</span>
              </div>

              {/* Description */}
              <div className="mb-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#4A90D9] block mb-1.5">Overview</span>
                <p className="text-sm text-[#8A919A] leading-relaxed">{partner.description}</p>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-3 pt-3 border-t border-[rgba(74,144,217,0.08)]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 animate-pulse"></span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A919A]">Authorized Dealer</span>
                </div>
                <span className="w-px h-3 bg-[rgba(74,144,217,0.15)]"></span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A919A]">Direct Access</span>
              </div>
            </div>

            {/* Bottom accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#4A90D9] to-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Exported component
   ═══════════════════════════════════════════════════════ */

export default function PartnersDodecahedron() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="relative w-full" style={{ height: '650px' }}>
      <Canvas
        camera={{ position: [0, 0.3, 6.5], fov: 40 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 8, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-4, -2, -6]} intensity={0.5} color="#4A90D9" />
        <pointLight position={[0, 4, 3]} intensity={0.6} color="#ffffff" distance={15} />
        <pointLight position={[-3, -3, 2]} intensity={0.4} color="#4A90D9" distance={12} />
        <pointLight position={[3, 0, -3]} intensity={0.3} color="#6AB0FF" distance={10} />
        <Environment preset="city" environmentIntensity={0.2} />
        <fog attach="fog" args={['#010E2F', 8, 18]} />

        <Scene onHover={setHovered} onSelect={setSelected} selectedFace={selected} />
      </Canvas>

      {/* Hover label (hidden when detail panel is open) */}
      {selected === null && (
        <HoverLabel partner={hovered !== null ? PARTNERS[hovered] : null} />
      )}

      {/* Detail panel */}
      <DetailPanel
        partner={selected !== null ? PARTNERS[selected] : null}
        onClose={() => setSelected(null)}
      />

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="w-8 h-px bg-[rgba(74,144,217,0.2)]"></div>
        <span className="font-mono text-[10px] text-[rgba(74,144,217,0.5)] uppercase tracking-widest">
          {selected !== null ? 'Click face again to close' : 'Click a face · Drag to rotate'}
        </span>
        <div className="w-8 h-px bg-[rgba(74,144,217,0.2)]"></div>
      </div>
    </div>
  );
}
