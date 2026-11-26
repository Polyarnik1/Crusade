import base64, io, json
src = open('/home/claude/avatars/gen2.py').read().split("if __name__")[0]
exec(src)
from PIL import Image
IDS = {2: 'glass', 3: 'ash', 4: 'moon', 5: 'winter'}
out = ["// Сгенерировано tools/avatars (gen2.py + export.py). Не править руками.",
       "// Листы 4×4: фон и фигура отдельно (фигура «дышит» над фоном). Порядок героев — как в src/game/avatars.ts.",
       "export const AVATAR_SHEETS: Record<string, { n: number; bg: string; fig: string }> = {"]
emits = {}
tot = 0
for i, st in enumerate(STYLES, 1):
    if i not in IDS:
        continue
    N = st['N']
    bg = Image.new('RGB', (N * 4, N * 4))
    fg = Image.new('RGBA', (N * 4, N * 4), (0, 0, 0, 0))
    em = {}
    for j, k in enumerate(ORDER):
        b, f, e = render(k, st, layers=True)
        bg.paste(b, ((j % 4) * N, (j // 4) * N))
        fg.paste(f, ((j % 4) * N, (j // 4) * N))
        em[k] = e
    enc = {}
    for name, im in (('bg', bg), ('fig', fg)):
        b = io.BytesIO(); im.save(b, 'PNG', optimize=True)
        tot += len(b.getvalue())
        enc[name] = 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()
    out.append(f"  {IDS[i]}: {{ n: {N}, bg: '{enc['bg']}', fig: '{enc['fig']}' }},")
    emits[IDS[i]] = em
out.append("};")
out.append("")
out.append("// светящиеся точки (глаза, кристаллы, огонь): [x, y, цвет, тип e|c|f] в пикселях спрайта")
out.append("export const AVATAR_GLOW: Record<string, Record<string, [number, number, string, string][]>> = " + json.dumps(emits, ensure_ascii=False, separators=(',', ':')) + ";")
open('/home/claude/crusade/src/art/avatars.gen.ts', 'w').write('\n'.join(out) + '\n')
print('png bytes', tot)
