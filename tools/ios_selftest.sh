#!/bin/zsh
# Runs the voice self-test (src/voice/selftest.ts) on an iPhone connected to
# this Mac: builds a Debug app with VITE_VOICE_SELFTEST=1, installs it over
# whatever Quizzical Club is on the phone (reinstall from TestFlight after),
# launches it with its console attached and keeps the self-test lines.
#
# Run from a Terminal window on the Mac (Debug signing needs the keychain).
# usage: tools/ios_selftest.sh <device udid> [seconds to watch, default 120]
set -euo pipefail
cd "${0:A:h}/../app"
UDID=${1:?device udid (xcrun devicectl list devices)}
WATCH=${2:-120}
OUT=/tmp/qc-selftest
rm -rf "$OUT" && mkdir -p "$OUT"

VITE_VOICE_SELFTEST=1 npm run build
npx cap sync ios

cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -destination "id=$UDID" -derivedDataPath "$OUT/dd" -allowProvisioningUpdates build \
  | (command -v xcbeautify >/dev/null && xcbeautify --quiet || cat)

APP=$(ls -d "$OUT"/dd/Build/Products/Debug-iphoneos/App.app)
xcrun devicectl device install app --device "$UDID" "$APP"
# console: Capacitor prints the web view's console.log lines in Debug builds
( xcrun devicectl device process launch --device "$UDID" --terminate-existing --console com.quizzicalclub.app \
    > "$OUT/console.log" 2>&1 & echo $! > "$OUT/pid" )
sleep "$WATCH"
kill "$(cat "$OUT/pid")" 2>/dev/null || true
grep -E "voice-selftest|Error|error|exception|Exception" "$OUT/console.log" | tail -60 > "$OUT/selftest.log" || true
echo "SELFTEST_DONE" >> "$OUT/selftest.log"
cat "$OUT/selftest.log"
