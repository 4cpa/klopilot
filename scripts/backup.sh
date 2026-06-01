#!/usr/bin/env bash
#
# Lokales Repo-Backup für klopilot.ch
# -----------------------------------------------------------------------------
# Erzeugt unter ./backup/ (gitignored):
#   - klopilot-history-<TS>.bundle   vollständige Git-Historie (restorbar)
#   - klopilot-worktree-<TS>.tar.gz  Arbeitsstand ohne node_modules/.git/Builds
#   - CLAUDE.md                      aktuelle Kopie der Projekt-Anleitung
#   - RESTORE.md                     Wiederherstellungs-Anleitung
#
# Aufruf:  pnpm backup           (bzw. bash scripts/backup.sh)
# Env:     BACKUP_KEEP=<n>        wie viele Backups behalten (Default 5)
#
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
BACKUP="$ROOT/backup"
TS="$(date +%Y%m%d-%H%M%S)"
KEEP="${BACKUP_KEEP:-5}"

mkdir -p "$BACKUP"

echo "🗄  klopilot-Backup → $BACKUP (Stand $TS)"

# 1) Git-Historie (alle Branches/Tags)
git bundle create "$BACKUP/klopilot-history-$TS.bundle" --all >/dev/null
echo "  ✔ History-Bundle"

# 2) Arbeitsstand-Snapshot (ohne node_modules/.git/Build-Artefakte)
tar --exclude=node_modules --exclude=.git --exclude=.next --exclude=.turbo \
  --exclude=.expo --exclude=dist --exclude=build --exclude=out \
  --exclude=coverage --exclude=backup --exclude='*.tsbuildinfo' \
  -czf "$BACKUP/klopilot-worktree-$TS.tar.gz" . 2>/dev/null
echo "  ✔ Arbeitsstand-Tarball"

# 3) Aktuelle CLAUDE.md
cp "$ROOT/CLAUDE.md" "$BACKUP/CLAUDE.md"
echo "  ✔ CLAUDE.md"

# 4) Restore-Anleitung (immer frisch, da backup/ nicht versioniert ist)
cat >"$BACKUP/RESTORE.md" <<'EOF'
# Backup — klopilot.ch

Lokale Sicherung des Repos. **Nicht** in Git versioniert (`/backup/` ist in
`.gitignore`). Erzeugt mit `pnpm backup`. Zeitstempel im Dateinamen: `YYYYMMDD-HHMMSS`.

## Wiederherstellen — aus dem Git-Bundle (mit voller Historie)

```bash
git clone backup/klopilot-history-<TS>.bundle klopilot-restored
cd klopilot-restored && pnpm install
```

Integrität prüfen: `git bundle verify backup/klopilot-history-<TS>.bundle`

## Wiederherstellen — aus dem Arbeitsstand-Tarball (ohne Historie)

```bash
mkdir klopilot-restored && tar -xzf backup/klopilot-worktree-<TS>.tar.gz -C klopilot-restored
cd klopilot-restored && pnpm install
```

> Der Tarball enthält den lokalen Arbeitsstand inkl. evtl. vorhandener
> `.env`-Dateien (lokale Secrets) — Backup-Dateien daher nicht weitergeben.

## Neues Backup / Retention

`pnpm backup` — behält die letzten `BACKUP_KEEP` (Default 5) Backups, ältere
werden automatisch gelöscht.
EOF
echo "  ✔ RESTORE.md"

# 5) Retention — nur die neuesten $KEEP Bundles/Tarballs behalten
prune() {
  local pattern="$1"
  # shellcheck disable=SC2012
  ls -1t $pattern 2>/dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do
    rm -f "$old" && echo "  🗑  entfernt: $(basename "$old")"
  done
}
prune "$BACKUP/klopilot-history-*.bundle"
prune "$BACKUP/klopilot-worktree-*.tar.gz"

echo ""
echo "Fertig. Aktuelle Backups (behalte $KEEP):"
ls -1ht "$BACKUP"/klopilot-history-*.bundle "$BACKUP"/klopilot-worktree-*.tar.gz 2>/dev/null \
  | sed 's#^#  #'
