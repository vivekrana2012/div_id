#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/setup-nginx-site.sh --domain <sub.domain.tld> [options]

Options:
  --frontend-port <port>   Host port for frontend container (default: 18081)
  --backend-port <port>    Host port for backend container (default: 18080)
  --output-dir <path>      Where to write generated config (default: ops/nginx/generated)
  --install                Install to /etc/nginx/sites-available + enable in sites-enabled
  --name <site-name>       Site file name when installing (default: domain)
  TEMPLATE_SOURCE_URL      Optional override for the remote nginx template URL
  -h, --help               Show this help

Examples:
  scripts/setup-nginx-site.sh --domain app.example.com
  scripts/setup-nginx-site.sh --domain app.example.com --install
  scripts/setup-nginx-site.sh --domain app.example.com --frontend-port 18081 --backend-port 18080
EOF
}

DOMAIN=""
FRONTEND_PORT="18081"
BACKEND_PORT="18080"
OUTPUT_DIR="ops/nginx/generated"
INSTALL="false"
SITE_NAME=""
TEMPLATE_SOURCE_URL="${TEMPLATE_SOURCE_URL:-https://raw.githubusercontent.com/vivekrana2012/div_id/refs/heads/main/ops/nginx/divid-site.conf.template}"

download_template() {
  local destination="$1"

  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$TEMPLATE_SOURCE_URL" -o "$destination"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO "$destination" "$TEMPLATE_SOURCE_URL"
    return
  fi

  echo "Error: neither curl nor wget is available to fetch the nginx template" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="${2:-}"
      shift 2
      ;;
    --frontend-port)
      FRONTEND_PORT="${2:-}"
      shift 2
      ;;
    --backend-port)
      BACKEND_PORT="${2:-}"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    --install)
      INSTALL="true"
      shift
      ;;
    --name)
      SITE_NAME="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "Error: --domain is required" >&2
  usage
  exit 1
fi

if [[ -z "$SITE_NAME" ]]; then
  SITE_NAME="$DOMAIN"
fi

TEMPLATE="ops/nginx/divid-site.conf.template"
if [[ ! -f "$TEMPLATE" ]]; then
  TEMPLATE="$(mktemp)"
  download_template "$TEMPLATE"
  trap 'rm -f "$TEMPLATE"' EXIT
fi

mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/$SITE_NAME.conf"

sed \
  -e "s/__DOMAIN__/$DOMAIN/g" \
  -e "s/__FRONTEND_PORT__/$FRONTEND_PORT/g" \
  -e "s/__BACKEND_PORT__/$BACKEND_PORT/g" \
  "$TEMPLATE" > "$OUTPUT_FILE"

echo "Generated: $OUTPUT_FILE"

if [[ "$INSTALL" != "true" ]]; then
  echo "Dry run only. Use --install to copy and enable the site in nginx."
  exit 0
fi

AVAILABLE_DIR="/etc/nginx/sites-available"
ENABLED_DIR="/etc/nginx/sites-enabled"

if [[ ! -d "$AVAILABLE_DIR" || ! -d "$ENABLED_DIR" ]]; then
  echo "Error: expected Debian-style nginx dirs not found:" >&2
  echo "  $AVAILABLE_DIR" >&2
  echo "  $ENABLED_DIR" >&2
  echo "Install manually by copying $OUTPUT_FILE into your nginx config directory." >&2
  exit 1
fi

sudo cp "$OUTPUT_FILE" "$AVAILABLE_DIR/$SITE_NAME.conf"
sudo ln -sfn "$AVAILABLE_DIR/$SITE_NAME.conf" "$ENABLED_DIR/$SITE_NAME.conf"

# Verify site symlink is enabled and points to expected config
if [[ ! -L "$ENABLED_DIR/$SITE_NAME.conf" ]]; then
  echo "Error: site symlink was not created in $ENABLED_DIR" >&2
  exit 1
fi

LINK_TARGET="$(readlink "$ENABLED_DIR/$SITE_NAME.conf")"
if [[ "$LINK_TARGET" != "$AVAILABLE_DIR/$SITE_NAME.conf" ]]; then
  echo "Error: site symlink points to unexpected target: $LINK_TARGET" >&2
  exit 1
fi

sudo nginx -t
sudo systemctl restart nginx

# Verify nginx is active after restart
sudo systemctl is-active --quiet nginx

# Verify generated server_name is present in active nginx config
if ! sudo nginx -T 2>/dev/null | grep -F "server_name $DOMAIN;" >/dev/null; then
  echo "Error: server_name $DOMAIN not found in active nginx config" >&2
  exit 1
fi

# Probe the route through nginx using Host header (200/301/302/401/403/404/502 are acceptable)
HTTP_CODE="$(curl -sS -o /dev/null -w "%{http_code}" -H "Host: $DOMAIN" http://127.0.0.1/ || true)"
if [[ "$HTTP_CODE" == "000" ]]; then
  echo "Warning: nginx route probe failed (no HTTP response). Check firewall/service status." >&2
else
  echo "Route probe for $DOMAIN returned HTTP $HTTP_CODE"
fi

echo "Installed, verified, and restarted nginx site: $SITE_NAME.conf"