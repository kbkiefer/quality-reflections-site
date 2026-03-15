import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════
   Shared materials
   ═══════════════════════════════════════════════════════ */

const GLASS_MAT_ARGS: THREE.MeshPhysicalMaterialParameters = {
  color: '#4A90D9',
  metalness: 0.0,
  roughness: 0.05,
  transmission: 0.92,
  thickness: 0.3,
  ior: 1.5,
  transparent: true,
  opacity: 0.6,
};

const FRAME_MAT_ARGS: THREE.MeshStandardMaterialParameters = {
  color: '#8A919A',
  metalness: 0.85,
  roughness: 0.25,
};

const FRAME_DARK_ARGS: THREE.MeshStandardMaterialParameters = {
  color: '#5A6270',
  metalness: 0.9,
  roughness: 0.2,
};

const GASKET_ARGS: THREE.MeshStandardMaterialParameters = {
  color: '#1A1A1A',
  metalness: 0.1,
  roughness: 0.8,
};

const HANDLE_ARGS: THREE.MeshStandardMaterialParameters = {
  color: '#C0C0C0',
  metalness: 0.95,
  roughness: 0.1,
};

/* ═══════════════════════════════════════════════════════
   Auto-rotating wrapper
   ═══════════════════════════════════════════════════════ */

function AutoRotate({ children, speed = 0.3 }: { children: React.ReactNode; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * speed;
    }
  });
  return <group ref={ref}>{children}</group>;
}

/* ═══════════════════════════════════════════════════════
   Helper: mullion cross-section (T-profile extrusion)
   ═══════════════════════════════════════════════════════ */

