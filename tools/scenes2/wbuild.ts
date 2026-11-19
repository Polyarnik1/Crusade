import { PNG } from 'pngjs';
import { writeFileSync } from 'node:fs';
import { Scene2 } from './engine2';
import { H, SCENES2, W } from './scenes2';
import { flakes, isInterior, winterize } from './winter';
const out = process.argv[2] ?? '/tmp/w/winter.png';
const scale = Number(process.argv[3] ?? 2), cols = Number(process.argv[4] ?? 4);
const only = process.env.ONLY?.split(',');
const ids = Object.keys(SCENES2).filter((k) => !only || only.includes(k));
const cw = W * scale + 8, ch = H * scale + 8;
const img = new PNG({ width: cw * cols, height: ch * Math.ceil(ids.length / cols) });
img.data.fill(18);
ids.forEach((id, n) => {
  const s = new Scene2(W, H, 2000 + Object.keys(SCENES2).indexOf(id) * 41);
  SCENES2[id].draw(s);
  const inside = isInterior(s);
  winterize(s);
  const d = s.render();
  flakes(d, W, H, 31 + n, 70, inside);
  const ox = (n % cols) * cw + 4, oy = Math.floor(n / cols) * ch + 4;
  for (let y = 0; y < H * scale; y++) for (let x = 0; x < W * scale; x++) {
    const si = (Math.floor(y / scale) * W + Math.floor(x / scale)) * 4, di = ((oy + y) * img.width + ox + x) * 4;
    img.data[di] = d[si]; img.data[di + 1] = d[si + 1]; img.data[di + 2] = d[si + 2]; img.data[di + 3] = 255;
  }
});
writeFileSync(out, PNG.sync.write(img));
console.log('ok', ids.length);
