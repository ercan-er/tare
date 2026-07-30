"use client";

import { useEffect, useRef } from "react";

/*
 * Cursor-reactive WebGL "coffee/steam" hero background. A single full-screen
 * triangle runs a fragment shader: domain-warped fbm fluid, rising steam on
 * top, heat glow + ripple around the pointer, and coffee beans drifting behind
 * the fluid. Theme-aware (dark: espresso+crema, light: latte/cream). No deps.
 *
 * Performance: DPR <= 2, pauses while the tab is hidden or the hero is off
 * screen, draws a single frame under reduced-motion. When WebGL is missing it
 * simply draws nothing (the CSS fallback shows through).
 */

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;   // uv space [0,1], y up
uniform float uDark;    // 1.0 dark theme, 0.0 light

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i + vec2(0.0, 0.0));
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p){
  float v = 0.0;
  float amp = 0.5;
  for(int i = 0; i < 5; i++){
    v += amp * noise(p);
    p = p * 2.02 + vec2(3.1, 1.7);
    amp *= 0.5;
  }
  return v;
}

vec2 hash2(vec2 p){
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
                        dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

// A single coffee bean: elongated ellipse with a center crease.
float bean(vec2 gv, vec2 off, float r, float ang){
  vec2 d = gv - off;
  float s = sin(ang), c = cos(ang);
  d = mat2(c, -s, s, c) * d;
  d.x /= 1.7;                                   // elongate -> bean shape
  float dist = length(d);
  float body = smoothstep(r, r * 0.45, dist);
  float crease = smoothstep(r * 0.16, 0.0, abs(d.y)) * step(dist, r) * 0.4;
  return clamp(body - crease, 0.0, 1.0);
}

// Coffee beans drifting behind the fluid — 3 parallax layers for depth.
float beans(vec2 uv, float aspect, float t){
  float acc = 0.0;
  for(int i = 0; i < 3; i++){
    float fl = float(i);
    float scale = 5.0 + fl * 4.0;
    vec2 p = vec2(uv.x * aspect, uv.y) * scale;
    p.y += t * (0.25 + 0.12 * fl);              // float upward
    p.x += sin(t * 0.2 + fl * 2.0) * 0.3;       // gentle sway
    vec2 id = floor(p);
    vec2 gv = fract(p) - 0.5;
    vec2 h = hash2(id + fl * 37.0);
    float present = step(0.55, h.x);            // ~45% of cells hold a bean
    vec2 off = (hash2(id + 7.3 * fl) - 0.5) * 0.5;
    float r = mix(0.12, 0.22, h.y) * (1.0 - fl * 0.16);
    float ang = (h.x + h.y) * 6.283 + t * 0.3;
    acc += bean(gv, off, r, ang) * present * (0.9 - fl * 0.22);
  }
  return clamp(acc, 0.0, 1.0);
}

void main(){
  float aspect = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = vec2(uv.x * aspect, uv.y) * 2.6;

  float t = uTime * 0.05;

  // pointer effect (fluid ripple + heat)
  vec2 m = vec2(uMouse.x * aspect, uMouse.y) * 2.6;
  float md = distance(p, m);
  float ripple = sin(md * 5.0 - uTime * 1.6) * exp(-md * 1.4) * 0.35;

  // domain warp
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p + 1.8 * q + vec2(1.7, 9.2) + 0.15 * t + ripple),
    fbm(p + 1.8 * q + vec2(8.3, 2.8) + 0.126 * t + ripple)
  );
  float f = fbm(p + 1.6 * r);

  // palettes
  vec3 dark1 = vec3(0.043, 0.031, 0.024);
  vec3 dark2 = vec3(0.235, 0.113, 0.051);
  vec3 dark3 = vec3(0.545, 0.318, 0.145);
  vec3 dark4 = vec3(0.878, 0.627, 0.361);

  vec3 lite1 = vec3(0.965, 0.937, 0.878);
  vec3 lite2 = vec3(0.858, 0.749, 0.576);
  vec3 lite3 = vec3(0.635, 0.435, 0.247);
  vec3 lite4 = vec3(0.443, 0.278, 0.153);

  vec3 c1 = mix(lite1, dark1, uDark);
  vec3 c2 = mix(lite2, dark2, uDark);
  vec3 c3 = mix(lite3, dark3, uDark);
  vec3 c4 = mix(lite4, dark4, uDark);

  vec3 col = mix(c1, c2, smoothstep(0.15, 0.9, f));

  // coffee beans drifting behind (crema/steam pass in front of them)
  float bmask = beans(uv, aspect, uTime * 0.10);
  vec3 beanCol = mix(vec3(0.27, 0.15, 0.07), vec3(0.74, 0.49, 0.28), uDark);
  col = mix(col, beanCol, bmask * 0.42);

  col = mix(col, c3, smoothstep(0.35, 0.95, r.y));
  // crema/highlight band
  float band = smoothstep(0.55, 0.95, f) * smoothstep(0.95, 0.55, r.x);
  col = mix(col, c4, band * 0.6);

  // rising steam (stronger toward the top)
  float steam = fbm(vec2(p.x * 1.3, p.y * 0.9 - uTime * 0.22));
  steam *= smoothstep(0.32, 1.0, uv.y);
  vec3 steamCol = mix(vec3(1.0), vec3(0.92, 0.86, 0.8), uDark);
  col += steamCol * steam * steam * (0.10 + 0.05 * uDark);

  // pointer heat glow
  float glow = exp(-md * 2.2);
  col += vec3(0.95, 0.55, 0.25) * glow * (0.18 + 0.22 * uDark);

  // subtle vignette + grain (avoids banding)
  float vig = smoothstep(1.25, 0.2, length(uv - 0.5));
  col *= mix(0.82, 1.0, vig);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.015;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[hero-shader] shader compile error:", gl.getShaderInfoLog(sh));
    }
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function HeroShader() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" }) as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return; // CSS fallback takes over

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uMouse = gl.getUniformLocation(prog, "uMouse");
    const uDark = gl.getUniformLocation(prog, "uDark");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // state
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: 0.5, y: 0.55 };       // target
    const smooth = { x: 0.5, y: 0.55 };      // smoothed
    let dark = document.documentElement.dataset.theme === "dark" ? 1 : 0;
    let raf = 0;
    let visible = true;
    const start = performance.now();

    const resize = () => {
      const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
      const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const render = (now: number) => {
      const t = (now - start) / 1000;
      smooth.x += (mouse.x - smooth.x) * 0.06;
      smooth.y += (mouse.y - smooth.y) * 0.06;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, smooth.x, smooth.y);
      gl.uniform1f(uDark, dark);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      render(now);
      raf = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (raf || reduce) return;
      raf = requestAnimationFrame(loop);
    };
    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // events
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      mouse.y = 1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    };
    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else if (visible) startLoop();
    };
    const ro = new ResizeObserver(() => { resize(); if (reduce) render(performance.now()); });
    ro.observe(canvas.parentElement || canvas);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible && !document.hidden) startLoop();
        else stopLoop();
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    const mo = new MutationObserver(() => {
      dark = document.documentElement.dataset.theme === "dark" ? 1 : 0;
      if (reduce) render(performance.now());
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    if (reduce) render(performance.now());
    else startLoop();

    return () => {
      stopLoop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }, []);

  return <canvas ref={ref} className="hero-canvas" aria-hidden="true" />;
}
