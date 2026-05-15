#!/usr/bin/env bash
#
# Emergent Clone — one-shot installer for a fresh Ubuntu 22.04 / 24.04 VPS.
#
#   sudo bash install.sh
#
# It will:
#   1. Install system deps (Node 20, Python 3.11, MongoDB 7, nginx, yarn)
#   2. Clone (or use current dir) the repo to /opt/emergent-clone
#   3. Ask interactively for: domain / public URL, admin account, Mongo URL,
#      Emergent LLM key, Stripe keys (optional), JWT secret
#   4. Write backend/.env and frontend/.env
#   5. Install backend deps (uv-/pip), frontend deps (yarn), build frontend
#   6. Bootstrap the admin user (also a normal user — same login can build apps)
#   7. Create systemd unit `emergent-backend` + nginx vhost serving frontend
#   8. Reload services and print final access URLs
#
set -euo pipefail

# ---------- helpers ----------
BLUE='\033[1;34m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'; RED='\033[1;31m'; NC='\033[0m'
log()  { echo -e "${BLUE}==>${NC} $*"; }
ok()   { echo -e "${GREEN}\xE2\x9C\x94${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC}  $*"; }
err()  { echo -e "${RED}\xE2\x9C\x97${NC} $*" >&2; exit 1; }
ask()  { local p="$1" def="${2-}"; local v
        if [[ -n "$def" ]]; then read -r -p "$p [$def]: " v; echo "${v:-$def}";
        else read -r -p "$p: " v; echo "$v"; fi; }
ask_secret() { local p="$1" v; read -r -s -p "$p: " v; echo; echo "$v"; }

[[ $EUID -eq 0 ]] || err "Run with sudo / as root."

# ---------- inputs ----------
echo
log "Welcome to the Emergent Clone installer."
echo

