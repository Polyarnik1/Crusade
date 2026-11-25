#!/bin/sh
# Тема Бенедикта: «Seal of the Forgotten King» → бесшовная петля (последние 4 с растворяются в первых 4 с),
# 32 кГц, 72 кбит/с, затем в src/audio/theme.gen.ts как data-URI. Использование: tools/make-theme.sh исходник.mp3
set -e
SRC="$1"; OUT=src/audio/theme.gen.ts; TMP=$(mktemp -d)
END=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
CUT=$(python3 -c "print(round($END-4,2))")
ffmpeg -hide_banner -loglevel error -y -i "$SRC" -filter_complex \
 "[0:a]atrim=0:4,asetpts=PTS-STARTPTS[h];[0:a]atrim=$CUT:$END,asetpts=PTS-STARTPTS[t];[0:a]atrim=4:$CUT,asetpts=PTS-STARTPTS[b];[t][h]acrossfade=d=4:c1=tri:c2=tri[x];[x][b]concat=n=2:v=0:a=1[o]" \
 -map "[o]" -ac 2 -ar 32000 -c:a libmp3lame -b:a 72k "$TMP/loop.mp3"
{ echo "// Сгенерировано tools/make-theme.sh — руками не править."; printf "export const THEME = 'data:audio/mpeg;base64,"; base64 -w0 "$TMP/loop.mp3"; echo "';"; } > "$OUT"
ls -l "$OUT"
