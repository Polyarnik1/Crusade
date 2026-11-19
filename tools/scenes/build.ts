// Рендер всех сцен: src/art/scenes.gen.ts (PNG в base64) + превью-листы для проверки глазами.
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { Scene } from './engine';
import { HEADERS, type SceneDef } from './scenes';
import { Scene2 } from '../scenes2/engine2';
import { FX2, H as H2, SCENES2, W as W2 } from '../scenes2/scenes2';
import type { Fx } from './scenes';

// регалии — вторая версия сцен
const SCENES: Record<string, SceneDef & { glow?: [number, number, number, number] }> = Object.fromEntries(
  Object.entries(SCENES2).map(([k, d]) => [k, { w: W2, h: H2, fx: (FX2[k]?.fx ?? 'none') as Fx, emit: FX2[k]?.emit, subject: FX2[k]?.subject, glow: FX2[k]?.glow, draw: d.draw as unknown as SceneDef['draw'], v2: true }]),
);

const outDir = process.argv[2] ?? 'shots';
mkdirSync(outDir, { recursive: true });

// PNG с палитрой: дизеринг плохо жмётся в truecolor, а цветов у сцены меньше 256
const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(b: Buffer) {
  let c = -1;
  for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w: number, h: number, data: Uint8Array): Buffer {
  const pal = new Map<number, number>();
  const idx = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    idx[y * (w + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
      let p = pal.get(key);
      if (p === undefined) {
        p = pal.size;
        pal.set(key, p);
      }
      idx[y * (w + 1) + 1 + x] = p;
    }
  }
  if (pal.size > 256) {
    const p = new PNG({ width: w, height: h });
    p.data = Buffer.from(data);
    return PNG.sync.write(p, { colorType: 2 });
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 3;
  const plte = Buffer.alloc(pal.size * 3);
  for (const [k, p] of pal) {
    plte[p * 3] = k >> 16;
    plte[p * 3 + 1] = (k >> 8) & 255;
    plte[p * 3 + 2] = k & 255;
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('IDAT', deflateSync(idx, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderAll(defs: Record<string, SceneDef>) {
  const res: Record<string, { w: number; h: number; data: Uint8Array }> = {};
  let i = 0;
  for (const [id, d] of Object.entries(defs)) {
    const s = (d as { v2?: boolean }).v2 ? new Scene2(d.w, d.h, 2000 + i++ * 41) : new Scene(d.w, d.h, 1000 + i++ * 37);
    try { d.draw(s); res[id] = { w: d.w, h: d.h, data: s.render() }; } catch (e) { console.log('FAIL', id, (e as Error).message); throw e; }
    continue;
    res[id] = { w: d.w, h: d.h, data: s.render() };
  }
  return res;
}

function sheet(name: string, items: Record<string, { w: number; h: number; data: Uint8Array }>, scale: number, cols: number) {
  const ids = Object.keys(items);
  const cw = Math.max(...ids.map((k) => items[k].w)) * scale + 8;
  const ch = Math.max(...ids.map((k) => items[k].h)) * scale + 8;
  const rows = Math.ceil(ids.length / cols);
  const W = cw * cols;
  const H = ch * rows;
  const out = new Uint8Array(W * H * 4).fill(20);
  ids.forEach((k, n) => {
    const it = items[k];
    const ox = (n % cols) * cw + 4;
    const oy = Math.floor(n / cols) * ch + 4;
    for (let y = 0; y < it.h * scale; y++)
      for (let x = 0; x < it.w * scale; x++) {
        const si = (Math.floor(y / scale) * it.w + Math.floor(x / scale)) * 4;
        const di = ((oy + y) * W + ox + x) * 4;
        out[di] = it.data[si];
        out[di + 1] = it.data[si + 1];
        out[di + 2] = it.data[si + 2];
        out[di + 3] = 255;
      }
  });
  writeFileSync(`${outDir}/${name}.png`, png(W, H, out));
}

const sc = renderAll(SCENES);
const hd = renderAll(HEADERS);
const only = process.env.ONLY?.split(',');
const pick = (o: typeof sc) => (only ? Object.fromEntries(Object.entries(o).filter(([k]) => only.includes(k))) : o);
sheet('scenes', pick(sc), 3, only ? Math.min(2, only.length) : 4);
sheet('headers', hd, 3, 2);

const enc = (o: typeof sc) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, 'data:image/png;base64,' + png(v.w, v.h, v.data).toString('base64')]));
const meta = (defs: Record<string, SceneDef>) =>
  Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, { w: d.w, h: d.h, fx: d.fx, emit: d.emit, subject: !!d.subject, glow: (d as { glow?: number[] }).glow }]));

const file = `// Сгенерировано tools/scenes (npm run art:scenes). Не править руками.
export type Fx = 'snow' | 'blizzard' | 'embers' | 'fireflies' | 'ash' | 'dust' | 'stars' | 'rain' | 'none';
export interface SceneMeta { w: number; h: number; fx: Fx; emit?: [number, number]; subject: boolean; glow?: [number, number, number, number] }
export const SCENE_META: Record<string, SceneMeta> = ${JSON.stringify(meta(SCENES))};
export const HEADER_META: Record<string, SceneMeta> = ${JSON.stringify(meta(HEADERS))};
export const SCENE_IMG: Record<string, string> = ${JSON.stringify(enc(sc), null, 0)};
export const HEADER_IMG: Record<string, string> = ${JSON.stringify(enc(hd), null, 0)};
`;
writeFileSync('src/art/scenes.gen.ts', file);
console.log('scenes', Object.keys(sc).length, 'headers', Object.keys(hd).length, 'bytes', file.length);
