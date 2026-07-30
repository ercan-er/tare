"use client";

import { useEffect, useRef } from "react";

/*
 * Imlecle etkilesen WebGL "kahve/buhar" hero arka plani. Tek bir tam-ekran
 * ucgen uzerinde fragment shader: domain-warp fbm ile akiskan sivi, ustte
 * yukselen buhar, imlec cevresinde isi pariltisi + dalgalanma. Tema-duyarli
 * (koyu: espresso+crema, acik: latte/krem). Bagimlilik yok.
 *
 * Performans: DPR <= 2, sekme gizli / ekran disi iken durur, reduced-motion
 * tek kare cizer. WebGL yoksa sessizce hicbir sey ciz(me)r (CSS fallback).
 */

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform vec2  uMouse;   // uv uzayinda [0,1], y yukari
uniform float uDark;    // 1.0 koyu tema, 0.0 acik

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

void main(){
  float aspect = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = vec2(uv.x * aspect, uv.y) * 2.6;

  float t = uTime * 0.05;

  // imlec etkisi (sivi dalgalanma + isi)
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

  // paletler
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
  col = mix(col, c3, smoothstep(0.35, 0.95, r.y));
  // crema/isik bandi
  float band = smoothstep(0.55, 0.95, f) * smoothstep(0.95, 0.55, r.x);
  col = mix(col, c4, band * 0.6);

  // yukselen buhar (ustte guclenir)
  float steam = fbm(vec2(p.x * 1.3, p.y * 0.9 - uTime * 0.22));
  steam *= smoothstep(0.32, 1.0, uv.y);
  vec3 steamCol = mix(vec3(1.0), vec3(0.92, 0.86, 0.8), uDark);
  col += steamCol * steam * steam * (0.10 + 0.05 * uDark);

  // imlec isi parildamasi
  float glow = exp(-md * 2.2);
  col += vec3(0.95, 0.55, 0.25) * glow * (0.18 + 0.22 * uDark);

  // hafif vignette + grain (banding onleme)
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
    if (!gl) return; // CSS fallback devreye girer

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

    // durum
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: 0.5, y: 0.55 };       // hedef
    const smooth = { x: 0.5, y: 0.55 };      // yumusatilmis
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

    // olaylar
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
