#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Homeroom Daemon Manager
#
# Installs/uninstalls a macOS launchd user agent so the Homeroom backend
# service runs automatically on login and stays running 24/7.
#
# The backend serves both the API AND the built frontend UI at
# http://localhost:5174 -- one process, one URL, always on.
#
# Usage:
#   ./scripts/daemon.sh install     Build UI, install and start the daemon
#   ./scripts/daemon.sh rebuild     Rebuild UI and restart the daemon
#   ./scripts/daemon.sh uninstall   Stop and remove the daemon
#   ./scripts/daemon.sh status      Check if the daemon is running
#   ./scripts/daemon.sh logs        Tail the daemon logs
#   ./scripts/daemon.sh open        Open the UI in your default browser
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

LABEL="com.homeroom.service"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$HOME/.homeroom/logs"
LOG_OUT="$LOG_DIR/service.stdout.log"
LOG_ERR="$LOG_DIR/service.stderr.log"

# Resolve absolute paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_DIR="$REPO_ROOT/apps/service"
TSX_BIN="$SERVICE_DIR/node_modules/.bin/tsx"
ENTRY_POINT="$SERVICE_DIR/src/index.ts"
NODE_BIN="$(which node 2>/dev/null || echo '/opt/homebrew/bin/node')"

# ── Install ──────────────────────────────────────────────────────────────────

build_ui() {
  echo "Building frontend..."
  cd "$REPO_ROOT"
  if ! pnpm build > /dev/null 2>&1; then
    echo "Error: Frontend build failed. Run 'pnpm build' to see the error."
    exit 1
  fi
  if [[ ! -f "$REPO_ROOT/dist/index.html" ]]; then
    echo "Error: Build completed but dist/index.html was not produced."
    exit 1
  fi
  echo "✓ Frontend built to $REPO_ROOT/dist"
}

install_daemon() {
  # Preflight checks
  if [[ ! -f "$TSX_BIN" ]]; then
    echo "Error: tsx not found at $TSX_BIN"
    echo "Run 'pnpm install' in the project root first."
    exit 1
  fi
  if [[ ! -f "$ENTRY_POINT" ]]; then
    echo "Error: Service entry point not found at $ENTRY_POINT"
    exit 1
  fi

  # Build the frontend so the daemon can serve it
  build_ui

  # Create log directory
  mkdir -p "$LOG_DIR"

  # Unload existing if present
  launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true

  # Resolve the real tsx CLI path (the bin wrapper is a shell script, not JS)
  TSX_CLI="$SERVICE_DIR/node_modules/tsx/dist/cli.mjs"
  if [[ ! -f "$TSX_CLI" ]]; then
    echo "Error: tsx CLI not found at $TSX_CLI"
    echo "Run 'pnpm install' in the project root first."
    exit 1
  fi

  # Write the plist
  cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>

  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$TSX_CLI</string>
    <string>$ENTRY_POINT</string>
  </array>

  <key>WorkingDirectory</key>
  <string>$SERVICE_DIR</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key>
    <string>5174</string>
    <key>HOST</key>
    <string>127.0.0.1</string>
    <key>NODE_ENV</key>
    <string>production</string>
    <key>PATH</key>
    <string>$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>

  <key>ThrottleInterval</key>
  <integer>10</integer>

  <key>StandardOutPath</key>
  <string>$LOG_OUT</string>

  <key>StandardErrorPath</key>
  <string>$LOG_ERR</string>
</dict>
</plist>
PLIST

  # Load and start (retry if launchd throttles)
  local attempt=0
  while ! launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH" 2>/dev/null; do
    attempt=$((attempt + 1))
    if [[ $attempt -ge 3 ]]; then
      echo "Error: launchd refused to load the service after $attempt attempts."
      echo "Wait 15 seconds and try again, or run: launchctl bootout gui/$(id -u)/com.homeroom.service"
      exit 5
    fi
    echo "launchd throttled — waiting 10s before retry ($attempt/3)..."
    sleep 10
  done

  echo "✓ Homeroom daemon installed and started"
  echo "  Service:  http://127.0.0.1:5174"
  echo "  Plist:    $PLIST_PATH"
  echo "  Logs:     $LOG_DIR/"
  echo ""
  echo "  The service will start automatically on login."
  echo "  To stop: ./scripts/daemon.sh uninstall"
}

# ── Uninstall ────────────────────────────────────────────────────────────────

uninstall_daemon() {
  if [[ -f "$PLIST_PATH" ]]; then
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    rm -f "$PLIST_PATH"
    echo "✓ Homeroom daemon stopped and removed"
  else
    echo "No daemon installed (plist not found at $PLIST_PATH)"
  fi
}

# ── Status ───────────────────────────────────────────────────────────────────

check_status() {
  if launchctl print "gui/$(id -u)/$LABEL" &>/dev/null; then
    echo "✓ Homeroom daemon is running"
    echo "  Checking service health..."
    if curl -sf http://127.0.0.1:5174/ > /dev/null 2>&1; then
      echo "  ✓ Service is responding on http://127.0.0.1:5174"
    else
      echo "  ✗ Service is not responding (may be starting up)"
    fi
  else
    if [[ -f "$PLIST_PATH" ]]; then
      echo "✗ Daemon plist exists but service is not running"
    else
      echo "✗ Homeroom daemon is not installed"
      echo "  Run: ./scripts/daemon.sh install"
    fi
  fi
}

# ── Logs ─────────────────────────────────────────────────────────────────────

show_logs() {
  if [[ -f "$LOG_OUT" ]]; then
    echo "── stdout ──"
    tail -30 "$LOG_OUT"
  fi
  if [[ -f "$LOG_ERR" ]]; then
    echo ""
    echo "── stderr ──"
    tail -30 "$LOG_ERR"
  fi
  if [[ ! -f "$LOG_OUT" && ! -f "$LOG_ERR" ]]; then
    echo "No log files found at $LOG_DIR/"
  fi
}

# ── Rebuild ──────────────────────────────────────────────────────────────────

rebuild_daemon() {
  if [[ ! -f "$PLIST_PATH" ]]; then
    echo "Daemon is not installed. Run: ./scripts/daemon.sh install"
    exit 1
  fi
  build_ui
  echo "Restarting daemon to pick up the new build..."
  launchctl kickstart -k "gui/$(id -u)/$LABEL" 2>/dev/null || {
    echo "Daemon restart failed — attempting full reload..."
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    sleep 1
    launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
  }
  echo "✓ Rebuild complete. Open http://127.0.0.1:5174"
}

# ── Open UI ──────────────────────────────────────────────────────────────────

open_ui() {
  open "http://127.0.0.1:5174"
}

# ── Main ─────────────────────────────────────────────────────────────────────

case "${1:-}" in
  install)   install_daemon ;;
  rebuild)   rebuild_daemon ;;
  uninstall) uninstall_daemon ;;
  status)    check_status ;;
  logs)      show_logs ;;
  open)      open_ui ;;
  *)
    echo "Homeroom Daemon Manager"
    echo ""
    echo "Usage: $0 {install|rebuild|uninstall|status|logs|open}"
    echo ""
    echo "  install    Build UI and install the background service"
    echo "  rebuild    Rebuild UI and restart the service"
    echo "  uninstall  Stop and remove the service"
    echo "  status     Check if the service is running"
    echo "  logs       Show recent service logs"
    echo "  open       Open http://localhost:5174 in browser"
    exit 1
    ;;
esac
