#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Creates a Homeroom.app in /Applications that opens http://localhost:5174
# in your default browser. Put it in your dock to make Homeroom feel like
# a regular app.
#
# Usage:
#   ./scripts/create-app-shortcut.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

APP_NAME="Homeroom"
APP_DIR="$HOME/Applications/$APP_NAME.app"
CONTENTS="$APP_DIR/Contents"
MACOS="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
URL="http://127.0.0.1:5174"

mkdir -p "$MACOS" "$RESOURCES"

# Launcher script: waits briefly for the backend to be reachable, then opens
cat > "$MACOS/$APP_NAME" <<'LAUNCH'
#!/usr/bin/env bash
URL="http://127.0.0.1:5174"

# Give the daemon up to 10s to respond if the machine just woke up
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sf -o /dev/null "$URL"; then
    open "$URL"
    exit 0
  fi
  sleep 1
done

# Backend isn't responding — show a dialog
osascript -e 'display alert "Homeroom is not running" message "The Homeroom backend service is not responding on localhost:5174.\n\nOpen Terminal and run:\n  pnpm daemon:status\n\nOr reinstall the daemon:\n  pnpm daemon:install" as critical'
LAUNCH
chmod +x "$MACOS/$APP_NAME"

# Info.plist
cat > "$CONTENTS/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>$APP_NAME</string>
  <key>CFBundleDisplayName</key><string>$APP_NAME</string>
  <key>CFBundleIdentifier</key><string>com.homeroom.launcher</string>
  <key>CFBundleVersion</key><string>1.0</string>
  <key>CFBundleShortVersionString</key><string>1.0</string>
  <key>CFBundleExecutable</key><string>$APP_NAME</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>LSUIElement</key><false/>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

echo "✓ Homeroom.app created at $APP_DIR"
echo ""
echo "  Open Finder -> Applications, drag Homeroom to your dock."
echo "  Clicking it opens $URL"
