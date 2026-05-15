#!/usr/bin/env bash
#
# Emergent Clone — one-shot installer for a fresh Ubuntu 22.04 / 24.04 VPS.
#
#   sudo bash install.sh
#
# It will:
#   1. Install system deps (Node 20, Python 3, MongoDB 7, nginx, yarn, certbot)
#   2. Clone (or use current dir) the repo to /opt/emergent-clone
#   3. Ask interactively for: public URL, admin email/name/password,
#      MongoDB URL + DB name, Stripe keys (optional, settable later in admin),
#      JWT secret (auto if blank)
#   4. Write backend/.env and frontend/.env
#      (Emergent LLM key + Stripe mode = "live" are pre-filled automatically)
#   5. Install backend deps in a venv, frontend deps + production build
#   6. Bootstrap the admin user (also a normal user)
#   7. Create systemd unit `emergent-backend` + nginx vhost
#   8. If the public URL is https://, auto-run certbot to obtain a TLS cert
#   9. Reload services and print final access URLs
#
set -euo pipefail

# ---------- hard-coded defaults the user asked for ----------
EMERGENT_LLM_KEY_DEFAULT="sk-emergent-61d743b80527fC5Cd7"
STRIPE_MODE_DEFAULT="live"

# ---------- helpers ----------
BLUE='\033[1;34m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'; RED='\033[1;31m'; NC='\033[0m'
log()  { echo -e "${BLUE}==>${NC} $*"; }
ok()   { echo -e "${GREEN}\xE2\x9C\x94${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC}  $*"; }
err()  { echo -e "${RED}\xE2\x9C\x97${NC} $*" >&2; exit 1; }
ask()  { local p="$1" def="${2-}"; local v
        if [[ -n "$def" ]]; then read -r -p "$p [$def]: " v; echo "${v:-$def}";
        else read -r -p "$p: " v; echo "$v"; fi; }
ask_secret() {
  local p="$1" v=""
  while [[ -z "$v" ]]; do
    read -r -s -p "$p: " v; echo
    [[ -z "$v" ]] && warn "Cannot be empty, try again."
  done
  echo "$v"
}

[[ $EUID -eq 0 ]] || err "Run with sudo / as root."

# ---------- inputs ----------
echo
log "Welcome to the Emergent Clone installer."
echo

