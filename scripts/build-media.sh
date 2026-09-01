#!/usr/bin/env bash
# Rebuilds assets/cinematic/ from the original Higgsfield clips attached to the
# `cinematic-assets` GitHub Release.
#
#   gh release download cinematic-assets -R kalidofficil/khalidonzar-skil -D ./originals
#   bash scripts/build-media.sh ./originals
#
# Version 2 changes, versus the first cut:
#
#   Framing   The stage is now full-viewport, so every clip is cropped to 3:2 for
#             desktop and 9:16 for mobile, with a per-clip offset measured off the
#             footage so the crop never takes Khalid's face. CSS then covers the
#             real viewport from there.
#   Grade     The first version cooled everything to reconcile blue hour with
#             daylight. That fought the ember palette, so v2 grades neutral-to-warm
#             instead and lets the clips' own lamp light and lit windows carry the
#             colour. Measured: the warm content of all nine clips sits at hue
#             20-35 degrees, which is where cinematic orange and warm amber live.
#   Files     Scenes 4 and 5 are two halves of one source clip, so they now share a
#             single file and the join between them disappears.
#
# Defects fixed in every clip (found by inspection, unchanged from v1):
#   - a spurious Higgsfield end-card frame at 4.967s: only frames 0-148 are kept
#   - damaged green rows in three clips (06 rows 1489-1507, 08 and 09 rows
#     1264-1280); the crop heights below sit above each band

set -euo pipefail
SRC="${1:-./originals}"
OUT="$(dirname "$0")/../assets/cinematic"
mkdir -p "$OUT"

NIGHT="eq=contrast=1.05:brightness=0.008:saturation=1.05,colorbalance=rm=0.022:gm=0.005:bm=-0.022:rh=0.015:bh=-0.015"
DAY="eq=contrast=1.07:brightness=-0.008:saturation=1.00,colorbalance=rs=0.020:bs=-0.028:rm=0.030:gm=0.007:bm=-0.034:rh=0.018:bh=-0.020"

#   file        | source                | start | frames | crop 3:2 (desktop)| crop 9:16 (mobile) | grade | audio | gop
CFG="
s1-intro     |01-office-introduction| 0|149|1244:829:0:466 |937:1666:154:0 |N|1|60
s2-pullback  |02-office-pullback    | 0|149|1244:829:0:466 |937:1666:154:0 |N|0|5
s3-exterior  |03-building-exterior  |70| 79|1244:829:0:466 |937:1666:154:0 |N|0|5
s45-boardroom|05-project-room       | 0|149|1346:897:0:300 |866:1540:240:0 |D|0|5
s6-project   |06-corridor-walk      | 0|149|1372:915:0:260 |837:1488:268:0 |D|0|5
s7-corridor  |07-contact-speaking   | 0|149|1550:1033:0:100|751:1336:400:0 |D|0|5
s8-contact   |08-building-exit      | 0|149|1544:1029:0:120|711:1264:417:0 |D|1|60
s9-aerial    |09-dubai-aerial       | 0|149|1544:1029:0:100|711:1264:417:0 |D|0|5
"

while IFS='|' read -r name src sf nf cropD cropM grade aud gop; do
  name=$(echo "$name"|xargs); src=$(echo "$src"|xargs); sf=$(echo "$sf"|xargs); nf=$(echo "$nf"|xargs)
  cropD=$(echo "$cropD"|xargs); cropM=$(echo "$cropM"|xargs); grade=$(echo "$grade"|xargs)
  aud=$(echo "$aud"|xargs); gop=$(echo "$gop"|xargs)
  [ -z "$name" ] && continue
  [ "$grade" = "N" ] && G="$NIGHT" || G="$DAY"
  ss=$(python3 -c "print(f'{$sf/30:.5f}')")

  for v in d m; do
    if [ "$v" = "d" ]; then CROP="$cropD"; W=1600; H=1066; CRF=25; VCRF=37; ABR=96k
    else                    CROP="$cropM"; W=720;  H=1280; CRF=28; VCRF=41; ABR=80k; fi
    [ "$aud" = "1" ] && A4="-c:a aac -b:a 112k -ac 2" || A4="-an"
    [ "$aud" = "1" ] && A9="-c:a libopus -b:a $ABR"   || A9="-an"

    ffmpeg -nostdin -v error -y -ss "$ss" -i "$SRC/$src.mp4" -frames:v "$nf" \
      -vf "crop=$CROP,$G,scale=$W:$H:flags=lanczos" \
      -c:v libx264 -preset slow -crf $CRF -profile:v high -level 4.0 -pix_fmt yuv420p \
      -g $gop -keyint_min $gop -sc_threshold 0 $A4 -movflags +faststart "$OUT/$name-$v.mp4"

    ffmpeg -nostdin -v error -y -i "$OUT/$name-$v.mp4" \
      -c:v libvpx-vp9 -crf $VCRF -b:v 0 -g $gop -keyint_min $gop \
      -deadline good -cpu-used 4 -row-mt 1 -pix_fmt yuv420p $A9 "$OUT/$name-$v.webm"
  done

  ffmpeg -nostdin -v error -y -i "$OUT/$name-d.mp4" -vf "select=eq(n\,0),scale=960:-2" -frames:v 1 -q:v 6 "$OUT/$name-poster.jpg"
  ffmpeg -nostdin -v error -y -i "$OUT/$name-d.mp4" -vf "select=eq(n\,$((nf-1))),scale=960:-2" -frames:v 1 -q:v 6 "$OUT/$name-end.jpg"
  echo "built $name ($nf frames)"
done <<< "$(echo "$CFG" | sed '/^[[:space:]]*$/d')"

echo "-- verifying no damaged rows survived --"
for f in "$OUT"/s*-d.mp4; do
  printf '%-22s ' "$(basename "${f%-d.mp4}")"
  ffmpeg -v error -i "$f" -vf "scale=1:1066:flags=area" -f rawvideo -pix_fmt rgb24 - 2>/dev/null | python3 -c "
import sys
d=sys.stdin.buffer.read(); n=len(d)//3
w=max((d[3*i+1]-max(d[3*i],d[3*i+2])) for i in range(n))
print('CLEAN' if w<=25 else 'DAMAGED (green excess %d)'%w)"
done
