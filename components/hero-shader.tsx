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
    group.current.position.y = -0.72 + Math.sin(t * 0.7) * 0.01;
  });

  const ceramic = dark ? "#d2c9bb" : "#f6f2ea";
  const ceramicDark = dark ? "#8f8678" : "#d8d1c4";
  const coffee = dark ? "#160e09" : "#24160f";
  const crema = dark ? "#6e4728" : "#8f5e30";

  // Outer wall → rolled rim → inner wall → floor (lathe about Y).
  const cupProfile = useMemo(
    () => [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.48, 0.0),
      new THREE.Vector2(0.52, 0.05),
      new THREE.Vector2(0.62, 0.95),
      new THREE.Vector2(0.66, 1.08),
      // Rim bead
      new THREE.Vector2(0.7, 1.14),
      new THREE.Vector2(0.68, 1.2),
      new THREE.Vector2(0.62, 1.2),
      new THREE.Vector2(0.58, 1.14),
      // Inner wall down
      new THREE.Vector2(0.55, 0.22),
      new THREE.Vector2(0.0, 0.18),
    ],
    [],
  );

  const handleCurve = useMemo(() => {
    // Attach on the outer wall, loop out and back like a mug handle.
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.61, 0.88, 0),
        new THREE.Vector3(0.78, 0.92, 0),
        new THREE.Vector3(0.98, 0.72, 0),
        new THREE.Vector3(0.98, 0.42, 0),
        new THREE.Vector3(0.78, 0.28, 0),
        new THREE.Vector3(0.6, 0.32, 0),
      ],
      false,
      "catmullrom",
      0.45,
    );
  }, []);

  const handleGeo = useMemo(
    () => new THREE.TubeGeometry(handleCurve, 64, 0.055, 16, false),
    [handleCurve],
  );

  const rimGeo = useMemo(() => new THREE.TorusGeometry(0.64, 0.028, 20, 80), []);

  return (
    <group ref={group} position={[0.4, -0.72, 0]} scale={0.58}>
      <mesh>
        <latheGeometry args={[cupProfile, 96]} />
        <meshStandardMaterial color={ceramic} roughness={0.28} metalness={0.08} />
      </mesh>

      {/* Soft rounded rim cap so the lip reads clean from the camera. */}
      <mesh position={[0, 1.17, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={rimGeo}>
        <meshStandardMaterial color={ceramic} roughness={0.24} metalness={0.1} />
      </mesh>

      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.52, 48]} />
        <meshStandardMaterial color={ceramicDark} roughness={0.55} metalness={0} />
      </mesh>

      <mesh position={[0, 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.54, 64]} />
        <meshStandardMaterial color={coffee} roughness={0.4} metalness={0.15} />
      </mesh>

      <mesh position={[0, 1.103, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.5, 64]} />
        <meshStandardMaterial
          color={crema}
          roughness={0.55}
          metalness={0.05}
          transparent
          opacity={0.65}
        />
      </mesh>

      <mesh geometry={handleGeo}>
        <meshStandardMaterial color={ceramic} roughness={0.28} metalness={0.08} />
      </mesh>
      {/* Cap the tube ends so they blend into the wall. */}
      <mesh position={[0.61, 0.88, 0]}>
        <sphereGeometry args={[0.056, 16, 16]} />
        <meshStandardMaterial color={ceramic} roughness={0.28} metalness={0.08} />
      </mesh>
      <mesh position={[0.6, 0.32, 0]}>
        <sphereGeometry args={[0.056, 16, 16]} />
        <meshStandardMaterial color={ceramic} roughness={0.28} metalness={0.08} />
      </mesh>

      <Smoke dark={dark} />
    </group>
  );
}

/** Soft rising smoke plumes from the coffee surface — not point particles. */
function Smoke({ dark }: { dark: boolean }) {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.ShaderMaterial[]>([]);
  const color = dark ? "#c8c0b4" : "#ebe6dc";

  const uniformsList = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) => ({
        uTime: { value: 0 },
        uSeed: { value: i * 1.7 + 0.3 },
        uColor: { value: new THREE.Color(color) },
        uAlpha: { value: 0.28 - i * 0.03 },
      })),
    [color],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cam = state.camera;
    for (let i = 0; i < mats.current.length; i++) {
      const m = mats.current[i];
      if (m) m.uniforms.uTime.value = t;
    }
    const g = group.current;
    if (!g) return;
    for (const child of g.children) {
      child.lookAt(cam.position);
    }
  });

  const plumes = [
    { pos: [0.02, 1.42, 0.02] as const, scale: [0.7, 1.25, 1] as const },
    { pos: [-0.1, 1.58, 0.06] as const, scale: [0.58, 1.45, 1] as const },
    { pos: [0.12, 1.62, -0.05] as const, scale: [0.52, 1.55, 1] as const },
    { pos: [-0.03, 1.85, -0.08] as const, scale: [0.62, 1.5, 1] as const },
    { pos: [0.06, 2.05, 0.04] as const, scale: [0.48, 1.3, 1] as const },
  ];

  return (
    <group ref={group}>
      {plumes.map((p, i) => (
        <mesh
          key={i}
          position={[p.pos[0], p.pos[1], p.pos[2]]}
          scale={[p.scale[0], p.scale[1], p.scale[2]]}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1.7]} />
          <shaderMaterial
            ref={(el) => {
              if (el) mats.current[i] = el;
            }}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.NormalBlending}
            uniforms={uniformsList[i]}
            vertexShader={`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform float uTime;
              uniform float uSeed;
              uniform vec3 uColor;
              uniform float uAlpha;
              varying vec2 vUv;

              float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
              }
              float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                float a = hash(i);
                float b = hash(i + vec2(1.0, 0.0));
                float c = hash(i + vec2(0.0, 1.0));
                float d = hash(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
              }
              float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                for (int i = 0; i < 5; i++) {
                  v += a * noise(p);
                  p *= 2.1;
                  a *= 0.5;
                }
                return v;
              }

              void main() {
                vec2 uv = vUv;
                float rise = uTime * 0.28 + uSeed;
                // Drift upward + gentle sway so it reads as steam, not sparks.
                vec2 nUv = vec2(
                  uv.x * 2.2 + sin(rise * 1.3 + uv.y * 4.0) * 0.22,
                  uv.y * 1.6 - rise
                );
                float n = fbm(nUv + vec2(uSeed, 0.0));
                float column = smoothstep(0.05, 0.38, uv.x) * smoothstep(0.95, 0.62, uv.x);
                column *= smoothstep(0.0, 0.18, uv.y) * pow(smoothstep(1.0, 0.2, uv.y), 1.2);
                float wisps = smoothstep(0.32, 0.78, n);
                float a = column * wisps * uAlpha;
                a *= 0.7 + 0.3 * sin(uTime * 1.1 + uSeed * 2.0);
                if (a < 0.012) discard;
                gl_FragColor = vec4(uColor, a);
              }
            `}
          />
        </mesh>
      ))}
    </group>
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
        camera={{ position: [1.2, 0.55, 2.85], fov: 34, near: 0.1, far: 40 }}
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
