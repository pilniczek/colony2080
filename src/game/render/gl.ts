import type { ViewTransform } from "../../engine/render/view";
import type { Fog, SightSpan } from "../fog";
import type { Rect } from "../geometry";
import type { PlacedTiles, TileImage } from "./environment";
import { fogCells } from "./fog";
import { TILE_PX } from "./tiles";

type GlSurface = OffscreenCanvas | HTMLCanvasElement;

const OPTIONS: WebGLContextAttributes = { antialias: false, depth: false, stencil: false, failIfMajorPerformanceCaveat: true, powerPreference: "high-performance" };
const TEXTURE_IDLE_FRAMES = 120;
const MITCHELL = { b: 1 / 3, c: 1 / 3 };
const SOFTWARE_GL = /swiftshader|llvmpipe|softpipe|software|basic render/i;

const QUAD_VERTEX = `#version 300 es
in vec2 a_unit;
uniform vec2 u_size;
uniform vec4 u_rect;
out vec2 v_uv;
void main() {
  v_uv = a_unit;
  vec2 px = u_rect.xy + a_unit * u_rect.zw;
  gl_Position = vec4(px / u_size * 2.0 - 1.0, 0.0, 1.0) * vec4(1.0, -1.0, 1.0, 1.0);
}`;

const TILE_FRAGMENT = `#version 300 es
precision mediump float;
uniform sampler2D u_tile;
in vec2 v_uv;
out vec4 o;
void main() { o = texture(u_tile, v_uv); }`;

