#!/usr/bin/env bash
# Rebuilds every web derivative in assets/cinematic/ from the original Higgsfield
# clips attached to the `cinematic-assets` GitHub Release.
#
#   bash scripts/build-media.sh /path/to/originals
#
# The originals are NOT committed. Download them first:
#   gh release download cinematic-assets -R kalidofficil/khalidonzar-skil -D ./originals
#
# Three things this script fixes in every source clip, found during inspection:
#
#   1. Tail card.   Every clip carries one spurious final frame (a Higgsfield end
#                   card — a Burj Khalifa still or a portrait on black) at 4.967s.
#                   Only frames 0-148 are kept.
#   2. Green band.  Clips 06, 08 and 09 carry a band of damaged lime-green rows.
#                   Measured positions: 06 rows 1489-1507, 08 and 09 rows 1264-1280.
#                   The crop heights below sit above each band.
#   3. Ratios.      Sources vary from 1244x1666 to 1550x1336. All are normalised to
#                   4:5 so the journey reads as one continuous camera move.
#
# Clips 01-03 are blue hour; 05-09 are daylight. Two grades pull them together.

set -euo pipefail
SRC="${1:-./originals}"
OUT="$(dirname "$0")/../assets/cinematic"
mkdir -p "$OUT"

NIGHT="eq=contrast=1.04:brightness=0.010:saturation=0.97,colorbalance=bs=0.025:bm=0.015:rm=-0.010"
DAY="eq=contrast=1.06:brightness=-0.026:saturation=0.90,colorbalance=rs=-0.045:gs=-0.008:bs=0.060:rm=-0.030:bm=0.045:rh=-0.020:bh=0.030"

#     name           source                 start  frames  crop(w:h:x:y)        grade audio gop
CFG="
s01-intro     |01-office-introduction| 0| 149|1244:1555:0:30 |N|1|60
s02-pullback  |02-office-pullback    | 0| 149|1244:1555:0:30 |N|0|5
s03-exterior  |03-building-exterior  |72|  77|1244:1555:0:30 |N|0|5
s04-conference|05-project-room       | 0|  53|1232:1540:57:0 |D|0|5
s05-transition|05-project-room       |52|  97|1232:1540:57:0 |D|0|5
s06-project   |06-corridor-walk      | 0| 149|1190:1488:91:0 |D|0|5
s07-corridor  |07-contact-speaking   | 0| 149|1068:1336:241:0|D|0|5
s08-contact   |08-building-exit      | 0| 149|1012:1264:266:0|D|1|60
s09-aerial    |09-dubai-aerial       | 0| 149|1012:1264:266:0|D|0|5
"

for line in $CFG; do
  IFS='|' read -r name src sf nf crop grade aud gop <<< "$line"
  name=$(echo "$name" | xargs); src=$(echo "$src" | xargs); crop=$(echo "$crop" | xargs)
  sf=$(echo "$sf" | xargs); nf=$(echo "$nf" | xargs); gop=$(echo "$gop" | xargs)
  [ -z "$name" ] && continue
  [ "$grade" = "N" ] && G="$NIGHT" || G="$DAY"
  ss=$(python3 -c "print(f'{$sf/30:.5f}')")

  for v in d m; do
    if [ "$v" = "d" ]; then W=1080; H=1350; CRF=23; VCRF=36; ABR=96k; else W=720; H=900; CRF=26; VCRF=40; ABR=80k; fi
    [ "$aud" = "1" ] && A4="-c:a aac -b:a 112k -ac 2" || A4="-an"
    [ "$aud" = "1" ] && A9="-c:a libopus -b:a $ABR"   || A9="-an"

    # H.264: what every real browser plays, hardware-decoded
    ffmpeg -v error -y -ss "$ss" -i "$SRC/$src.mp4" -frames:v "$nf" \
      -vf "crop=$crop,$G,scale=$W:$H:flags=lanczos" \
      -c:v libx264 -preset slow -crf $CRF -profile:v high -level 4.0 -pix_fmt yuv420p \
      -g $gop -keyint_min $gop -sc_threshold 0 $A4 -movflags +faststart "$OUT/$name-$v.mp4"

    # VP9: the fallback for builds shipped without the proprietary codecs
    ffmpeg -v error -y -i "$OUT/$name-$v.mp4" \
      -c:v libvpx-vp9 -crf $VCRF -b:v 0 -g $gop -keyint_min $gop \
      -deadline good -cpu-used 4 -row-mt 1 -pix_fmt yuv420p $A9 "$OUT/$name-$v.webm"
  done

  # poster (first frame) and end frame, from the graded render
  ffmpeg -v error -y -i "$OUT/$name-d.mp4" -vf "select=eq(n\,0),scale=800:-2"        -frames:v 1 -q:v 6 "$OUT/$name-poster.jpg"
  ffmpeg -v error -y -i "$OUT/$name-d.mp4" -vf "select=eq(n\,$((nf-1))),scale=800:-2" -frames:v 1 -q:v 6 "$OUT/$name-end.jpg"
  echo "built $name"
done

# Verification: no damaged rows may survive into a shipped file.
echo "── checking every output frame for the green band ──"
for f in "$OUT"/s0*-d.mp4; do
  printf '%-24s ' "$(basename "${f%-d.mp4}")"
  ffmpeg -v error -i "$f" -vf "scale=1:1350:flags=area" -f rawvideo -pix_fmt rgb24 - 2>/dev/null | python3 -c "
import sys
d=sys.stdin.buffer.read(); n=len(d)//3
worst=max((d[3*i+1]-max(d[3*i],d[3*i+2])) for i in range(n))
print('CLEAN' if worst<=25 else 'DAMAGED rows remain (green excess %d)'%worst)
"
done
