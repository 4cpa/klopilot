#!/usr/bin/env bash
# klopilot.ch — Einmaliger Server-Bootstrap
# Ausführen als root auf einem frischen Hetzner-Ubuntu-24.04-Server:
#   curl -fsSL https://raw.githubusercontent.com/4cpa/klopilot/main/infra/scripts/server-setup.sh | bash
set -euo pipefail

DEPLOY_DIR="/opt/klopilot"
DEPLOY_USER="deploy"
TRAEFIK_DIR="/etc/traefik"

echo "──────────────────────────────────────────────"
echo " klopilot.ch Server Setup"
echo "──────────────────────────────────────────────"

# ── 1. Basis-Pakete ─────────────────────────────────────────────────────────
apt-get update -qq
apt-get install -y --no-install-recommends \
  curl wget git ufw fail2ban unattended-upgrades \
  ca-certificates gnupg lsb-release

# ── 2. Docker installieren ──────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "▸ Docker installieren…"
  curl -fsSL https://get.docker.com | sh
fi

docker --version

# ── 3. Deploy-User anlegen ──────────────────────────────────────────────────
if ! id "$DEPLOY_USER" &>/dev/null; then
  echo "▸ User '$DEPLOY_USER' anlegen…"
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
fi

# SSH-Verzeichnis für deploy-User
mkdir -p "/home/$DEPLOY_USER/.ssh"
chmod 700 "/home/$DEPLOY_USER/.ssh"

echo ""
echo "⚠️  Füge jetzt den GitHub-Actions-Public-Key zu /home/$DEPLOY_USER/.ssh/authorized_keys hinzu:"
echo "   ssh-ed25519 AAAA... github-actions-deploy"
echo ""

# ── 4. Deploy-Verzeichnis ───────────────────────────────────────────────────
mkdir -p "$DEPLOY_DIR"
chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

echo "▸ Repo-Dateien kopieren…"
# Nur die Compose-Datei und Infra-Scripts werden auf dem Server benötigt.
# Images kommen aus GHCR; Code muss NICHT auf dem Server liegen.
cp infra/docker-compose.prod.yml "$DEPLOY_DIR/"
cp infra/scripts/deploy.sh "$DEPLOY_DIR/"
chmod +x "$DEPLOY_DIR/deploy.sh"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

echo "▸ .env.prod anlegen…"
if [ ! -f "$DEPLOY_DIR/.env.prod" ]; then
  cp .env.prod.example "$DEPLOY_DIR/.env.prod"
  chmod 600 "$DEPLOY_DIR/.env.prod"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/.env.prod"
  echo "   ⚠️  $DEPLOY_DIR/.env.prod muss mit echten Werten befüllt werden!"
fi

# ── 5. Traefik konfigurieren ────────────────────────────────────────────────
echo "▸ Traefik einrichten…"
mkdir -p "$TRAEFIK_DIR"
mkdir -p /var/log/traefik

cp infra/traefik/traefik.yml "$TRAEFIK_DIR/"
cp infra/traefik/dynamic.yml "$TRAEFIK_DIR/"
touch "$TRAEFIK_DIR/acme.json"
chmod 600 "$TRAEFIK_DIR/acme.json"

# Traefik als Docker-Container starten
docker network create traefik 2>/dev/null || true
docker network create klopilot 2>/dev/null || true

docker run -d \
  --name traefik \
  --restart always \
  --network traefik \
  -p 80:80 \
  -p 443:443 \
  -p 127.0.0.1:8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v "$TRAEFIK_DIR:/etc/traefik" \
  -v /var/log/traefik:/var/log/traefik \
  traefik:v3 || echo "Traefik läuft bereits"

# ── 6. Firewall ─────────────────────────────────────────────────────────────
echo "▸ UFW konfigurieren…"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── 7. Automatische Sicherheitsupdates ──────────────────────────────────────
dpkg-reconfigure --priority=low unattended-upgrades

echo ""
echo "──────────────────────────────────────────────"
echo "✅ Server-Setup abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "  1. /home/$DEPLOY_USER/.ssh/authorized_keys befüllen (GitHub Actions Key)"
echo "  2. $DEPLOY_DIR/.env.prod mit Produktionswerten befüllen"
echo "  3. DNS-Records setzen (A-Record → Server-IP für klopilot.ch etc.)"
echo "  4. Erstes Deployment: cd $DEPLOY_DIR && ./deploy.sh"
echo "──────────────────────────────────────────────"