const FOG_FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D u_cells;
uniform vec2 u_origin;
uniform float u_k;
uniform ivec2 u_grid;
uniform vec3 u_color;
uniform vec3 u_scan;
uniform int u_gap;
uniform float u_height;
uniform vec2 u_bc;
out vec4 o;
float cubic(float x) {
  float b = u_bc.x, c = u_bc.y;
  x = abs(x);
  if (x < 1.0) return ((12.0 - 9.0 * b - 6.0 * c) * x * x * x + (-18.0 + 12.0 * b + 6.0 * c) * x * x + (6.0 - 2.0 * b)) / 6.0;
  if (x < 2.0) return ((-b - 6.0 * c) * x * x * x + (6.0 * b + 30.0 * c) * x * x + (-12.0 * b - 48.0 * c) * x + (8.0 * b + 24.0 * c)) / 6.0;
  return 0.0;
}
float cell(int col, int row) { return texelFetch(u_cells, clamp(ivec2(col, row), ivec2(0), u_grid - 1), 0).r; }
float across(int row, float s) {
  int i = int(floor(s));
  float f = s - float(i);
  float sum = 0.0;
  for (int m = -1; m <= 2; m++) sum += cell(i + m, row) * cubic(f - float(m));
  return sum;
}
void main() {
  vec2 px = vec2(gl_FragCoord.x, u_height - gl_FragCoord.y);
  vec2 p = (px - u_origin) / u_k;
  if (p.x < 0.0 || p.y < 0.0 || p.x >= float(u_grid.x) || p.y >= float(u_grid.y)) discard;
  int col = int(floor(p.x));
  int edge = int(floor(p.y + 0.5));
  float a;
  if (edge >= 1 && edge < u_grid.y && texelFetch(u_cells, ivec2(col, edge), 0).g > 0.5) a = across(int(floor(p.y)), p.x - 0.5);
  else {
    float t = p.y - 0.5;
    int j = int(floor(t));
    float f = t - float(j);
    a = 0.0;
    for (int m = -1; m <= 2; m++) a += across(j + m, p.x - 0.5) * cubic(f - float(m));
  }
  a = clamp(a, 0.0, 1.0);
  if (a <= 0.0) discard;
  int r = (int(floor(px.y)) - int(u_origin.y)) % u_gap;
  float line = r == 0 ? 1.0 : 0.0;
  o = vec4(mix(u_color, u_scan, line) * a, a);
}`;

function program(gl: WebGL2RenderingContext, fragment: string): WebGLProgram {
  const shader = (type: number, source: string): WebGLShader => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, shader(gl.VERTEX_SHADER, QUAD_VERTEX));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fragment));
  gl.bindAttribLocation(p, 0, "a_unit");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "program");
  return p;
}

function setup(canvas: GlSurface, alpha: boolean, fragment: string): { gl: WebGL2RenderingContext; prog: WebGLProgram; at: (name: string) => WebGLUniformLocation | null } | null {
  const gl = canvas.getContext("webgl2", { ...OPTIONS, alpha, premultipliedAlpha: true }) as WebGL2RenderingContext | null;
  if (!gl) return null;
  const prog = program(gl, fragment);
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  return { gl, prog, at: (name) => gl.getUniformLocation(prog, name) };
}

const scissor = (gl: WebGL2RenderingContext, r: Rect, h: number): void => {
  const x = Math.max(0, Math.floor(r.x));
  const y = Math.max(0, Math.floor(r.y));
  const x1 = Math.ceil(r.x + r.w);
  const y1 = Math.ceil(r.y + r.h);
  gl.scissor(x, h - y1, Math.max(0, x1 - x), Math.max(0, y1 - y));
};

const overlap = (a: Rect, b: Rect): Rect => {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return { x, y, w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x), h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y) };
};

export interface MapLayer {
  draw(sets: PlacedTiles[], window: Rect, map: Rect): void;
}

export function mapLayer(canvas: GlSurface): MapLayer | null {
  const own = setup(canvas, false, TILE_FRAGMENT);
  if (!own) return null;
  const { gl, at } = own;
  const size = at("u_size");
  const rect = at("u_rect");
  const textures = new Map<TileImage, { texture: WebGLTexture; used: number }>();
  let frame = 0;
  const textureOf = (image: TileImage): WebGLTexture => {
    const known = textures.get(image);
    if (known) {
      known.used = frame;
      return known.texture;
    }
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    textures.set(image, { texture, used: frame });
    return texture;
  };
  return {
    draw(sets, window, map) {
      frame++;
      const { width, height } = gl.canvas;
      gl.viewport(0, 0, width, height);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      const clip = overlap(window, map);
      gl.uniform2f(size, width, height);
      for (const { x, y, tiles, open } of sets) {
        for (const [col, row, image] of tiles) {
          if (!image) continue;
          const tile = { x: x + col * TILE_PX, y: y + row * TILE_PX, w: image.width, h: image.height };
          gl.bindTexture(gl.TEXTURE_2D, textureOf(image));
          gl.uniform4f(rect, tile.x, tile.y, tile.w, tile.h);
          for (const part of open ? open.map((r) => overlap(tile, { ...r, x: r.x + x, y: r.y + y })) : [tile]) {
            if (part.w <= 0 || part.h <= 0) continue;
            scissor(gl, overlap(clip, part), height);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          }
        }
      }
      for (const [image, { texture, used }] of textures) {
        if (frame - used <= TEXTURE_IDLE_FRAMES) continue;
        gl.deleteTexture(texture);
        textures.delete(image);
      }
    },
  };
}

export interface FogLayer {
  draw(fog: Fog | null, view: ViewTransform, cell: number, window: Rect, span?: SightSpan): void;
}

const rgbOf = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
};

export function fogLayer(canvas: GlSurface): FogLayer | null {
  const own = setup(canvas, true, FOG_FRAGMENT);
  if (!own) return null;
  const { gl, at } = own;
  const u = Object.fromEntries(["u_size", "u_rect", "u_origin", "u_k", "u_grid", "u_color", "u_scan", "u_gap", "u_height", "u_bc"].map((name) => [name, at(name)]));
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.uniform2f(u.u_bc!, MITCHELL.b, MITCHELL.c);
  let uploaded: Uint8Array | null = null;
  return {
    draw(fog, view, cell, window, span) {
      const { width, height } = gl.canvas;
      gl.viewport(0, 0, width, height);
      gl.disable(gl.SCISSOR_TEST);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (!fog) return;
      const cells = fogCells(fog, span);
      if (cells !== uploaded) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, fog.width, fog.height, 0, gl.RG, gl.UNSIGNED_BYTE, cells);
        uploaded = cells;
      }
      gl.enable(gl.SCISSOR_TEST);
      scissor(gl, window, height);
      gl.uniform2f(u.u_size!, width, height);
      gl.uniform4f(u.u_rect!, window.x, window.y, window.w, window.h);
      gl.uniform2f(u.u_origin!, Math.round(view.offsetX), Math.round(view.offsetY));
      gl.uniform1f(u.u_k!, cell * view.scale);
      gl.uniform2i(u.u_grid!, fog.width, fog.height);
      gl.uniform3f(u.u_color!, ...rgbOf(fog.cfg.color));
      gl.uniform3f(u.u_scan!, ...rgbOf(fog.cfg.scanlineColor));
      gl.uniform1i(u.u_gap!, fog.cfg.scanlineGapPx);
      gl.uniform1f(u.u_height!, height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

export function glLayersWork(): boolean {
  if (typeof OffscreenCanvas === "undefined") return false;
  const gl = new OffscreenCanvas(1, 1).getContext("webgl2", OPTIONS);
  if (!gl) return false;
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
  gl.getExtension("WEBGL_lose_context")?.loseContext();
  return !SOFTWARE_GL.test(renderer);
}
