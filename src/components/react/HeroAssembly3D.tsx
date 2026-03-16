import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════
   Layer metadata
   ═══════════════════════════════════════════════════════ */

interface LayerMeta {
  name: string;
  desc: string;
  fillOpacity: number;
  edgeOpacity: number;
  /** Where the label anchors relative to layer centroid [x, y, z] */
  labelAnchor: [number, number, number];
}

const LAYERS: LayerMeta[] = [
  { name: 'Floor Slab', desc: 'Reinforced concrete deck providing structural support and fire-rated separation between floors.', fillOpacity: 0.06, edgeOpacity: 0.2, labelAnchor: [1.8, 0, 0.5] },
  { name: 'Structural Anchor', desc: 'Steel embed plates and aluminum brackets transferring wind and dead loads to the primary structure while allowing thermal expansion.', fillOpacity: 0.08, edgeOpacity: 0.3, labelAnchor: [1.6, 0, 0.5] },
  { name: 'Thermal Break', desc: 'Polyamide isolator strips eliminating conductive heat transfer through the aluminum frame assembly.', fillOpacity: 0.05, edgeOpacity: 0.25, labelAnchor: [1.5, 0.2, 0.5] },
  { name: 'Vertical Mullion', desc: 'Extruded aluminum verticals spanning floor-to-floor, engineered to resist design wind pressures and carry glazing dead loads.', fillOpacity: 0.1, edgeOpacity: 0.4, labelAnchor: [1.7, 0.3, 0.5] },
  { name: 'Horizontal Rail', desc: 'Pressure-equalized transom members with integral weep drainage and snap-on cover design.', fillOpacity: 0.1, edgeOpacity: 0.4, labelAnchor: [1.7, 0, 0.5] },
  { name: 'Perimeter Seal', desc: 'Dual-durometer EPDM gaskets forming the primary air and water barrier at all glass-to-frame interfaces.', fillOpacity: 0.04, edgeOpacity: 0.18, labelAnchor: [1.5, 0, 0.5] },
  { name: 'Insulated Glass Unit', desc: '1" dual-pane IGU: Low-E coated outer lite, argon-filled cavity, laminated safety inner lite. Rated for large-missile impact zones.', fillOpacity: 0.07, edgeOpacity: 0.55, labelAnchor: [1.6, 0.2, 0.5] },
  { name: 'Glazing Cap', desc: 'Exterior pressure plates securing glass units against perimeter gaskets with stainless steel structural fasteners.', fillOpacity: 0.06, edgeOpacity: 0.3, labelAnchor: [1.7, 0.1, 0.5] },
  { name: 'Fire Safing', desc: 'Mineral wool safing insulation providing 2-hour fire containment at the perimeter slab edge condition.', fillOpacity: 0.04, edgeOpacity: 0.15, labelAnchor: [1.6, -0.1, 0.5] },
];

/* ═══════════════════════════════════════════════════════
   Geometry
   ═══════════════════════════════════════════════════════ */

interface LayerGeom {
  pieces: { pos: [number, number, number]; size: [number, number, number]; type: 'box' | 'glass' }[];
  explodeOffset: [number, number, number];
  assembleDelay: number;
}

const SCALE = 0.35;