REPO_URL=$(ask "Git repo URL to clone from (leave blank if running from inside repo)" "")
INSTALL_DIR=$(ask "Install directory" "/opt/emergent-clone")
PUBLIC_URL=$(ask "Public URL (e.g. https://app.example.com)" "http://$(hostname -I | awk '{print $1}')")
ADMIN_EMAIL=$(ask "Admin email" "admin@$(hostname -d 2>/dev/null || echo example.com)")
ADMIN_NAME=$(ask "Admin display name" "Admin")
ADMIN_PASSWORD=$(ask_secret "Admin password (min 6 chars)")
[[ ${#ADMIN_PASSWORD} -ge 6 ]] || err "Admin password too short."

MONGO_URL=$(ask "MongoDB connection URL" "mongodb://localhost:27017")
DB_NAME=$(ask "MongoDB database name" "emergent_clone")

EMERGENT_LLM_KEY=$(ask "Emergent LLM key (needed for AI builder)" "")
[[ -n "$EMERGENT_LLM_KEY" ]] || warn "No LLM key set — AI builder will use a fallback response."

STRIPE_API_KEY=$(ask "Stripe secret key (sk_test_... or sk_live_...) — can be set later in Admin panel" "")
STRIPE_PUBLISHABLE_KEY=$(ask "Stripe publishable key (pk_test_... or pk_live_...)" "")
STRIPE_MODE=$(ask "Stripe mode" "test")

JWT_SECRET=$(ask "JWT secret (leave blank to auto-generate)" "")
[[ -z "$JWT_SECRET" ]] && JWT_SECRET=$(openssl rand -hex 32)

CORS_ORIGINS=$(ask "Comma-separated CORS origins" "$PUBLIC_URL,*")

echo
log "Summary:"
echo "  Install dir:    $INSTALL_DIR"
echo "  Public URL:     $PUBLIC_URL"
echo "  Admin email:    $ADMIN_EMAIL"
echo "  MongoDB:        $MONGO_URL ($DB_NAME)"
echo "  Stripe mode:    $STRIPE_MODE"
echo
read -r -p "Proceed? [y/N] " yn; [[ "${yn,,}" == "y" ]] || err "Aborted."

# ---------- system deps ----------
log "Installing system packages (this may take a few minutes)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y >/dev/null
apt-get install -y curl wget gnupg2 ca-certificates lsb-release software-properties-common \
                   git build-essential nginx ufw openssl python3.11 python3.11-venv python3-pip >/dev/null

# Node 20
if ! command -v node >/dev/null || [[ "$(node -v 2>/dev/null | cut -c2-3)" -lt 18 ]]; then
  log "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
fi

# Yarn
command -v yarn >/dev/null || npm install -g yarn >/dev/null

# MongoDB 7 (only if MONGO_URL points to localhost)
if [[ "$MONGO_URL" == *localhost* || "$MONGO_URL" == *127.0.0.1* ]]; then
  if ! command -v mongod >/dev/null; then
    log "Installing MongoDB 7..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-7.gpg
    UBU=$(lsb_release -cs); [[ "$UBU" == "noble" ]] && UBU=jammy
    echo "deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-7.gpg] https://repo.mongodb.org/apt/ubuntu $UBU/mongodb-org/7.0 multiverse" \
      > /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt-get update -y >/dev/null
    apt-get install -y mongodb-org >/dev/null
    systemctl enable --now mongod
  fi
fi
ok "System dependencies ready."

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
EMERGENT_LLM_KEY=$EMERGENT_LLM_KEY
JWT_SECRET=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=168
STRIPE_API_KEY=${STRIPE_API_KEY:-sk_test_emergent}
STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_MODE=$STRIPE_MODE
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
log "Installing Python dependencies..."
python3.11 -m venv "$INSTALL_DIR/backend/venv"
"$INSTALL_DIR/backend/venv/bin/pip" install --upgrade pip >/dev/null
"$INSTALL_DIR/backend/venv/bin/pip" install -r "$INSTALL_DIR/backend/requirements.txt" >/dev/null
"$INSTALL_DIR/backend/venv/bin/pip" install emergentintegrations \
   --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ >/dev/null
ok "Backend deps installed."

# ---------- frontend build ----------
log "Installing frontend deps + building production bundle (this can take a few minutes)..."
( cd "$INSTALL_DIR/frontend" && yarn install --silent && yarn build )
ok "Frontend built at $INSTALL_DIR/frontend/build"

# ---------- systemd unit for backend ----------
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
DOMAIN=$(echo "$PUBLIC_URL" | sed -E 's#https?://##' | cut -d/ -f1)
cat > /etc/nginx/sites-available/emergent-clone <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 25M;

    # Frontend static build
    root $INSTALL_DIR/frontend/build;
    index index.html;

    # API + webhook -> backend
    location ~ ^/api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 600s;
    }

    # SPA fallback
    location / { try_files \$uri /index.html; }
}
EOF
ln -sf /etc/nginx/sites-available/emergent-clone /etc/nginx/sites-enabled/emergent-clone
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
ok "nginx vhost configured for $DOMAIN"

# ---------- firewall ----------
if command -v ufw >/dev/null; then
  ufw allow OpenSSH >/dev/null 2>&1 || true
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
fi

# ---------- wait for backend to bootstrap admin ----------
log "Waiting for backend to bootstrap admin account..."
for i in {1..20}; do
  if curl -fsS http://127.0.0.1:8001/api/ >/dev/null 2>&1; then break; fi
  sleep 1
done
ok "Backend is live."

cat <<EOF

${GREEN}-------------------------------------------------------------${NC}
${GREEN} Emergent Clone is installed.${NC}
${GREEN}-------------------------------------------------------------${NC}

  Open:        $PUBLIC_URL
  Admin login: $ADMIN_EMAIL  (the password you just set)

  • The admin account is ALSO a normal user — sign in with it and
    you can build apps in the same workspace.
  • Configure / change Stripe keys + packages in the in-app
    Admin panel (top-left menu when logged in as admin).
  • To enable HTTPS, point your DNS A-record at this server and run:
        sudo apt install -y certbot python3-certbot-nginx
        sudo certbot --nginx -d $DOMAIN
  • Logs:
        journalctl -u emergent-backend -f
        tail -f /var/log/nginx/error.log

Have fun building!
EOF
