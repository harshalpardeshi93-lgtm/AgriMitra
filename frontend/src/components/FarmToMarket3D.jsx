import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Lightweight hook to detect prefers-reduced-motion
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  return prefersReducedMotion;
}

// 1. Farmer Node (Scaled up to 1.3)
function FarmerNode({ position, reducedMotion }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (reducedMotion) return;
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Slower, more gentle float
      groupRef.current.position.y = position[1] + Math.sin(time * 0.8) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={1.3}>
      {/* Base Platform */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.6, 1.7, 0.2, 24]} />
        <meshStandardMaterial color="#dcfce7" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Soil base for crops (Expanded slightly to act as the primary ground) */}
      <mesh receiveShadow position={[-0.2, 0.06, 0.2]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[1.9, 0.04, 1.5]} />
        <meshStandardMaterial color="#78350f" roughness={1} />
      </mesh>

      {/* Stylized Indian Farmer */}
      <group position={[0.4, 0.45, -0.2]} rotation={[0, -0.3, 0]}>
        {/* Legs / Dhoti */}
        <mesh castShadow position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.22, 0.28, 0.3, 8]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.9} />
        </mesh>
        {/* Torso */}
        <mesh castShadow position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.4, 8]} />
          <meshStandardMaterial color="#d97706" roughness={0.7} />
        </mesh>
        {/* Head */}
        <mesh castShadow position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#fcd34d" roughness={0.6} />
        </mesh>
        {/* Turban/Safa */}
        <mesh castShadow position={[0, 0.58, 0]} rotation={[0.2, 0, 0.1]}>
          <cylinderGeometry args={[0.17, 0.17, 0.15, 8]} />
          <meshStandardMaterial color="#ef4444" roughness={0.9} />
        </mesh>
        {/* Tool (Staff) */}
        <mesh castShadow position={[-0.3, 0.1, 0.2]} rotation={[0, 0, -0.2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.8} />
        </mesh>
      </group>

      {/* Field / Crops in Rows */}
      <group position={[-0.2, 0.1, 0.2]} rotation={[0, 0.3, 0]}>
        {[-0.8, -0.2, 0.4, 1.0].map((x, rowIdx) => (
          [-0.6, 0, 0.6].map((z, colIdx) => (
            <mesh castShadow position={[x, 0.1, z]} key={`${rowIdx}-${colIdx}`}>
              <coneGeometry args={[0.08, 0.3, 5]} />
              <meshStandardMaterial color="#22c55e" roughness={0.6} />
            </mesh>
          ))
        ))}
      </group>
    </group>
  );
}