const LAYER_GEOMS: LayerGeom[] = [
  { pieces: [{ pos: [0, -2.8, 0], size: [6, 0.5, 3], type: 'box' }], explodeOffset: [0, -3, 0], assembleDelay: 0 },
  { pieces: [
    { pos: [-1.8, -2.2, 0], size: [0.3, 0.8, 0.3], type: 'box' },
    { pos: [-1.8, -2.55, 0.2], size: [0.3, 0.15, 0.5], type: 'box' },
    { pos: [0, -2.2, 0], size: [0.3, 0.8, 0.3], type: 'box' },
    { pos: [0, -2.55, 0.2], size: [0.3, 0.15, 0.5], type: 'box' },
    { pos: [1.8, -2.2, 0], size: [0.3, 0.8, 0.3], type: 'box' },
    { pos: [1.8, -2.55, 0.2], size: [0.3, 0.15, 0.5], type: 'box' },
  ], explodeOffset: [0, -1.5, 1.5], assembleDelay: 0.08 },
  { pieces: [
    { pos: [-1.8, 0, 0.02], size: [0.18, 4, 0.06], type: 'box' },
    { pos: [0, 0, 0.02], size: [0.18, 4, 0.06], type: 'box' },
    { pos: [1.8, 0, 0.02], size: [0.18, 4, 0.06], type: 'box' },
  ], explodeOffset: [0, 0, 2], assembleDelay: 0.2 },
  { pieces: [
    { pos: [-1.8, 0, 0], size: [0.22, 4.5, 0.35], type: 'box' },
    { pos: [0, 0, 0], size: [0.22, 4.5, 0.35], type: 'box' },
    { pos: [1.8, 0, 0], size: [0.22, 4.5, 0.35], type: 'box' },
  ], explodeOffset: [-2, 0.5, 0], assembleDelay: 0.15 },
  { pieces: [
    { pos: [0, 1.8, 0], size: [3.6, 0.15, 0.3], type: 'box' },
    { pos: [0, 0, 0], size: [3.6, 0.15, 0.3], type: 'box' },
    { pos: [0, -1.8, 0], size: [3.6, 0.15, 0.3], type: 'box' },
  ], explodeOffset: [2, 0, 0.5], assembleDelay: 0.3 },
  { pieces: [
    { pos: [-0.9, 0.9, 0.18], size: [1.55, 0.06, 0.04], type: 'box' },
    { pos: [-0.9, -0.9, 0.18], size: [1.55, 0.06, 0.04], type: 'box' },
    { pos: [0.9, 0.9, 0.18], size: [1.55, 0.06, 0.04], type: 'box' },
    { pos: [0.9, -0.9, 0.18], size: [1.55, 0.06, 0.04], type: 'box' },
  ], explodeOffset: [0, 0, 2.5], assembleDelay: 0.45 },
  { pieces: [
    { pos: [-0.9, 0.9, 0.2], size: [1.35, 1.55, 0.12], type: 'glass' },
    { pos: [-0.9, -0.9, 0.2], size: [1.35, 1.55, 0.12], type: 'glass' },
    { pos: [0.9, 0.9, 0.2], size: [1.35, 1.55, 0.12], type: 'glass' },
    { pos: [0.9, -0.9, 0.2], size: [1.35, 1.55, 0.12], type: 'glass' },
  ], explodeOffset: [0, 0, 3.5], assembleDelay: 0.55 },
  { pieces: [
    { pos: [-1.8, 0, 0.35], size: [0.14, 4, 0.06], type: 'box' },
    { pos: [0, 0, 0.35], size: [0.14, 4, 0.06], type: 'box' },
    { pos: [1.8, 0, 0.35], size: [0.14, 4, 0.06], type: 'box' },
    { pos: [0, 1.8, 0.35], size: [3.6, 0.08, 0.06], type: 'box' },
    { pos: [0, 0, 0.35], size: [3.6, 0.08, 0.06], type: 'box' },
    { pos: [0, -1.8, 0.35], size: [3.6, 0.08, 0.06], type: 'box' },
  ], explodeOffset: [0, 0, 4], assembleDelay: 0.7 },
  { pieces: [
    { pos: [0, -1.95, 0.15], size: [3.8, 0.25, 0.5], type: 'box' },
  ], explodeOffset: [0, -2, 2], assembleDelay: 0.85 },
];

// Precompute centroid Y for each layer (used for label positioning)
const LAYER_CENTROIDS: [number, number, number][] = LAYER_GEOMS.map((layer) => {
  const cx = layer.pieces.reduce((s, p) => s + p.pos[0], 0) / layer.pieces.length;
  const cy = layer.pieces.reduce((s, p) => s + p.pos[1], 0) / layer.pieces.length;
  const cz = layer.pieces.reduce((s, p) => s + p.pos[2], 0) / layer.pieces.length;
  return [cx * SCALE, cy * SCALE, cz * SCALE];
});

/* ═══════════════════════════════════════════════════════
   Easing
   ═══════════════════════════════════════════════════════ */

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/* ═══════════════════════════════════════════════════════
   Holographic fill shader
   ═══════════════════════════════════════════════════════ */

const holoVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holoFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uHighlight;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
    fresnel = pow(fresnel, 2.5);
    float baseAlpha = uOpacity * 0.4;
    float edgeAlpha = fresnel * uOpacity * 2.0;
    float scan = sin(vWorldPos.y * 8.0 - uTime * 0.8) * 0.5 + 0.5;
    float scanAlpha = scan * 0.02;
    float alpha = baseAlpha + edgeAlpha + scanAlpha;
    vec3 col = uColor;
    if (uHighlight > 1.5) {
      col = mix(uColor, vec3(0.42, 0.69, 1.0), 0.5);
      alpha *= 2.5;
    } else if (uHighlight > 0.5) {
      col = mix(uColor, vec3(0.29, 0.56, 0.85), 0.3);
      alpha *= 1.8;
    }
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.6));
  }
