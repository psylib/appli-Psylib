#!/usr/bin/env bash
# Rend le fichier .env de l'API à partir des secrets chiffrés SOPS+age.
# Ce script ne contient AUCUN secret. À exécuter sur le VPS (root) avant tout
# `docker compose up`. Source de vérité = secrets.enc.env (chiffré) + age.key.
#
# Usage : sudo ./render-secrets.sh        (ou PSY_API_DIR=/chemin ./render-secrets.sh)
set -euo pipefail

DIR="${PSY_API_DIR:-/opt/psyscale-api}"
ENC="$DIR/secrets.enc.env"
KEY="$DIR/age.key"
OUT="$DIR/.env"

[ -f "$ENC" ] || { echo "ERREUR : $ENC introuvable (secrets chiffrés)" >&2; exit 1; }
[ -f "$KEY" ] || { echo "ERREUR : $KEY introuvable (clé age de déchiffrement)" >&2; exit 1; }

umask 177  # le .env rendu sera en 600 (root only)
SOPS_AGE_KEY_FILE="$KEY" sops -d --input-type dotenv --output-type dotenv "$ENC" > "$OUT"
chmod 600 "$OUT"
echo "OK : $OUT rendu — $(grep -c '=' "$OUT") variables (valeurs non affichées)."