// 2. Market Node (Scaled down to 0.9)
function MarketNode({ position, reducedMotion }) {
  const groupRef = useRef();
  const ringsRef = useRef();

  useFrame((state) => {
    if (reducedMotion) return;
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(time * 0.8 + 1) * 0.03;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y = time * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={0.9}>
      {/* Base Platform */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.6, 1.7, 0.2, 24]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Mandi Building */}
      <group position={[0.2, 0, -0.2]}>
        <mesh castShadow position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.8, 0.9, 0.9, 8]} />
          <meshStandardMaterial color="#b45309" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.65, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.2} />
        </mesh>
      </group>

      {/* Market Data Indicator Rings */}
      <group ref={ringsRef} position={[0.2, 1.6, -0.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.85, 32]} />
          <meshBasicMaterial color="#fcd34d" side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 0.98, 32, 1, 0, Math.PI * 1.5]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Produce Area with Awning */}
      <group position={[-0.6, 0, 0.6]} rotation={[0, Math.PI/6, 0]}>
        {/* Awning */}
        <mesh castShadow position={[0, 0.7, 0]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[1.4, 0.04, 1]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.7} />
        </mesh>
        {/* Awning Posts */}
        <mesh castShadow position={[-0.6, 0.35, -0.4]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh castShadow position={[0.6, 0.35, -0.4]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh castShadow position={[-0.6, 0.3, 0.4]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh castShadow position={[0.6, 0.3, 0.4]}>
          <cylinderGeometry args={[0.03, 0.03, 0.6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>

        {/* Stacked Crates */}
        <mesh castShadow position={[-0.3, 0.15, 0.2]}>
          <boxGeometry args={[0.35, 0.3, 0.35]} />
          <meshStandardMaterial color="#a3e635" />
        </mesh>
        <mesh castShadow position={[0.2, 0.15, 0.1]} rotation={[0, -0.2, 0]}>
          <boxGeometry args={[0.35, 0.3, 0.35]} />
          <meshStandardMaterial color="#84cc16" />
        </mesh>
        <mesh castShadow position={[-0.1, 0.45, 0.15]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.35, 0.3, 0.35]} />
          <meshStandardMaterial color="#bef264" />
        </mesh>
        <mesh castShadow position={[-0.4, 0.15, -0.2]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.35, 0.3, 0.35]} />
          <meshStandardMaterial color="#fcd34d" />
        </mesh>
      </group>
    </group>
  );
}

// 3. AI Intelligence Node (Scaled down to 0.8)
function AINode({ position, reducedMotion }) {
  const groupRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    if (reducedMotion) return;
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(time * 1.0) * 0.04;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = time * 0.4;
      ringRef.current.rotation.x = Math.sin(time * 0.4) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={0.8}>
      {/* AI Core */}
      <mesh castShadow>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#a855f7" metalness={0.4} roughness={0.3} emissive="#7e22ce" emissiveIntensity={0.6} />
      </mesh>

      {/* Analytical Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.4, 0.02, 8, 32]} />
        <meshStandardMaterial color="#d8b4fe" metalness={0.8} roughness={0.1} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// 4. Buyer Node (Scaled down to 0.8)
function BuyerNode({ position, reducedMotion }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (reducedMotion) return;
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(time * 0.8 + 2) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={0.8}>
      {/* Base Platform */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.6, 1.7, 0.2, 24]} />
        <meshStandardMaterial color="#e0f2fe" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Corporate Building */}
      <group position={[0.2, 0, -0.2]}>
        <mesh castShadow position={[0, 0.8, 0]}>
          <boxGeometry args={[1.1, 1.6, 1.1]} />
          <meshStandardMaterial color="#0369a1" roughness={0.2} metalness={0.6} />
        </mesh>
        {/* Simple Windows (Stylized) */}
        <mesh position={[0, 1.1, 0.56]}>
          <boxGeometry args={[0.8, 0.3, 0.02]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.6, 0.56]}>
          <boxGeometry args={[0.8, 0.3, 0.02]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} />
        </mesh>
      </group>

      {/* Loading Dock / Procurement Area */}
      <group position={[-0.6, 0, 0.5]}>
        <mesh castShadow position={[0, 0.2, 0]}>
          <boxGeometry args={[0.8, 0.4, 0.8]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Ramp */}
        <mesh castShadow position={[-0.55, 0.1, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.4, 0.05, 0.6]} />
          <meshStandardMaterial color="#0c4a6e" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// 5. Data Flow Curve
function DataFlow({ start, end, color, reducedMotion, offsetTime = 0, heightOffset = 1.2 }) {
  const curve = useMemo(() => {
    return new THREE.CubicBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(start[0] + (end[0] - start[0]) * 0.33, Math.max(start[1], end[1]) + heightOffset, start[2] + 0.4),
      new THREE.Vector3(start[0] + (end[0] - start[0]) * 0.66, Math.max(start[1], end[1]) + heightOffset, end[2] - 0.4),
      new THREE.Vector3(...end)
    );
  }, [start, end, heightOffset]);

  const particleRef = useRef();

  useFrame((state) => {
    if (reducedMotion) return;
    const time = state.clock.getElapsedTime();
    const t = ((time * 0.25) + offsetTime) % 1; // Slower flow
    const point = curve.getPoint(t);
    if (particleRef.current) {
      particleRef.current.position.copy(point);
      // Subtle scale pulse
      const scale = 1 + Math.sin(time * 5) * 0.2;
      particleRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 32, 0.02, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {!reducedMotion && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
      )}
    </group>
  );
}

function BackgroundDust() {
  const points = useMemo(() => {
    const p = new Float32Array(30 * 3);
    for (let i = 0; i < 30 * 3; i+=3) {
      p[i] = (Math.random() - 0.5) * 14;
      p[i+1] = Math.random() * 6 + 0.5;
      p[i+2] = (Math.random() - 0.5) * 10;
    }
    return p;
  }, []);

  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.02; // Slower rotation
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#10b981" size={0.06} transparent opacity={0.3} />
    </points>
  );
}

