#!/usr/bin/env bash
# Builds assets/cinematic/ from the edited master attached to the
# `cinematicmasterv3` GitHub Release.
#
#   gh release download cinematicmasterv3 -R kalidofficil/khalidonzar-skil -D ./master
#   bash scripts/build-media.sh ./master/khalid-cinematic-master-v3.mp4
#
# The master is never overwritten and never re-encoded in place. Nothing is
# trimmed, reordered or re-timed: the derivative is the same 33.529 s.
#
# One repair is applied. The master inherited bands of damaged green rows from
# its source clips — y 1139-1149 between 25.8s and 30.7s, and y 1302-1315
# between 16.8s and 21.5s. delogo interpolates each band from its own borders,
# which at 11 and 14 rows tall is invisible.
#
# Resolution note: the master is portrait 1080x1448. A 1920x1080 derivative
# would discard about half the frame and upscale the rest by 1.78x for no extra
# detail, so the derivative keeps the native frame and the page crops it per
# viewport with object-fit: cover.

set -euo pipefail
SRC="${1:-./master/khalid-cinematic-master-v3.mp4}"
OUT="$(dirname "$0")/../assets/cinematic"
mkdir -p "$OUT"
REPAIR="delogo=x=1:y=1137:w=1078:h=15,delogo=x=1:y=1300:w=1078:h=18"

echo "-- desktop: native frame, ~7 Mbps, GOP 15 (0.5s at 30fps) --"
ffmpeg -nostdin -v error -y -i "$SRC" -vf "$REPAIR" \
  -c:v libx264 -preset slow -profile:v high -level 4.1 -pix_fmt yuv420p \
  -b:v 7000k -maxrate 8500k -bufsize 12000k -g 15 -keyint_min 15 -sc_threshold 0 \
  -c:a aac -b:a 128k -ar 44100 -ac 2 -movflags +faststart \
  "$OUT/khalid-cinematic-master-v3-web.mp4"

echo "-- mobile: 720x966, ~2.6 Mbps --"
ffmpeg -nostdin -v error -y -i "$SRC" -vf "$REPAIR,scale=720:966:flags=lanczos" \
  -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p \
  -b:v 2600k -maxrate 3200k -bufsize 4800k -g 15 -keyint_min 15 -sc_threshold 0 \
  -c:a aac -b:a 112k -ar 44100 -ac 2 -movflags +faststart \
  "$OUT/khalid-cinematic-master-v3-web-mobile.mp4"

echo "-- VP9 fallbacks for builds without the proprietary codecs --"
ffmpeg -nostdin -v error -y -i "$OUT/khalid-cinematic-master-v3-web.mp4" \
  -c:v libvpx-vp9 -crf 32 -b:v 0 -g 15 -keyint_min 15 -deadline good -cpu-used 5 -row-mt 1 \
  -pix_fmt yuv420p -c:a libopus -b:a 112k "$OUT/khalid-cinematic-master-v3-web.webm"
ffmpeg -nostdin -v error -y -i "$OUT/khalid-cinematic-master-v3-web-mobile.mp4" \
  -c:v libvpx-vp9 -crf 38 -b:v 0 -g 15 -keyint_min 15 -deadline good -cpu-used 5 -row-mt 1 \
  -pix_fmt yuv420p -c:a libopus -b:a 96k "$OUT/khalid-cinematic-master-v3-web-mobile.webm"

echo "-- poster --"
ffmpeg -nostdin -v error -y -i "$SRC" -vf "$REPAIR,select=eq(n\,8),scale=1080:-2" -frames:v 1 -q:v 4 "$OUT/master-poster.jpg"
ffmpeg -nostdin -v error -y -i "$SRC" -vf "$REPAIR,select=eq(n\,8),scale=720:-2"  -frames:v 1 -q:v 5 "$OUT/master-poster-m.jpg"

echo "-- verifying --"
M=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
W=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/khalid-cinematic-master-v3-web.mp4")
python3 -c "print(f'   duration  master {$M:.3f}s  web {$W:.3f}s  ->', 'PRESERVED' if abs($M-$W)<0.05 else 'CHANGED')"
for f in "$OUT"/khalid-cinematic-master-v3-web*.mp4; do
  printf '   %-44s ' "$(basename "$f")"
  ffmpeg -nostdin -v error -i "$f" -vf "scale=1:600:flags=area" -f rawvideo -pix_fmt rgb24 - 2>/dev/null | python3 -c "
import sys
d=sys.stdin.buffer.read(); n=len(d)//3
w=max((d[3*i+1]-max(d[3*i],d[3*i+2])) for i in range(n))
print('CLEAN' if w<=25 else 'DAMAGED (green excess %d)'%w)"
done