`;

/* ═══════════════════════════════════════════════════════
   Edge pulse shader
   ═══════════════════════════════════════════════════════ */

const edgeVertexShader = `
  varying vec3 vWorldPos;
  void main() {
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const edgeFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uBaseOpacity;
  uniform float uHighlight;
  varying vec3 vWorldPos;
  void main() {
    float pulse = sin(vWorldPos.y * 4.0 - uTime * 1.2) * 0.5 + 0.5;
    float alpha = uBaseOpacity + pulse * 0.15;
    vec3 col = uColor;
    if (uHighlight > 1.5) {
      col = vec3(0.42, 0.69, 1.0);
      alpha = 0.95;
    } else if (uHighlight > 0.5) {
      col = mix(uColor, vec3(0.42, 0.69, 1.0), 0.4);
      alpha *= 1.6;
    }
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ═══════════════════════════════════════════════════════
   3D-anchored label that floats next to the selected layer
   Uses drei's Html to project into screen space
   ═══════════════════════════════════════════════════════ */

function FloatingLabel({ layerIdx, onClose }: { layerIdx: number; onClose: () => void }) {
  const meta = LAYERS[layerIdx];
  const anchor = meta.labelAnchor;
  const centroid = LAYER_CENTROIDS[layerIdx];

  const position: [number, number, number] = [
    centroid[0] + anchor[0],
    centroid[1] + anchor[1],
    centroid[2] + anchor[2],
  ];

  return (
    <group position={position}>
      <LeaderLine from={[centroid[0] - position[0], centroid[1] - position[1], centroid[2] - position[2]]} to={[0, 0, 0]} />

      <Html
        center={false}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
        distanceFactor={3.5}
        transform={false}
        zIndexRange={[20, 30]}
      >
        <div style={{
          width: 'min(240px, 50vw)',
          border: '1px solid rgba(74,144,217,0.22)',
          background: 'rgba(1,14,47,0.94)',
          backdropFilter: 'blur(16px)',
          marginLeft: '12px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(74,144,217,0.08)',
        }}>
          {/* Top accent — matches card-glow-bg */}
          <div style={{ height: '1px', background: 'linear-gradient(to right, #4A90D9, rgba(74,144,217,0.3), transparent)' }} />

          <div style={{ padding: '12px 14px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '22px', height: '22px',
                  border: '1px solid rgba(74,144,217,0.2)',
                  background: 'rgba(1,42,137,0.15)',
                  color: '#4A90D9',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '8px', fontWeight: 500,
                  lineHeight: '22px', textAlign: 'center',
                  display: 'inline-block', flexShrink: 0,
                }}>B{layerIdx + 1}</span>
                <span style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px', fontWeight: 600,
                  color: 'white', letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>{meta.name}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
                width: '20px', height: '20px',
                border: '1px solid rgba(74,144,217,0.15)',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#8A919A', cursor: 'pointer', padding: 0,
              }} aria-label="Close">
                <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
                </svg>
              </button>
            </div>

            {/* Thin separator */}
            <div style={{ height: '1px', background: 'rgba(74,144,217,0.1)', marginBottom: '8px' }} />

            {/* Description */}
            <p style={{
              fontSize: '11px', color: '#A0A7B0', lineHeight: 1.6, margin: 0,
              fontFamily: '"Inter", sans-serif',
            }}>{meta.desc}</p>
          </div>

          <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(74,144,217,0.06), transparent)' }} />
        </div>
      </Html>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Leader line — thin line from piece to label
   ═══════════════════════════════════════════════════════ */

function LeaderLine({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  // Create an L-shaped leader: horizontal from piece, then angled to label
  const midPoint: [number, number, number] = [to[0] * 0.3, from[1], from[2]];

  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector3(...from),
      new THREE.Vector3(...midPoint),
      new THREE.Vector3(...to),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [from, midPoint, to]);

  const mat = useMemo(() => new THREE.LineBasicMaterial({
    color: '#4A90D9',
    transparent: true,
    opacity: 0.4,
  }), []);

  // Dot at the piece connection point
  const dotGeo = useMemo(() => new THREE.SphereGeometry(0.02, 8, 8), []);
  const dotMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#4A90D9', transparent: true, opacity: 0.7 }), []);

  return (
    <group>
      <line geometry={geo} material={mat} />
      <mesh geometry={dotGeo} material={dotMat} position={from} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Assembly Scene
   ═══════════════════════════════════════════════════════ */

function AssemblyScene({ onHover, onSelect, hoveredLayer, selectedLayer }: {
  onHover: (idx: number | null) => void;
  onSelect: (idx: number | null) => void;
  hoveredLayer: number | null;
  selectedLayer: number | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(0);
  const assembled = useRef(false);
  const rotAngle = useRef(0);

  const DELAY = 0.8;
  const DURATION = 4;

  useFrame((state) => {
    if (!groupRef.current) return;
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;

    if (assembled.current) {
      rotAngle.current += 0.003;
    } else if (elapsed > DELAY) {
      rotAngle.current += 0.002;
    }

    const rotY = Math.sin(rotAngle.current) * 0.3 - 0.3;
    const rotX = 0.15 + Math.sin(rotAngle.current * 0.7) * 0.05;
    groupRef.current.rotation.set(rotX, rotY, 0);

    if (elapsed > DELAY + DURATION) assembled.current = true;
  });

  const getExplodeFactor = useCallback((layerIdx: number, elapsed: number) => {
    if (elapsed < DELAY) return 1;
    const t = (elapsed - DELAY) / DURATION;
    const layerDelay = LAYER_GEOMS[layerIdx].assembleDelay;
    const layerProgress = Math.max(0, Math.min(1, (t - layerDelay) / 0.35));
    return 1 - easeOutExpo(layerProgress);
  }, []);

  return (
    <group ref={groupRef}>
      {LAYER_GEOMS.map((layer, layerIdx) => (
        <group key={layerIdx}>
          {layer.pieces.map((piece, pieceIdx) => (
            <HoloPiece
              key={pieceIdx}
              pos={piece.pos}
              size={piece.size}
              type={piece.type}
              layerIdx={layerIdx}
              hovered={hoveredLayer === layerIdx}
              selected={selectedLayer === layerIdx}
              getExplodeFactor={getExplodeFactor}
              onHover={onHover}
              onSelect={onSelect}
            />
          ))}
        </group>
      ))}

      {/* Leader line to selected layer centroid */}
      {selectedLayer !== null && (
        <LeaderLine
          from={[LAYER_CENTROIDS[selectedLayer][0], LAYER_CENTROIDS[selectedLayer][1], LAYER_CENTROIDS[selectedLayer][2]]}
          to={[LAYER_CENTROIDS[selectedLayer][0], LAYER_CENTROIDS[selectedLayer][1] - 0.5, LAYER_CENTROIDS[selectedLayer][2]]}
        />
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Holographic piece
   ═══════════════════════════════════════════════════════ */

function HoloPiece({
  pos, size, type, layerIdx, hovered, selected,
  getExplodeFactor, onHover, onSelect,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  type: 'box' | 'glass';
  layerIdx: number;
  hovered: boolean;
  selected: boolean;
  getExplodeFactor: (idx: number, elapsed: number) => number;
  onHover: (idx: number | null) => void;
  onSelect: (idx: number | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startTime = useRef(0);
  const meta = LAYERS[layerIdx];
  const offset = LAYER_GEOMS[layerIdx].explodeOffset;
  const highlight = selected ? 2 : hovered ? 1 : 0;

  const fillMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: holoVertexShader,
    fragmentShader: holoFragmentShader,
    uniforms: {
      uColor: { value: type === 'glass' ? new THREE.Color('#4A90D9') : new THREE.Color('#1a4080') },
      uOpacity: { value: meta.fillOpacity },
      uTime: { value: 0 },
      uHighlight: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    side: type === 'glass' ? THREE.DoubleSide : THREE.FrontSide,
  }), [type, meta]);

  const edgeMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: edgeVertexShader,
    fragmentShader: edgeFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#4A90D9') },
      uBaseOpacity: { value: meta.edgeOpacity },
      uHighlight: { value: 0 },
    },
    transparent: true,
    depthTest: true,
  }), [meta]);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (startTime.current === 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;

    const factor = getExplodeFactor(layerIdx, elapsed);

    groupRef.current.position.set(
      (pos[0] + offset[0] * factor) * SCALE,
      (pos[1] + offset[1] * factor) * SCALE,
      (pos[2] + offset[2] * factor) * SCALE,
    );

    const t = state.clock.elapsedTime;
    fillMat.uniforms.uTime.value = t;
    fillMat.uniforms.uHighlight.value = highlight;
    edgeMat.uniforms.uTime.value = t;
    edgeMat.uniforms.uHighlight.value = highlight;
  });

  const geo = useMemo(
    () => new THREE.BoxGeometry(size[0] * SCALE, size[1] * SCALE, size[2] * SCALE),
    [size],
  );
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);

  return (
    <group ref={groupRef}>
      <mesh
        geometry={geo}
        material={fillMat}
        onPointerEnter={(e) => { e.stopPropagation(); onHover(layerIdx); }}
        onPointerLeave={() => onHover(null)}
        onClick={(e) => { e.stopPropagation(); onSelect(layerIdx); }}
      />
      <lineSegments geometry={edgeGeo} material={edgeMat} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Hover label (HTML overlay)
   ═══════════════════════════════════════════════════════ */

function HoverLabel({ name }: { name: string | null }) {
  return (
    <div style={{
      position: 'absolute', top: '8px', left: '50%',
      transform: 'translateX(-50%)',
      opacity: name ? 1 : 0,
      transition: 'opacity 0.2s ease',
      pointerEvents: 'none', zIndex: 20,
    }}>
      <div style={{
        border: '1px solid rgba(74,144,217,0.12)',
        background: 'rgba(1,14,47,0.85)',
        padding: '2px 8px',
        display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        <span style={{ width: '3px', height: '3px', background: '#4A90D9', flexShrink: 0 }} />
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '8px', color: '#4A90D9', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {name}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Responsive camera — widens FOV as container shrinks
   ═══════════════════════════════════════════════════════ */

function ResponsiveCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    // At 800px+ width → FOV 32, at 400px → FOV 48
    const fov = THREE.MathUtils.clamp(32 + (800 - size.width) * 0.04, 32, 48);
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }, [camera, size.width]);
  return null;
}

/* ═══════════════════════════════════════════════════════
   Exported component
   ═══════════════════════════════════════════════════════ */

export default function HeroAssembly3D() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = useCallback((idx: number | null) => {
    setSelected((prev) => (prev === idx ? null : idx));
  }, []);

  const selectedMeta = selected !== null ? LAYERS[selected] : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <Canvas
          camera={{ position: [0, 0.3, 5], fov: 32 }}
          style={{ background: 'transparent' }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 2]}
        >
          <ResponsiveCamera />
          <ambientLight intensity={0.08} color="#4A90D9" />
          <directionalLight position={[3, 5, 4]} intensity={0.15} color="#6AB0FF" />

          <AssemblyScene
            onHover={setHovered}
            onSelect={handleSelect}
            hoveredLayer={hovered}
            selectedLayer={selected}
          />
        </Canvas>

        {selected === null && (
          <HoverLabel name={hovered !== null ? LAYERS[hovered].name : null} />
        )}
      </div>

      {/* Description panel below the 3D model — pulled back from parent's negative right offset */}
      <div style={{
        opacity: selectedMeta ? 1 : 0,
        transform: selectedMeta ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: selectedMeta ? 'auto' : 'none',
        padding: '0 4px',
        paddingRight: '12rem',
        marginLeft: 'auto',
        width: '100%',
        maxWidth: '560px',
        boxSizing: 'border-box',
      }}>
        {selectedMeta && (
          <div style={{
            border: '1px solid rgba(74,144,217,0.18)',
            background: 'rgba(1,14,47,0.92)',
            backdropFilter: 'blur(12px)',
          }}>
            <div style={{ height: '1px', background: 'linear-gradient(to right, #4A90D9, rgba(74,144,217,0.2), transparent)' }} />
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '26px', height: '26px',
                    border: '1px solid rgba(74,144,217,0.2)',
                    background: 'rgba(1,42,137,0.15)',
                    color: '#4A90D9',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '10px', fontWeight: 500,
                    lineHeight: '26px', textAlign: 'center',
                    display: 'inline-block', flexShrink: 0,
                  }}>B{selected! + 1}</span>
                  <span style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '15px', fontWeight: 600,
                    color: 'white', letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>{selectedMeta.name}</span>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  width: '24px', height: '24px',
                  border: '1px solid rgba(74,144,217,0.15)',
                  background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#8A919A', cursor: 'pointer', padding: 0,
                }} aria-label="Close">
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
                  </svg>
                </button>
              </div>
              <div style={{ height: '1px', background: 'rgba(74,144,217,0.1)', marginBottom: '8px' }} />
              <p style={{
                fontSize: '14px', color: '#A0A7B0', lineHeight: 1.65, margin: 0,
                fontFamily: '"Inter", sans-serif',
              }}>{selectedMeta.desc}</p>
            </div>
            <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(74,144,217,0.06), transparent)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