function Scene() {
  const reducedMotion = usePrefersReducedMotion();

  // Very Gentle Mouse Parallax
  useFrame((state) => {
    if (reducedMotion) return;
    // Adapt camera framing based on viewport aspect ratio
    const isMobile = state.viewport.aspect < 1;
    // We want the farmer to stay left on desktop, centered on mobile.
    // The scene center of mass is shifted due to the diagonal layout.
    // Farmer is at [-2.5, 0.15, 1.5]
    const baseCamX = isMobile ? -0.5 : -2.0;
    const baseCamY = isMobile ? 5.0 : 4.0;
    const lookAtX = isMobile ? -0.5 : -1.0;

    const targetX = (state.pointer.x * 0.4);
    const targetY = (state.pointer.y * 0.15);
    state.camera.position.x += (baseCamX + targetX - state.camera.position.x) * 0.03;
    state.camera.position.y += (baseCamY + targetY - state.camera.position.y) * 0.03;

    // Smoothly adjust z position for zoom
    const targetZ = isMobile ? 12 : 10;
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.03;

    state.camera.lookAt(lookAtX, 0, 0);
  });

  return (
    <>
      {/* Warmer, softer lighting setup */}
      <ambientLight intensity={0.9} color="#fffbeb" />
      <directionalLight
        position={[8, 12, 5]}
        intensity={1.1}
        color="#fef3c7"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
      />
      {/* Soft fill lights */}
      <pointLight position={[-4, 3, 2]} color="#34d399" intensity={0.6} distance={10} />
      <pointLight position={[0, 3, 2]} color="#fbbf24" intensity={0.6} distance={10} />
      <pointLight position={[4, 3, 2]} color="#38bdf8" intensity={0.6} distance={10} />
      {/* AI node subtle purple fill light */}
      <pointLight position={[1.5, 3, 0]} color="#a855f7" intensity={0.5} distance={8} />

      {/* REPLACED: Giant Ground Disc was removed. Platforms now sit independently. */}

      <FarmerNode position={[-2.5, 0.15, 1.5]} reducedMotion={reducedMotion} />
      <MarketNode position={[0.5, 0.15, -0.5]} reducedMotion={reducedMotion} />
      <AINode position={[1.8, 1.8, -1.0]} reducedMotion={reducedMotion} />
      <BuyerNode position={[3.5, 0.15, -2.0]} reducedMotion={reducedMotion} />

      {/* Flow: Farmer -> Market */}
      <DataFlow start={[-2.5, 0.6, 1.5]} end={[0.5, 1.0, -0.5]} color="#10b981" reducedMotion={reducedMotion} offsetTime={0} heightOffset={1.2} />

      {/* Flow: Market -> AI Intelligence */}
      <DataFlow start={[0.5, 1.0, -0.5]} end={[1.8, 1.8, -1.0]} color="#f59e0b" reducedMotion={reducedMotion} offsetTime={0.3} heightOffset={0.5} />

      {/* Flow: AI Intelligence -> Buyer Match */}
      <DataFlow start={[1.8, 1.8, -1.0]} end={[3.5, 0.8, -2.0]} color="#a855f7" reducedMotion={reducedMotion} offsetTime={0.7} heightOffset={0.8} />

      {!reducedMotion && <BackgroundDust />}
    </>
  );
}

// Fallback detection
const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

export default function FarmToMarket3D() {
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    setWebglSupported(isWebGLAvailable());
  }, []);

  if (!webglSupported) {
    return (
      <div className="w-full h-full p-6 flex flex-col justify-end items-center text-center pb-20">
        <div className="text-xs font-semibold uppercase tracking-wider text-agrigreen-500 mb-6">{t("farm3d.value_chain")}</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full max-w-3xl">
          <div className="bg-surface-card/80 backdrop-blur-md p-3 rounded-xl border border-agrigreen-500/20 flex flex-col items-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-agrigreen-500/20 text-agrigreen-500 flex items-center justify-center font-bold text-xs mb-2">🌱</div>
            <span className="text-xs font-bold text-agrigreen-700">{t("farm3d.farmer")}</span>
            <span className="text-[9px] text-text-secondary mt-1">{t("farm3d.produce")}</span>
          </div>
          <div className="bg-surface-card/80 backdrop-blur-md p-3 rounded-xl border border-amber-100 flex flex-col items-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs mb-2">🏛️</div>
            <span className="text-xs font-bold text-amber-800">{t("farm3d.market_data")}</span>
            <span className="text-[9px] text-text-secondary mt-1">{t("farm3d.market_data")}</span>
          </div>
          <div className="bg-surface-card/80 backdrop-blur-md p-3 rounded-xl border border-purple-100 flex flex-col items-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs mb-2">✨</div>
            <span className="text-xs font-bold text-purple-800">{t("farm3d.ai_insight")}</span>
            <span className="text-[9px] text-text-secondary mt-1">{t("farm3d.smart_decision")}</span>
          </div>
          <div className="bg-surface-card/80 backdrop-blur-md p-3 rounded-xl border border-sky-100 flex flex-col items-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs mb-2">🏢</div>
            <span className="text-xs font-bold text-sky-800">{t("farm3d.buyer_match")}</span>
            <span className="text-[9px] text-text-secondary mt-1">{t("farm3d.direct_connection")}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      <Canvas
        shadows
        camera={{ position: [-2, 4, 10], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
