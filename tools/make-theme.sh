#!/bin/sh
# Тема Бенедикта: «Seal of the Forgotten King». В записи есть шипение и ритмичные щелчки выше 3 кГц
# (звучат как шуршащая плёнка) — срезаем: afftdn + крутой НЧ-фильтр 2,2 кГц. Затем бесшовная петля
# (последние 5 с растворяются в первых 5 с), 32 кГц, 80 кбит/с, затем в src/audio/theme.gen.ts как data-URI. Использование: tools/make-theme.sh исходник.mp3
set -e
SRC="$1"; OUT=src/audio/theme.gen.ts; TMP=$(mktemp -d)
# в исходнике ~20 с нарастания в начале и затухание в конце — для петли берём ровное тело 22…100 с,
# иначе на стыке получается провал в тишину
FROM=22; TO=100; D=5
END=$((TO-FROM)); CUT=$((END-D))
ffmpeg -hide_banner -loglevel error -y -i "$SRC" -filter_complex \
 "[0:a]atrim=$FROM:$TO,asetpts=PTS-STARTPTS,highpass=f=28,afftdn=nr=18:nf=-50:tn=1,lowpass=f=2200:p=2,lowpass=f=2200:p=2,lowpass=f=2200:p=2,asplit=3[c1][c2][c3];[c1]atrim=0:$D,asetpts=PTS-STARTPTS[h];[c2]atrim=$CUT:$END,asetpts=PTS-STARTPTS[t];[c3]atrim=$D:$CUT,asetpts=PTS-STARTPTS[b];[t][h]acrossfade=d=$D:c1=qsin:c2=qsin[x];[x][b]concat=n=2:v=0:a=1[o]" \
 -map "[o]" -ac 2 -ar 32000 -c:a libmp3lame -b:a 80k "$TMP/loop.mp3"
{ echo "// Сгенерировано tools/make-theme.sh — руками не править."; printf "export const THEME = 'data:audio/mpeg;base64,"; base64 -w0 "$TMP/loop.mp3"; echo "';"; } > "$OUT"
ls -l "$OUT"
