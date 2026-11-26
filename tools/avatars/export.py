import base64, io, sys
src = open('/home/claude/avatars/gen2.py').read().split("if __name__")[0]
exec(src)
from PIL import Image
IDS = {1: 'engrave', 2: 'glass', 3: 'ash', 4: 'moon', 5: 'winter'}
out = ["// Сгенерировано tools/avatars (gen2.py + export.py). Не править руками.",
       "// Листы 4×4: порядок героев — как в src/game/avatars.ts (AVATARS)."]
out.append("export const AVATAR_SHEETS: Record<string, { src: string; n: number }> = {")
tot = 0
for i, st in enumerate(STYLES, 1):
    N = st['N']
    sh = Image.new('RGB', (N * 4, N * 4))
    for j, k in enumerate(ORDER):
        sh.paste(render(k, st), ((j % 4) * N, (j // 4) * N))
    b = io.BytesIO()
    sh.save(b, 'PNG', optimize=True)
    tot += len(b.getvalue())
    out.append(f"  {IDS[i]}: {{ n: {N}, src: 'data:image/png;base64,{base64.b64encode(b.getvalue()).decode()}' }},")
    sh.save(f'/home/claude/avatars/sheet-{IDS[i]}.png')
out.append("};")
open('/home/claude/crusade/src/art/avatars.gen.ts', 'w').write('\n'.join(out) + '\n')
print('bytes png total', tot, 'order', ','.join(ORDER))
