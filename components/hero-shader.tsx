"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function useDarkTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

function Cup({ dark }: { dark: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const targetY = -0.22 + mouse.current.x * 0.2;
    const targetX = 0.06 + mouse.current.y * 0.06;
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.045;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.045;
    group.current.position.y = 0.02 + Math.sin(t * 0.7) * 0.01;
  });

  const ceramic = dark ? "#d2c9bb" : "#f6f2ea";
  const ceramicDark = dark ? "#8f8678" : "#d8d1c4";
  const coffee = dark ? "#160e09" : "#24160f";
  const crema = dark ? "#6e4728" : "#8f5e30";

  const cupProfile = useMemo(
    () => [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.52, 0.0),
      new THREE.Vector2(0.56, 0.04),
      new THREE.Vector2(0.68, 1.05),
      new THREE.Vector2(0.72, 1.12),
      new THREE.Vector2(0.7, 1.16),
      new THREE.Vector2(0.64, 1.14),
      new THREE.Vector2(0.58, 0.18),
      new THREE.Vector2(0.0, 0.14),
    ],
    [],
  );

  return (
    <group ref={group} position={[0.35, 0.02, 0]} scale={0.62}>
      <mesh>
        <latheGeometry args={[cupProfile, 80]} />
        <meshStandardMaterial color={ceramic} roughness={0.26} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 48]} />
        <meshStandardMaterial color={ceramicDark} roughness={0.55} metalness={0} />
      </mesh>

      <mesh position={[0, 1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.58, 64]} />
        <meshStandardMaterial color={coffee} roughness={0.42} metalness={0.18} />
      </mesh>

      <mesh position={[0, 1.053, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.55, 64]} />
        <meshStandardMaterial color={crema} roughness={0.55} metalness={0.05} transparent opacity={0.7} />
      </mesh>

      <mesh position={[0.72, 0.55, 0]} rotation={[0, 0, -0.12]}>
        <torusGeometry args={[0.28, 0.048, 24, 56, Math.PI * 1.2]} />
        <meshStandardMaterial color={ceramic} roughness={0.28} metalness={0.1} />
      </mesh>

      <Steam />
    </group>
  );
}

function Steam({ count = 480 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const base = useRef<Float32Array | null>(null);
  const speeds = useRef<Float32Array | null>(null);
  const phases = useRef<Float32Array | null>(null);

  const { positions, sizes, phaseAttr } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phaseAttr = new Float32Array(count);
    const spd = new Float32Array(count);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.7) * 0.3;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = Math.sin(a) * r;
      sizes[i] = 8 + Math.random() * 18;
      phaseAttr[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.2 + Math.random() * 0.38;
      ph[i] = Math.random();
    }
    base.current = positions.slice();
    speeds.current = spd;
    phases.current = ph;
    return { positions, sizes, phaseAttr };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#f8f4ed") },
    }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;
    const pts = pointsRef.current;
    const seed = base.current;
    const spd = speeds.current;
    const ph = phases.current;
    if (!pts || !seed || !spd || !ph) return;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const life = (t * spd[i] + ph[i]) % 1;
      const y = life * 1.55;
      const spread = 1 + life * life * 1.6;
      const swirl = Math.sin(t * 1.1 + phaseAttr[i]) * life * 0.11;
      arr[i3] = seed[i3] * spread + swirl;
      arr[i3 + 1] = 1.08 + y;
      arr[i3 + 2] = seed[i3 + 2] * spread + Math.cos(t * 0.85 + phaseAttr[i]) * life * 0.09;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phaseAttr, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          attribute float aSize;
          attribute float aPhase;
          uniform float uTime;
          varying float vLife;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vLife = clamp((position.y - 1.05) / 1.55, 0.0, 1.0);
            float pulse = 0.8 + 0.2 * sin(uTime * 2.2 + aPhase);
            gl_PointSize = aSize * pulse * (1.15 / max(-mv.z, 0.75));
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying float vLife;
          void main(){
            vec2 uv = gl_PointCoord - vec2(0.5);
            float d = length(uv);
            float alpha = smoothstep(0.5, 0.0, d);
            alpha *= pow(1.0 - vLife, 1.35) * 0.42;
            if (alpha < 0.012) discard;
            gl_FragColor = vec4(uColor, alpha);
          }
        `}
      />
    </points>
  );
}

function Scene({ dark }: { dark: boolean }) {
  const bg = dark ? "#14100D" : "#F3F1EC";
  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 4, 10]} />
      <ambientLight intensity={dark ? 0.38 : 0.58} />
      <directionalLight position={[2.8, 4.5, 2.2]} intensity={dark ? 1.05 : 1.25} />
      <directionalLight position={[-2.2, 1.6, -1.5]} intensity={0.35} color="#e8c9a0" />
      <pointLight position={[0.4, 1.4, 1.1]} intensity={0.4} color="#ffd9ad" distance={5} />
      <Cup dark={dark} />
    </>
  );
}

export function HeroShader() {
  const dark = useDarkTheme();
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div className="hero-canvas" onContextMenu={(e) => e.preventDefault()} aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [1.35, 1.05, 3.1], fov: 32, near: 0.1, far: 40 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("contextmenu", (e) => e.preventDefault());
        }}
        frameloop={reduce ? "demand" : "always"}
      >
        <Scene dark={dark} />
      </Canvas>
    </div>
  );
}
