import L from 'leaflet';

// Офлайн-подложка для режима артефакта (там внешние картинки заблокированы):
// процедурный «город» из кварталов, улиц, парков и воды. Только для демо.
function h(a: number, b: number, seed = 0): number {
  let x = (a * 374761393 + b * 668265263 + seed * 2147483647) | 0;
  x = (x ^ (x >>> 13)) * 1274126177;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967295;
}

export function fakeTiles(): L.GridLayer {
  const Layer = L.GridLayer.extend({
    createTile(coords: { x: number; y: number; z: number }) {
      const size = 256;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d')!;
      g.fillStyle = '#14141f';
      g.fillRect(0, 0, size, size);
      const k = Math.pow(2, coords.z - 16); // масштаб относительно z16
      const ox = coords.x * size;
      const oy = coords.y * size;
      const step = 96; // шаг сетки в px на z16
      const x0 = Math.floor(ox / k / step) - 1;
      const x1 = Math.ceil((ox + size) / k / step) + 1;
      const y0 = Math.floor(oy / k / step) - 1;
      const y1 = Math.ceil((oy + size) / k / step) + 1;
      const px = (wx: number) => wx * k - ox;
      const py = (wy: number) => wy * k - oy;
      // кварталы: парки и вода
      for (let i = x0; i <= x1; i++) {
        for (let j = y0; j <= y1; j++) {
          const r = h(i, j, 1);
          const wx = i * step + (h(i, 0, 2) - 0.5) * 24;
          const wy = j * step + (h(0, j, 3) - 0.5) * 24;
          if (r < 0.12) g.fillStyle = '#17261f';
          else if (r > 0.94) g.fillStyle = '#12233a';
          else if (r > 0.55) g.fillStyle = '#191926';
          else g.fillStyle = '#161622';
          g.fillRect(px(wx) + 3 * k, py(wy) + 3 * k, (step - 6) * k, (step - 6) * k);
        }
      }
      // улицы
      g.lineCap = 'butt';
      for (let i = x0; i <= x1; i++) {
        const wx = i * step + (h(i, 0, 2) - 0.5) * 24;
        const main = h(i, 7, 4) > 0.8;
        g.strokeStyle = main ? '#3a3550' : '#2a2840';
        g.lineWidth = Math.max(1, (main ? 7 : 4) * k);
        g.beginPath();
        g.moveTo(px(wx), 0);
        g.lineTo(px(wx), size);
        g.stroke();
      }
      for (let j = y0; j <= y1; j++) {
        const wy = j * step + (h(0, j, 3) - 0.5) * 24;
        const main = h(9, j, 5) > 0.8;
        g.strokeStyle = main ? '#3a3550' : '#2a2840';
        g.lineWidth = Math.max(1, (main ? 7 : 4) * k);
        g.beginPath();
        g.moveTo(0, py(wy));
        g.lineTo(size, py(wy));
        g.stroke();
      }
      return c;
    },
  });
  return new (Layer as unknown as new (o: L.GridLayerOptions) => L.GridLayer)({ tileSize: 256, maxZoom: 19 });
}
