#!/usr/bin/env bash
# Publiceert de (gestagede) webapp van één klant. Doel komt uit klanten/<slug>/klant.json → deploy (via cli.py):
#   github_pages:     REPO=<user>/<repo>  (gh auth login, eenmalig)          — openbaar! alleen voor BRNS/demo
#   cloudflare_pages: CF_PROJECT=<project> + CLOUDFLARE_API_TOKEN/ACCOUNT_ID  — privé mogelijk met Cloudflare Access
#   netlify:          NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID
set -euo pipefail
cd "${PUBLISH_DIR:-$(dirname "$0")}"
KLANT="${KLANT:-brns}"
if [ "${DEPLOY_TYPE:-}" = "cloudflare_pages" ]; then
  [ -n "${CF_PROJECT:-}" ] || { echo "CF_PROJECT ontbreekt" >&2; exit 1; }
  npx -y wrangler pages deploy . --project-name "$CF_PROJECT" --branch main --commit-message "update $KLANT $(date +%F)"
elif [ -n "${NETLIFY_AUTH_TOKEN:-}" ]; then
  npx -y netlify-cli deploy --prod --dir . --site "$NETLIFY_SITE_ID" --message "dagelijkse update $(date +%F)"
elif [ -n "${DEPLOY_REMOTE:-}" ] || gh auth status >/dev/null 2>&1; then  # DEPLOY_REMOTE: alleen tests (lokale bare repo)
  if [ "$KLANT" != "brns" ] && [ -z "${REPO:-}" ]; then echo "Klant $KLANT heeft geen eigen REPO; weiger (zou BRNS overschrijven)" >&2; exit 1; fi
  [ -n "${DEPLOY_REMOTE:-}" ] && REPO="${REPO:-test/test}"
  REPO="${REPO:-$(gh api user -q .login)/dealoverzicht}"
  if [ "$KLANT" != "brns" ] && [ "$REPO" = "rutgerroenhorst/dealoverzicht" ]; then echo "Weiger: dat is de BRNS-site" >&2; exit 1; fi
  [ -n "${DEPLOY_REMOTE:-}" ] || gh repo view "$REPO" >/dev/null 2>&1 || gh repo create "$REPO" --public
  # DEPLOY_NOFORCE_V1: gewone fast-forward-commit op de bestaande gh-pages (geen force, geen historie herbouwen).
  # Remote vooruit/geweigerd → opnieuw clonen en opnieuw proberen; lukt het niet, dan stoppen (nooit force).
  URL="${DEPLOY_REMOTE:-https://github.com/$REPO.git}"; SRC="$(pwd)"
  ok=0; for w in ${DEPLOY_WACHT:-0 15 60 180}; do
    sleep $w; tmp=$(mktemp -d)
    if git clone -q --depth 1 -b gh-pages "$URL" "$tmp" 2>/dev/null; then :; else rm -rf "$tmp"; tmp=$(mktemp -d); git -C "$tmp" init -q -b gh-pages; git -C "$tmp" remote add origin "$URL"; fi
    find "$tmp" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
    cp -r "$SRC"/. "$tmp"/; touch "$tmp/.nojekyll"
    git -C "$tmp" add -A
    if git -C "$tmp" diff --cached --quiet; then echo "ongewijzigd"; ok=1; rm -rf "$tmp"; break; fi
    git -C "$tmp" -c user.name=dealsysteem -c user.email=dealsysteem@localhost commit -qm "update $(date +%F' '%H:%M)"
    if git -C "$tmp" push -q origin HEAD:gh-pages; then ok=1; rm -rf "$tmp"; break; fi
    echo "push geweigerd (remote vooruit?), opnieuw vanaf actuele gh-pages" >&2; rm -rf "$tmp"
  done
  [ $ok = 1 ] || { echo "git push 4x mislukt (geen force gebruikt)" >&2; exit 1; }
  [ -n "${DEPLOY_REMOTE:-}" ] || gh api -X POST "repos/$REPO/pages" -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null 2>&1 || true
  echo "https://$(echo $REPO|cut -d/ -f1).github.io/$(echo $REPO|cut -d/ -f2)/"
else
  echo "Geen login: zet NETLIFY_AUTH_TOKEN/NETLIFY_SITE_ID, Cloudflare-gegevens of doe 'gh auth login'." >&2; exit 1
fi