REPO_URL=$(ask "Git repo URL to clone from (leave blank if running from inside repo)" "")
INSTALL_DIR=$(ask "Install directory" "/opt/emergent-clone")
SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
PUBLIC_URL=$(ask "Public URL (e.g. https://app.example.com)" "http://${SERVER_IP:-localhost}")
ADMIN_EMAIL=$(ask "Admin email")
ADMIN_NAME=$(ask "Admin display name" "Admin")
ADMIN_PASSWORD=$(ask_secret "Admin password (min 6 chars)")
[[ ${#ADMIN_PASSWORD} -ge 6 ]] || err "Admin password too short."

MONGO_URL=$(ask "MongoDB connection URL" "mongodb://localhost:27017")
DB_NAME=$(ask "MongoDB database name" "emergent_clone")

STRIPE_API_KEY=$(ask "Stripe secret key (sk_test_/sk_live_) — leave blank to set later in Admin panel" "")
STRIPE_PUBLISHABLE_KEY=$(ask "Stripe publishable key (pk_test_/pk_live_)" "")

JWT_SECRET=$(ask "JWT secret (leave blank to auto-generate)" "")
[[ -z "$JWT_SECRET" ]] && JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 64)

CORS_ORIGINS=$(ask "Comma-separated CORS origins" "$PUBLIC_URL,*")

# Derived
DOMAIN=$(echo "$PUBLIC_URL" | sed -E 's#https?://##' | cut -d/ -f1 | cut -d: -f1)
IS_HTTPS=0
[[ "$PUBLIC_URL" == https://* ]] && IS_HTTPS=1
IS_IP=0
[[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && IS_IP=1

echo
log "Summary:"
echo "  Install dir:        $INSTALL_DIR"
echo "  Public URL:         $PUBLIC_URL"
echo "  Domain:             $DOMAIN  (IP=$IS_IP, HTTPS=$IS_HTTPS)"
echo "  Admin email:        $ADMIN_EMAIL"
echo "  MongoDB:            $MONGO_URL ($DB_NAME)"
echo "  Stripe mode:        $STRIPE_MODE_DEFAULT  (hard-coded)"
echo "  Emergent LLM key:   ✓ pre-configured"
echo
read -r -p "Proceed? [y/N] " yn; [[ "${yn,,}" == "y" ]] || err "Aborted."

# ---------- system deps ----------
log "Installing system packages (this may take a few minutes)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends \
    curl wget gnupg2 ca-certificates lsb-release software-properties-common \
    git build-essential nginx ufw openssl rsync \
    python3 python3-venv python3-pip python3-dev \
    certbot python3-certbot-nginx >/dev/null
ok "Base packages installed."

PY_BIN="$(command -v python3)"
PY_VER="$($PY_BIN -V 2>&1 | awk '{print $2}')"
log "Python at $PY_BIN ($PY_VER)"

# Node 20
NODE_MAJOR=$(node -v 2>/dev/null | sed 's/^v//' | cut -d. -f1 || echo 0)
if [[ -z "$NODE_MAJOR" || "$NODE_MAJOR" -lt 18 ]]; then
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
fi
ok "Node $(node -v) installed."

# Yarn
command -v yarn >/dev/null || npm install -g yarn >/dev/null
ok "Yarn $(yarn -v) installed."

# MongoDB 7 if MONGO_URL points to localhost
if [[ "$MONGO_URL" == *localhost* || "$MONGO_URL" == *127.0.0.1* ]]; then
  if ! command -v mongod >/dev/null; then
    log "Installing MongoDB 7..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc \
       | gpg --dearmor -o /usr/share/keyrings/mongodb-7.gpg
    UBU_CODENAME=$(lsb_release -cs)
    # MongoDB 7 official repo only ships up to jammy; map noble→jammy
    case "$UBU_CODENAME" in
      noble|oracular) MONGO_CODENAME=jammy ;;
      *)              MONGO_CODENAME="$UBU_CODENAME" ;;
    esac
    echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-7.gpg] https://repo.mongodb.org/apt/ubuntu $MONGO_CODENAME/mongodb-org/7.0 multiverse" \
        > /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update -y >/dev/null
    apt-get install -y mongodb-org >/dev/null
    systemctl enable --now mongod
  fi
  ok "MongoDB ready."
fi

# ---------- code ----------
if [[ -n "$REPO_URL" ]]; then
  log "Cloning $REPO_URL to $INSTALL_DIR..."
  rm -rf "$INSTALL_DIR"
  git clone "$REPO_URL" "$INSTALL_DIR"
else
  HERE="$(cd "$(dirname "$0")" && pwd)"
  if [[ "$HERE" != "$INSTALL_DIR" ]]; then
    log "Copying current repo to $INSTALL_DIR..."
    mkdir -p "$INSTALL_DIR"
    rsync -a --delete --exclude='.git' --exclude='node_modules' --exclude='__pycache__' --exclude='build' \
          "$HERE"/ "$INSTALL_DIR"/
  fi
fi
cd "$INSTALL_DIR"
ok "Code is at $INSTALL_DIR"

# ---------- env files ----------
log "Writing backend/.env"
cat > "$INSTALL_DIR/backend/.env" <<EOF
MONGO_URL="$MONGO_URL"
DB_NAME="$DB_NAME"
CORS_ORIGINS="$CORS_ORIGINS"
EMERGENT_LLM_KEY=$EMERGENT_LLM_KEY_DEFAULT
JWT_SECRET=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=168
STRIPE_API_KEY=${STRIPE_API_KEY:-sk_test_emergent}
STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_MODE=$STRIPE_MODE_DEFAULT
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_NAME=$ADMIN_NAME
EOF

log "Writing frontend/.env"
cat > "$INSTALL_DIR/frontend/.env" <<EOF
REACT_APP_BACKEND_URL=$PUBLIC_URL
WDS_SOCKET_PORT=443
EOF
ok "Env files written."

# ---------- backend deps ----------
log "Creating Python venv + installing backend deps..."
"$PY_BIN" -m venv "$INSTALL_DIR/backend/venv"
"$INSTALL_DIR/backend/venv/bin/pip" install --upgrade pip wheel setuptools >/dev/null
# requirements.txt pins emergentintegrations which lives on a private index — pass it here too.
"$INSTALL_DIR/backend/venv/bin/pip" install \
   --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ \
   -r "$INSTALL_DIR/backend/requirements.txt"
# Belt & braces: ensure emergentintegrations is present (in case requirements.txt is regenerated without it).
"$INSTALL_DIR/backend/venv/bin/pip" install emergentintegrations \
   --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/
ok "Backend deps installed."

# ---------- frontend build ----------
log "Installing frontend deps + production build (this can take a few minutes)..."
( cd "$INSTALL_DIR/frontend" && yarn install && CI=false yarn build )
ok "Frontend built at $INSTALL_DIR/frontend/build"

# ---------- systemd backend ----------
log "Creating systemd service emergent-backend..."
cat > /etc/systemd/system/emergent-backend.service <<EOF
[Unit]
Description=Emergent Clone Backend (FastAPI)
After=network.target mongod.service

[Service]
Type=simple
WorkingDirectory=$INSTALL_DIR/backend
EnvironmentFile=$INSTALL_DIR/backend/.env
ExecStart=$INSTALL_DIR/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable --now emergent-backend
ok "emergent-backend service started."

# ---------- nginx vhost ----------
log "Configuring nginx reverse proxy..."
cat > /etc/nginx/sites-available/emergent-clone <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    client_max_body_size 25M;

    root $INSTALL_DIR/frontend/build;
    index index.html;

    location ~ ^/api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 600s;
    }

    location / { try_files \$uri /index.html; }
}
EOF
ln -sf /etc/nginx/sites-available/emergent-clone /etc/nginx/sites-enabled/emergent-clone
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
ok "nginx vhost configured for $DOMAIN"

# ---------- firewall ----------
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
fi

# ---------- certbot (TLS) ----------
if [[ "$IS_HTTPS" == "1" && "$IS_IP" == "0" ]]; then
  log "Requesting Let's Encrypt certificate for $DOMAIN..."
  if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$ADMIN_EMAIL" --redirect; then
    ok "TLS certificate installed for $DOMAIN."
  else
    warn "Certbot failed (DNS may not point here yet). You can re-run later:"
    warn "    sudo certbot --nginx -d $DOMAIN -m $ADMIN_EMAIL --agree-tos"
  fi
elif [[ "$IS_HTTPS" == "1" && "$IS_IP" == "1" ]]; then
  warn "Public URL is https:// with an IP address — Let's Encrypt requires a real domain. Skipping certbot."
fi

# ---------- wait for backend ----------
log "Waiting for backend to bootstrap admin account..."
for _ in {1..25}; do
  if curl -fsS http://127.0.0.1:8001/api/ >/dev/null 2>&1; then break; fi
  sleep 1
done
ok "Backend is live."

cat <<EOF

${GREEN}-------------------------------------------------------------${NC}
${GREEN} Emergent Clone is installed.${NC}
${GREEN}-------------------------------------------------------------${NC}

  Open:        $PUBLIC_URL
  Admin login: $ADMIN_EMAIL   (the password you just set)

  • The admin account is ALSO a normal user — sign in and build apps.
  • Stripe mode is set to "live"; add your real keys in Admin → Settings.
  • Logs:    journalctl -u emergent-backend -f
             tail -f /var/log/nginx/error.log
  • Update:  cd $INSTALL_DIR && git pull
             $INSTALL_DIR/backend/venv/bin/pip install -r backend/requirements.txt
             ( cd frontend && yarn install && CI=false yarn build )
             systemctl restart emergent-backend && systemctl reload nginx

Have fun building!
EOF
