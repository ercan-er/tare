"use client";

import { useEffect, useRef } from "react";

/*
 * Procedural WebGL hero: a filled coffee cup with steam rising from the liquid.
 * Everything is drawn in the fragment shader (no image assets → nothing to
 * right-click-save). Theme-aware; pauses off-screen / reduced-motion.
 */

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;
uniform float uDark;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), u.x),
             mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i=0;i<5;i++){ v += a*noise(p); p = p*2.03 + vec2(1.7,3.1); a *= 0.5; }
  return v;
}
float sdEllipse(vec2 p, vec2 r){
  return (length(p/r) - 1.0) * min(r.x, r.y);
}
float sdBox(vec2 p, vec2 b){
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
float sdOrientedBox(vec2 p, vec2 a, vec2 b, float th){
  float l = length(b - a);
  vec2 d = (b - a) / l;
  vec2 q = p - (a + b) * 0.5;
  q = mat2(d.x, -d.y, d.y, d.x) * q;
  q = abs(q) - vec2(l * 0.5, th);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

void main(){
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  // scene space: cup sits on the right half
  vec2 sp = vec2((uv.x - 0.72) * aspect * 1.15, (uv.y - 0.38) * 1.15);

  float t = uTime;

  // soft background atmosphere
  vec3 bgDark = vec3(0.08, 0.05, 0.035);
  vec3 bgLite = vec3(0.96, 0.94, 0.90);
  vec3 bg = mix(bgLite, bgDark, uDark);
  float wash = fbm(vec2(uv.x * aspect, uv.y) * 2.2 + t * 0.03);
  bg = mix(bg, mix(vec3(0.90,0.82,0.70), vec3(0.18,0.10,0.06), uDark), wash * 0.18);

  // cup geometry (body + rim + liquid + handle)
  float cupW = 0.28;
  float cupH = 0.34;
  // tapered cup body
  vec2 bp = sp - vec2(0.0, -0.02);
  float taper = 1.0 + bp.y * 0.55;
  vec2 bodyP = vec2(bp.x / taper, bp.y);
  float body = sdBox(bodyP, vec2(cupW, cupH));
  body = max(body, -sdBox(bodyP - vec2(0.0, cupH * 0.15), vec2(cupW * 0.82, cupH * 0.95)));

  // outer wall ring
  float wall = abs(body) - 0.018;
  float cupMask = 1.0 - smoothstep(0.0, 0.01, body);

  // top ellipse (opening)
  vec2 rimC = vec2(0.0, cupH - 0.02);
  float rim = sdEllipse(sp - rimC, vec2(cupW * 1.05, 0.07));
  float rimBand = 1.0 - smoothstep(0.0, 0.012, abs(rim));

  // liquid surface (slightly below rim)
  vec2 liqC = rimC - vec2(0.0, 0.035);
  float liq = sdEllipse(sp - liqC, vec2(cupW * 0.92, 0.055));
  float liqFill = 1.0 - smoothstep(0.0, 0.008, liq);
  // only draw liquid inside cup opening
  float inOpening = 1.0 - smoothstep(0.0, 0.01, rim);

  // handle (right side)
  float handle = sdOrientedBox(sp, vec2(cupW * 0.95, 0.08), vec2(cupW * 1.45, 0.02), 0.035);
  float handleHole = sdOrientedBox(sp, vec2(cupW * 1.05, 0.08), vec2(cupW * 1.32, 0.02), 0.012);
  handle = max(handle, -handleHole);
  float handleMask = 1.0 - smoothstep(0.0, 0.008, handle);

  // saucer
  float saucer = sdEllipse(sp - vec2(0.0, -cupH - 0.02), vec2(cupW * 1.45, 0.05));
  float saucerMask = 1.0 - smoothstep(0.0, 0.01, saucer);

  // colors
  vec3 ceramic = mix(vec3(0.94, 0.92, 0.88), vec3(0.22, 0.18, 0.14), uDark);
  vec3 ceramicShade = mix(vec3(0.82, 0.78, 0.72), vec3(0.12, 0.09, 0.07), uDark);
  vec3 coffee = mix(vec3(0.22, 0.12, 0.06), vec3(0.10, 0.05, 0.02), uDark);
  vec3 crema = mix(vec3(0.72, 0.52, 0.30), vec3(0.45, 0.28, 0.14), uDark);

  vec3 col = bg;

  // saucer under
  col = mix(col, ceramicShade, saucerMask * 0.85);

  // cup body shading
  float shade = smoothstep(-cupW, cupW, sp.x) * 0.35 + 0.15;
  vec3 cupCol = mix(ceramic, ceramicShade, shade);
  col = mix(col, cupCol, cupMask * step(body, 0.02));
  col = mix(col, ceramic, rimBand * 0.9);
  col = mix(col, ceramicShade, handleMask * 0.95);

  // coffee + crema swirl on liquid
  float swirl = fbm((sp - liqC) * 8.0 + vec2(t * 0.15, -t * 0.08));
  vec3 liquidCol = mix(coffee, crema, smoothstep(0.35, 0.75, swirl) * 0.55);
  // highlight ring near rim edge
  float gloss = exp(-abs(rim) * 40.0) * 0.35;
  liquidCol += vec3(1.0, 0.9, 0.75) * gloss * (0.2 + 0.3 * (1.0 - uDark));
  float liquidMask = liqFill * inOpening;
  col = mix(col, liquidCol, liquidMask);

  // STEAM — originates from liquid surface, rises and fades
  float steamAcc = 0.0;
  for(int i = 0; i < 4; i++){
    float fi = float(i);
    // sample above the cup rim, drift upward over time
    vec2 base = sp - liqC;
    float rise = fract(t * (0.12 + fi * 0.03) + fi * 0.27);
    vec2 st = vec2(
      base.x * (1.4 - rise * 0.6) + sin(t * 0.7 + fi * 2.1 + base.y * 4.0) * 0.04 * rise,
      base.y - 0.02 - rise * 0.55
    );
    float plume = fbm(st * vec2(3.5, 2.2) + vec2(fi * 5.0, -t * 0.4));
    plume = smoothstep(0.35, 0.85, plume);
    // horizontal falloff from cup center + vertical fade as it rises
    float hx = exp(-pow(base.x / (cupW * 0.85), 2.0));
    float vy = smoothstep(0.0, 0.04, -base.y + 0.02) * (1.0 - smoothstep(0.15, 0.62, -base.y));
    // only above liquid
    float above = step(liqC.y - 0.01, sp.y);
    steamAcc += plume * hx * vy * above * (0.55 - fi * 0.08);
  }
  steamAcc = clamp(steamAcc, 0.0, 1.0);
  vec3 steamCol = mix(vec3(1.0, 0.98, 0.95), vec3(0.85, 0.80, 0.74), uDark);
  col = mix(col, steamCol, steamAcc * (0.55 + 0.2 * uDark));

  // soft shadow under cup
  float sh = sdEllipse(sp - vec2(0.02, -cupH - 0.06), vec2(cupW * 1.2, 0.04));
  col *= 1.0 - (1.0 - smoothstep(0.0, 0.04, sh)) * 0.18;

  // pointer warmth near cup
  vec2 m = vec2((uMouse.x - 0.72) * aspect * 1.15, (uMouse.y - 0.38) * 1.15);
  float md = length(sp - m);
  col += vec3(0.95, 0.55, 0.25) * exp(-md * 3.0) * (0.12 + 0.15 * uDark);

  // vignette + grain
  float vig = smoothstep(1.3, 0.25, length(uv - vec2(0.55, 0.45)));
  col *= mix(0.88, 1.0, vig);
  col += (hash(gl_FragCoord.xy + t) - 0.5) * 0.02;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[hero-shader] compile:", gl.getShaderInfoLog(sh));
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

    // Discourage casual asset theft — no image URL; block context menu / drag.
    const block = (e: Event) => e.preventDefault();
    canvas.addEventListener("contextmenu", block);
    canvas.addEventListener("dragstart", block);

    const gl =
      (canvas.getContext("webgl", {
        alpha: false, antialias: false, powerPreference: "low-power",
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return;

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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: 0.72, y: 0.45 };
    const smooth = { x: 0.72, y: 0.45 };
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

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      mouse.y = 1 - Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    };
    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else if (visible) startLoop();
    };
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) render(performance.now());
    });
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
      canvas.removeEventListener("contextmenu", block);
      canvas.removeEventListener("dragstart", block);
      const ext = gl.getExtension("WEBGL_lose_context");
      if (ext) ext.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="hero-canvas"
      aria-hidden="true"
      draggable={false}
    />
  );
}