function Mullion({ position, size, rotation }: {
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Main web */}
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial {...FRAME_MAT_ARGS} />
      </mesh>
      {/* Front flange */}
      <mesh position={[0, 0, size[2] * 0.4]}>
        <boxGeometry args={[size[0] * 2.2, size[1], size[2] * 0.2]} />
        <meshStandardMaterial {...FRAME_MAT_ARGS} />
      </mesh>
      {/* Gasket strips */}
      <mesh position={[size[0] * 1.1, 0, size[2] * 0.25]}>
        <boxGeometry args={[size[0] * 0.3, size[1] * 0.98, size[2] * 0.1]} />
        <meshStandardMaterial {...GASKET_ARGS} />
      </mesh>
      <mesh position={[-size[0] * 1.1, 0, size[2] * 0.25]}>
        <boxGeometry args={[size[0] * 0.3, size[1] * 0.98, size[2] * 0.1]} />
        <meshStandardMaterial {...GASKET_ARGS} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Helper: glass panel with thickness
   ═══════════════════════════════════════════════════════ */

function GlassPanel({ position, size, rotation }: {
  position: [number, number, number];
  size: [number, number];
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]}>
      <boxGeometry args={[size[0], size[1], 0.02]} />
      <meshPhysicalMaterial {...GLASS_MAT_ARGS} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════
   1. Curtain Wall — 4x3 mullion grid with glass panels,
      cap profiles, and structural depth
   ═══════════════════════════════════════════════════════ */

function CurtainWallModel() {
  const mullionW = 0.035;
  const mullionD = 0.06;
  const panelW = 0.52;
  const panelH = 0.65;
  const cols = 4;
  const rows = 3;
  const totalW = cols * panelW + (cols + 1) * mullionW;
  const totalH = rows * panelH + (rows + 1) * mullionW;

  return (
    <AutoRotate speed={0.2}>
      <group position={[0, 0, 0]} scale={1.0}>
        {/* Vertical mullions with T-profile */}
        {Array.from({ length: cols + 1 }, (_, i) => {
          const x = -totalW / 2 + i * (panelW + mullionW) + mullionW / 2;
          return (
            <Mullion
              key={`v${i}`}
              position={[x, 0, 0]}
              size={[mullionW, totalH, mullionD]}
            />
          );
        })}
        {/* Horizontal mullions with T-profile */}
        {Array.from({ length: rows + 1 }, (_, j) => {
          const y = -totalH / 2 + j * (panelH + mullionW) + mullionW / 2;
          return (
            <Mullion
              key={`h${j}`}
              position={[0, y, 0]}
              size={[totalW, mullionW, mullionD]}
            />
          );
        })}
        {/* Glass panels with thickness */}
        {Array.from({ length: cols }, (_, i) =>
          Array.from({ length: rows }, (_, j) => (
            <GlassPanel
              key={`p${i}-${j}`}
              position={[
                -totalW / 2 + mullionW + i * (panelW + mullionW) + panelW / 2,
                -totalH / 2 + mullionW + j * (panelH + mullionW) + panelH / 2,
                0,
              ]}
              size={[panelW - 0.01, panelH - 0.01]}
            />
          ))
        )}
        {/* Head/sill anchors on top and bottom */}
        <mesh position={[0, totalH / 2 + 0.025, -mullionD * 0.3]}>
          <boxGeometry args={[totalW + 0.04, 0.03, mullionD * 1.2]} />
          <meshStandardMaterial {...FRAME_DARK_ARGS} />
        </mesh>
        <mesh position={[0, -totalH / 2 - 0.025, -mullionD * 0.3]}>
          <boxGeometry args={[totalW + 0.04, 0.03, mullionD * 1.2]} />
          <meshStandardMaterial {...FRAME_DARK_ARGS} />
        </mesh>
      </group>
    </AutoRotate>
  );
}

/* ═══════════════════════════════════════════════════════
   2. Storefront — wide frame with transom, door, sidelites
   ═══════════════════════════════════════════════════════ */

function StorefrontModel() {
  const w = 2.6;
  const h = 1.7;
  const f = 0.05;
  const transomH = 0.35;
  const doorW = 0.65;
  const sideW = (w - doorW - f * 4) / 2;

  return (
    <AutoRotate speed={0.25}>
      <group position={[0, 0, 0]} scale={0.95}>
        {/* Outer frame — top */}
        <mesh position={[0, h, 0]}><boxGeometry args={[w, f, f * 2.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        {/* Outer frame — bottom sill */}
        <mesh position={[0, 0, 0]}><boxGeometry args={[w, f * 0.8, f * 3]} /><meshStandardMaterial {...FRAME_DARK_ARGS} /></mesh>
        {/* Outer frame — left */}
        <mesh position={[-w / 2, h / 2, 0]}><boxGeometry args={[f, h + f, f * 2.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        {/* Outer frame — right */}
        <mesh position={[w / 2, h / 2, 0]}><boxGeometry args={[f, h + f, f * 2.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Transom bar */}
        <mesh position={[0, h - transomH, 0]}><boxGeometry args={[w - f, f, f * 2]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Vertical mullion — left of door */}
        <mesh position={[-doorW / 2 - f, (h - transomH) / 2, 0]}><boxGeometry args={[f, h - transomH - f, f * 2]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        {/* Vertical mullion — right of door */}
        <mesh position={[doorW / 2 + f, (h - transomH) / 2, 0]}><boxGeometry args={[f, h - transomH - f, f * 2]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Door frame (thicker) */}
        <mesh position={[-doorW / 2, (h - transomH) / 2, 0]}><boxGeometry args={[f * 0.6, h - transomH - f, f * 1.5]} /><meshStandardMaterial {...FRAME_DARK_ARGS} /></mesh>
        <mesh position={[doorW / 2, (h - transomH) / 2, 0]}><boxGeometry args={[f * 0.6, h - transomH - f, f * 1.5]} /><meshStandardMaterial {...FRAME_DARK_ARGS} /></mesh>

        {/* Transom glass */}
        <GlassPanel position={[0, h - transomH / 2 + f / 2, 0]} size={[w - f * 2.5, transomH - f * 1.5]} />

        {/* Left sidelite glass */}
        <GlassPanel
          position={[-(doorW / 2 + f + sideW / 2 + f / 2), (h - transomH) / 2, 0]}
          size={[sideW - f, h - transomH - f * 2]}
        />
        {/* Right sidelite glass */}
        <GlassPanel
          position={[(doorW / 2 + f + sideW / 2 + f / 2), (h - transomH) / 2, 0]}
          size={[sideW - f, h - transomH - f * 2]}
        />

        {/* Door glass */}
        <GlassPanel position={[0, (h - transomH) / 2, 0]} size={[doorW - f * 2, h - transomH - f * 2]} />

        {/* Door push bar (horizontal) */}
        <mesh position={[0, (h - transomH) * 0.45, f * 1.8]}>
          <boxGeometry args={[doorW * 0.6, 0.025, 0.03]} />
          <meshStandardMaterial {...HANDLE_ARGS} />
        </mesh>
        {/* Push bar mounts */}
        <mesh position={[-doorW * 0.25, (h - transomH) * 0.45, f * 1.2]}>
          <boxGeometry args={[0.02, 0.02, 0.06]} />
          <meshStandardMaterial {...HANDLE_ARGS} />
        </mesh>
        <mesh position={[doorW * 0.25, (h - transomH) * 0.45, f * 1.2]}>
          <boxGeometry args={[0.02, 0.02, 0.06]} />
          <meshStandardMaterial {...HANDLE_ARGS} />
        </mesh>

        {/* Threshold */}
        <mesh position={[0, f * 0.3, f * 0.5]}>
          <boxGeometry args={[doorW + f * 2, 0.02, f * 2]} />
          <meshStandardMaterial color="#3A4555" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </AutoRotate>
  );
}

/* ═══════════════════════════════════════════════════════
   3. Window Systems — projected casement, one panel open
   ═══════════════════════════════════════════════════════ */

function WindowModel() {
  const w = 1.4;
  const h = 1.6;
  const f = 0.05;
  const midH = h * 0.55;

  return (
    <AutoRotate speed={0.3}>
      <group>
        {/* Outer frame */}
        <mesh position={[0, h / 2, 0]}><boxGeometry args={[w + f, f, f * 2.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        <mesh position={[0, -h / 2, 0]}><boxGeometry args={[w + f, f * 1.2, f * 3]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        <mesh position={[-w / 2, 0, 0]}><boxGeometry args={[f, h + f, f * 2.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        <mesh position={[w / 2, 0, 0]}><boxGeometry args={[f, h + f, f * 2.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Center vertical divider */}
        <mesh position={[0, -h / 2 + midH / 2 + f / 2, 0]}><boxGeometry args={[f, midH, f * 2]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Horizontal meeting rail */}
        <mesh position={[0, -h / 2 + midH, 0]}><boxGeometry args={[w, f, f * 2]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Top fixed pane */}
        <GlassPanel
          position={[0, -h / 2 + midH + (h - midH) / 2, 0]}
          size={[w - f * 2, h - midH - f * 1.5]}
        />

        {/* Bottom left fixed pane */}
        <GlassPanel
          position={[-w / 4 - f / 4, -h / 2 + midH / 2 + f / 2, 0]}
          size={[w / 2 - f * 2, midH - f * 1.5]}
        />

        {/* Bottom right — projected open */}
        <group position={[w / 4 + f / 4, -h / 2 + midH, 0]}>
          <group rotation={[-0.2, 0, 0]}>
            {/* Sash frame */}
            <mesh position={[0, -midH / 2 + f, 0.06]}><boxGeometry args={[w / 2 - f * 2, f * 0.5, f * 0.8]} /><meshStandardMaterial {...FRAME_DARK_ARGS} /></mesh>
            <mesh position={[0, -midH + f * 1.5, 0.06]}><boxGeometry args={[w / 2 - f * 2, f * 0.5, f * 0.8]} /><meshStandardMaterial {...FRAME_DARK_ARGS} /></mesh>
            <mesh position={[-w / 4 + f * 1.2, -midH / 2, 0.06]}><boxGeometry args={[f * 0.5, midH - f * 2, f * 0.8]} /><meshStandardMaterial {...FRAME_DARK_ARGS} /></mesh>
            <mesh position={[w / 4 - f * 1.2, -midH / 2, 0.06]}><boxGeometry args={[f * 0.5, midH - f * 2, f * 0.8]} /><meshStandardMaterial {...FRAME_DARK_ARGS} /></mesh>
            {/* Glass */}
            <GlassPanel
              position={[0, -midH / 2 + f / 2, 0.06]}
              size={[w / 2 - f * 3, midH - f * 2.5]}
            />
          </group>
        </group>

        {/* Window hardware — operator arm */}
        <mesh position={[w / 4, -h / 2 + midH * 0.3, f * 1.5]}>
          <boxGeometry args={[0.08, 0.015, 0.015]} />
          <meshStandardMaterial {...HANDLE_ARGS} />
        </mesh>
      </group>
    </AutoRotate>
  );
}

/* ═══════════════════════════════════════════════════════
   4. Entrance Systems — glass door with sidelites + transom,
      door slightly ajar, full hardware
   ═══════════════════════════════════════════════════════ */

function EntranceModel() {
  const doorW = 0.85;
  const doorH = 1.9;
  const sideW = 0.45;
  const transomH = 0.3;
  const f = 0.05;
  const totalW = doorW + sideW * 2 + f * 6;
  const totalH = doorH + transomH + f * 2;

  return (
    <AutoRotate speed={0.25}>
      <group scale={0.72} position={[0, 0, 0]}>
        {/* Header */}
        <mesh position={[0, totalH, 0]}><boxGeometry args={[totalW + f, f * 1.5, f * 3]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        {/* Left jamb */}
        <mesh position={[-totalW / 2, totalH / 2, 0]}><boxGeometry args={[f, totalH + f, f * 3]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        {/* Right jamb */}
        <mesh position={[totalW / 2, totalH / 2, 0]}><boxGeometry args={[f, totalH + f, f * 3]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Transom bar */}
        <mesh position={[0, doorH + f, 0]}><boxGeometry args={[totalW - f, f, f * 2.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Door jamb mullions */}
        <mesh position={[-doorW / 2 - f * 1.5, doorH / 2, 0]}><boxGeometry args={[f, doorH, f * 2.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        <mesh position={[doorW / 2 + f * 1.5, doorH / 2, 0]}><boxGeometry args={[f, doorH, f * 2.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Transom glass */}
        <GlassPanel position={[0, doorH + f + transomH / 2, 0]} size={[totalW - f * 3, transomH - f]} />

        {/* Left sidelite glass */}
        <GlassPanel
          position={[-doorW / 2 - f * 1.5 - sideW / 2 - f, doorH / 2, 0]}
          size={[sideW - f, doorH - f]}
        />
        {/* Right sidelite glass */}
        <GlassPanel
          position={[doorW / 2 + f * 1.5 + sideW / 2 + f, doorH / 2, 0]}
          size={[sideW - f, doorH - f]}
        />

        {/* Door panel — slightly ajar */}
        <group position={[-doorW / 2, 0, 0]}>
          <group rotation={[0, -0.2, 0]} position={[doorW / 2, doorH / 2, 0]}>
            {/* Door glass */}
            <mesh>
              <boxGeometry args={[doorW - f, doorH - f, 0.025]} />
              <meshPhysicalMaterial {...GLASS_MAT_ARGS} side={THREE.DoubleSide} />
            </mesh>
            {/* Top rail */}
            <mesh position={[0, doorH / 2 - f * 0.8, 0]}>
              <boxGeometry args={[doorW - f, f * 0.6, f * 1.2]} />
              <meshStandardMaterial {...FRAME_DARK_ARGS} />
            </mesh>
            {/* Bottom rail (kick plate) */}
            <mesh position={[0, -doorH / 2 + f * 2.5, 0]}>
              <boxGeometry args={[doorW - f, f * 4, f * 1.2]} />
              <meshStandardMaterial {...FRAME_DARK_ARGS} />
            </mesh>
            {/* Vertical stiles */}
            <mesh position={[-doorW / 2 + f * 0.8, 0, 0]}>
              <boxGeometry args={[f * 0.6, doorH - f, f * 1.2]} />
              <meshStandardMaterial {...FRAME_DARK_ARGS} />
            </mesh>
            <mesh position={[doorW / 2 - f * 0.8, 0, 0]}>
              <boxGeometry args={[f * 0.6, doorH - f, f * 1.2]} />
              <meshStandardMaterial {...FRAME_DARK_ARGS} />
            </mesh>
            {/* Push bar */}
            <mesh position={[doorW * 0.2, 0, 0.05]}>
              <boxGeometry args={[0.02, 0.25, 0.035]} />
              <meshStandardMaterial {...HANDLE_ARGS} />
            </mesh>
            {/* Push bar mounts */}
            <mesh position={[doorW * 0.2, 0.1, 0.03]}>
              <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
              <meshStandardMaterial {...HANDLE_ARGS} />
            </mesh>
            <mesh position={[doorW * 0.2, -0.1, 0.03]}>
              <cylinderGeometry args={[0.012, 0.012, 0.04, 8]} />
              <meshStandardMaterial {...HANDLE_ARGS} />
            </mesh>
          </group>
        </group>

        {/* Floor/threshold */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[totalW + f, 0.025, f * 4]} />
          <meshStandardMaterial color="#3A4555" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Closer mechanism (top) */}
        <mesh position={[0, doorH - f * 0.5, f * 1.5]}>
          <boxGeometry args={[0.2, 0.04, 0.04]} />
          <meshStandardMaterial {...FRAME_DARK_ARGS} />
        </mesh>
      </group>
    </AutoRotate>
  );
}

/* ═══════════════════════════════════════════════════════
   5. Glass Railings — frameless glass with standoff fittings
      and stainless steel posts + top cap rail
   ═══════════════════════════════════════════════════════ */

function RailingModel() {
  const panelW = 0.75;
  const panelH = 1.0;
  const panels = 3;
  const postR = 0.022;
  const totalW = panels * panelW;

  return (
    <AutoRotate speed={0.3}>
      <group position={[0, 0, 0]}>
        {/* Posts — round stainless */}
        {Array.from({ length: panels + 1 }, (_, i) => (
          <group key={i} position={[-totalW / 2 + i * panelW, 0, 0]}>
            {/* Post shaft */}
            <mesh position={[0, panelH / 2, 0]}>
              <cylinderGeometry args={[postR, postR, panelH + 0.15, 12]} />
              <meshStandardMaterial {...HANDLE_ARGS} />
            </mesh>
            {/* Post base plate */}
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[postR * 2.5, postR * 2.5, 0.015, 12]} />
              <meshStandardMaterial {...HANDLE_ARGS} />
            </mesh>
            {/* Post cap */}
            <mesh position={[0, panelH + 0.08, 0]}>
              <sphereGeometry args={[postR * 1.3, 12, 8]} />
              <meshStandardMaterial {...HANDLE_ARGS} />
            </mesh>
          </group>
        ))}

        {/* Top cap rail — round profile */}
        <mesh position={[0, panelH + 0.065, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, totalW + 0.01, 12]} />
          <meshStandardMaterial {...HANDLE_ARGS} />
        </mesh>

        {/* Glass panels */}
        {Array.from({ length: panels }, (_, i) => (
          <group key={`g${i}`}>
            <GlassPanel
              position={[-totalW / 2 + panelW / 2 + i * panelW, panelH / 2, 0]}
              size={[panelW - postR * 5, panelH - 0.08]}
            />
            {/* Standoff fittings — 4 per panel */}
            {[[-0.22, 0.7], [0.22, 0.7], [-0.22, 0.2], [0.22, 0.2]].map(([dx, dy], fi) => (
              <group key={`fit-${i}-${fi}`} position={[-totalW / 2 + panelW / 2 + i * panelW + dx, dy, 0]}>
                <mesh position={[0, 0, 0.025]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.04, 8]} />
                  <meshStandardMaterial {...HANDLE_ARGS} />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Base channel — U-channel mount */}
        <mesh position={[0, -0.01, 0]}>
          <boxGeometry args={[totalW + 0.04, 0.025, 0.06]} />
          <meshStandardMaterial {...FRAME_DARK_ARGS} />
        </mesh>
        {/* Base channel inner walls */}
        <mesh position={[0, 0.01, 0.025]}>
          <boxGeometry args={[totalW + 0.04, 0.02, 0.008]} />
          <meshStandardMaterial {...FRAME_DARK_ARGS} />
        </mesh>
        <mesh position={[0, 0.01, -0.025]}>
          <boxGeometry args={[totalW + 0.04, 0.02, 0.008]} />
          <meshStandardMaterial {...FRAME_DARK_ARGS} />
        </mesh>

        {/* Floor surface */}
        <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[totalW + 0.3, 0.4]} />
          <meshStandardMaterial color="#2A3445" metalness={0.3} roughness={0.6} transparent opacity={0.4} />
        </mesh>
      </group>
    </AutoRotate>
  );
}

/* ═══════════════════════════════════════════════════════
   6. Skylight Systems — ridge skylight with purlins,
      multiple bays, and structural framing
   ═══════════════════════════════════════════════════════ */

function SkylightModel() {
  const baseW = 2.2;
  const baseD = 1.4;
  const ridgeH = 0.65;
  const f = 0.035;
  const bays = 3;
  const bayW = baseW / bays;

  return (
    <AutoRotate speed={0.2}>
      <group position={[0, 0, 0]} rotation={[0.35, 0, 0]}>
        {/* Curb / base frame */}
        <mesh position={[0, 0, 0]}><boxGeometry args={[baseW + f * 2, f * 1.5, baseD + f * 2]} /><meshStandardMaterial {...FRAME_DARK_ARGS} /></mesh>

        {/* Eave beams (long sides) */}
        <mesh position={[0, f, -baseD / 2]}><boxGeometry args={[baseW, f * 1.5, f * 1.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        <mesh position={[0, f, baseD / 2]}><boxGeometry args={[baseW, f * 1.5, f * 1.5]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Ridge beam */}
        <mesh position={[0, ridgeH + f, 0]}><boxGeometry args={[baseW, f * 1.8, f * 1.8]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* End walls */}
        <mesh position={[-baseW / 2, ridgeH / 2 + f, 0]}><boxGeometry args={[f * 1.5, ridgeH, baseD]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>
        <mesh position={[baseW / 2, ridgeH / 2 + f, 0]}><boxGeometry args={[f * 1.5, ridgeH, baseD]} /><meshStandardMaterial {...FRAME_MAT_ARGS} /></mesh>

        {/* Rafters (slope from ridge to eave) — both sides per bay */}
        {Array.from({ length: bays + 1 }, (_, i) => {
          const x = -baseW / 2 + i * bayW;
          const rafterLen = Math.sqrt(ridgeH * ridgeH + (baseD / 2) * (baseD / 2));
          const angle = Math.atan2(ridgeH, baseD / 2);
          return (
            <group key={`raf${i}`}>
              {/* Front rafter */}
              <mesh position={[x, ridgeH / 2 + f, -baseD / 4]} rotation={[angle, 0, 0]}>
                <boxGeometry args={[f, rafterLen, f]} />
                <meshStandardMaterial {...FRAME_MAT_ARGS} />
              </mesh>
              {/* Back rafter */}
              <mesh position={[x, ridgeH / 2 + f, baseD / 4]} rotation={[-angle, 0, 0]}>
                <boxGeometry args={[f, rafterLen, f]} />
                <meshStandardMaterial {...FRAME_MAT_ARGS} />
              </mesh>
            </group>
          );
        })}

        {/* Purlins (horizontal bars mid-slope) */}
        <mesh position={[0, ridgeH * 0.5 + f, -baseD * 0.28]}>
          <boxGeometry args={[baseW, f * 0.6, f * 0.6]} />
          <meshStandardMaterial {...FRAME_MAT_ARGS} />
        </mesh>
        <mesh position={[0, ridgeH * 0.5 + f, baseD * 0.28]}>
          <boxGeometry args={[baseW, f * 0.6, f * 0.6]} />
          <meshStandardMaterial {...FRAME_MAT_ARGS} />
        </mesh>

        {/* Glass panels — front slope per bay */}
        {Array.from({ length: bays }, (_, i) => {
          const x = -baseW / 2 + bayW / 2 + i * bayW;
          const slopeAngle = Math.atan2(ridgeH, baseD / 2);
          const panelLen = Math.sqrt(ridgeH * ridgeH + (baseD / 2) * (baseD / 2)) * 0.85;
          return (
            <group key={`glass${i}`}>
              {/* Front glass */}
              <mesh position={[x, ridgeH / 2 + f, -baseD / 4]} rotation={[slopeAngle, 0, 0]}>
                <boxGeometry args={[bayW - f * 2, panelLen, 0.015]} />
                <meshPhysicalMaterial {...GLASS_MAT_ARGS} side={THREE.DoubleSide} />
              </mesh>
              {/* Back glass */}
              <mesh position={[x, ridgeH / 2 + f, baseD / 4]} rotation={[-slopeAngle, 0, 0]}>
                <boxGeometry args={[bayW - f * 2, panelLen, 0.015]} />
                <meshPhysicalMaterial {...GLASS_MAT_ARGS} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })}

        {/* End wall glass (triangular — approximated as trapezoid) */}
        {[-baseW / 2, baseW / 2].map((x, idx) => (
          <mesh key={`endglass${idx}`} position={[x, ridgeH * 0.4 + f, 0]}>
            <boxGeometry args={[0.015, ridgeH * 0.6, baseD * 0.7]} />
            <meshPhysicalMaterial {...GLASS_MAT_ARGS} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </AutoRotate>
  );
}

/* ═══════════════════════════════════════════════════════
   Model selector
   ═══════════════════════════════════════════════════════ */

const MODELS: Record<string, () => JSX.Element> = {
  'curtain-wall': CurtainWallModel,
  'storefront': StorefrontModel,
  'window': WindowModel,
  'entrance': EntranceModel,
  'railing': RailingModel,
  'skylight': SkylightModel,
};

// Extra scale boost for models that need to fill more of their frame
const MODEL_SCALE: Record<string, number> = {
  'curtain-wall': 1.7,
  'railing': 1.35,
};

/* ═══════════════════════════════════════════════════════
   Auto-framing: computes bounding box of model,
   centers it, and positions camera to fit with padding
   ═══════════════════════════════════════════════════════ */

function AutoFrame({ children, boost = 1 }: { children: React.ReactNode; boost?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!groupRef.current) return;

    // Wait a frame for geometries to be ready
    requestAnimationFrame(() => {
      if (!groupRef.current) return;

      const box = new THREE.Box3().setFromObject(groupRef.current);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the model at origin
      groupRef.current.position.set(-center.x, -center.y, -center.z);

      // Position camera to fit the model with padding
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera as THREE.PerspectiveCamera).fov;
      const dist = (maxDim / 2) / Math.tan((fov * Math.PI) / 360) * (1.15 / boost); // padding, adjusted by boost

      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      setReady(true);
    });
  }, [camera]);

  return (
    <group visible={ready}>
      <group ref={groupRef}>
        {children}
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Exported component
   ═══════════════════════════════════════════════════════ */

export default function ServiceModel({ type }: { type: string }) {
  const ModelComponent = MODELS[type];
  if (!ModelComponent) return null;

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 35 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 5, 4]} intensity={0.8} color="#ffffff" />
        <directionalLight position={[-3, -1, -4]} intensity={0.3} color="#4A90D9" />
        <pointLight position={[0, 2, 2]} intensity={0.4} color="#ffffff" distance={10} />
        <Environment preset="city" environmentIntensity={0.15} />

        <AutoFrame boost={MODEL_SCALE[type] || 1}>
          <ModelComponent />
        </AutoFrame>
      </Canvas>
    </div>
  );
}
