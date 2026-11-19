// Превью второй партии сцен: лист PNG для просмотра.
import { PNG } from 'pngjs';
import { writeFileSync } from 'node:fs';
import { Scene2 } from './engine2';
import { H, SCENES2, W } from './scenes2';

const out = process.argv[2] ?? 'shots/v2.png';
const scale = Number(process.argv[3] ?? 3);
const cols = Number(process.argv[4] ?? 2);
const only = process.env.ONLY?.split(',');
const ids = Object.keys(SCENES2).filter((k) => !only || only.includes(k));
const cw = W * scale + 8;
const ch = H * scale + 8;
const rows = Math.ceil(ids.length / cols);
const img = new PNG({ width: cw * cols, height: ch * rows });
img.data.fill(18);
ids.forEach((id, n) => {
  const s = new Scene2(W, H, 2000 + n * 41);
  SCENES2[id].draw(s);
  const d = s.render();
  const ox = (n % cols) * cw + 4;
  const oy = Math.floor(n / cols) * ch + 4;
  for (let y = 0; y < H * scale; y++)
    for (let x = 0; x < W * scale; x++) {
      const si = (Math.floor(y / scale) * W + Math.floor(x / scale)) * 4;
      const di = ((oy + y) * img.width + ox + x) * 4;
      img.data[di] = d[si];
      img.data[di + 1] = d[si + 1];
      img.data[di + 2] = d[si + 2];
      img.data[di + 3] = 255;
    }
  if (process.env.SINGLE) {
    const p = new PNG({ width: W * 6, height: H * 6 });
    for (let y = 0; y < H * 6; y++)
      for (let x = 0; x < W * 6; x++) {
        const si = (Math.floor(y / 6) * W + Math.floor(x / 6)) * 4;
        const di = (y * W * 6 + x) * 4;
        p.data[di] = d[si];
        p.data[di + 1] = d[si + 1];
        p.data[di + 2] = d[si + 2];
        p.data[di + 3] = 255;
      }
    writeFileSync(`${process.env.SINGLE}/${id}.png`, PNG.sync.write(p));
  }
});
writeFileSync(out, PNG.sync.write(img));
console.log('ok', ids.length);
