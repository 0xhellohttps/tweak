#!/bin/bash
# Build a static, browsable copy of TWEAK for GitHub Pages (docs/demo).
# Server-rendered HTML is snapshotted per route; _next assets + media are copied.
set -euo pipefail
cd "$(dirname "$0")/.."

export DEMO_STATIC=1
export NEXT_PUBLIC_BASE_PATH=/tweak/demo
PORT=3005
BASE="http://localhost:$PORT/tweak/demo"

echo "== building demo bundle =="
npx next build

echo "== starting server on :$PORT =="
npx next start -p $PORT &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
for i in $(seq 1 30); do
  curl -sf "$BASE/" -o /dev/null && break
  sleep 1
done

echo "== snapshotting routes =="
rm -rf docs/demo
mkdir -p docs/demo

ROUTES=(
  "" "login" "signup" "feed" "discover" "live" "rooms"
  "rooms/the-room" "rooms/acid-warehouse" "rooms/demo-inbox"
  "rooms/amity-house" "rooms/late-night-frequencies" "rooms/wax-only"
  "u/bsctv" "u/noize_atx" "u/velvetcrypt" "u/subkultur" "u/warehouse_mary"
  "u/lil_threshold" "u/ghostpattern" "u/kazi887" "u/dj_milagro"
  "u/eastside_amity" "u/tapewrm" "u/cold_closet" "u/yvonne_bleach" "u/rot8"
)
for r in "${ROUTES[@]}"; do
  mkdir -p "docs/demo/$r"
  curl -sf "$BASE/$r/" -o "docs/demo/$r/index.html" \
    && echo "  ok  /$r" || echo "  FAIL /$r"
done

echo "== copying assets =="
mkdir -p docs/demo/_next
cp -R .next-demo/static docs/demo/_next/static
cp -R public/uploads docs/demo/uploads
cp -R public/brand docs/demo/brand
touch docs/.nojekyll

kill $SERVER_PID 2>/dev/null || true
trap - EXIT
echo "== done: docs/demo =="
du -sh docs/demo
