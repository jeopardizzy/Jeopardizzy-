#!/bin/zsh
# Archives Quizzical Club (iOS, Release) and uploads it to App Store Connect / TestFlight.
#
# Run from a Terminal window on the Mac, not over SSH: signing needs the
# unlocked login keychain, which an SSH session cannot see. Signs and uploads
# with the Apple ID signed in to Xcode (team GIGVI LLC); no API key involved.
#
# Build number = commit count of HEAD, so every upload from a newer commit is
# higher than the last one. The version string comes from MARKETING_VERSION in
# the Xcode project.
set -euo pipefail
cd "${0:A:h}/../app"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean; commit or stash first so the build matches a commit." >&2
  exit 1
fi

build=$(git rev-list --count HEAD)
echo "Building Quizzical Club build $build from $(git log --oneline -1)"

npm ci
npm run build
npx cap sync ios

pretty=(cat)
command -v xcbeautify >/dev/null && pretty=(xcbeautify --quiet)

out=$(mktemp -d)
cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$out/App.xcarchive" \
  -allowProvisioningUpdates \
  CURRENT_PROJECT_VERSION="$build" \
  archive | "${pretty[@]}"

xcodebuild -exportArchive \
  -archivePath "$out/App.xcarchive" \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath "$out/export" \
  -allowProvisioningUpdates | "${pretty[@]}"

echo "Uploaded build $build. It appears in App Store Connect > TestFlight after processing (10-30 min)."
echo "Archive kept at $out/App.xcarchive"
