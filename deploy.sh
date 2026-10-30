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
elif gh auth status >/dev/null 2>&1; then
  if [ "$KLANT" != "brns" ] && [ -z "${REPO:-}" ]; then echo "Klant $KLANT heeft geen eigen REPO; weiger (zou BRNS overschrijven)" >&2; exit 1; fi
  REPO="${REPO:-$(gh api user -q .login)/dealoverzicht}"
  if [ "$KLANT" != "brns" ] && [ "$REPO" = "rutgerroenhorst/dealoverzicht" ]; then echo "Weiger: dat is de BRNS-site" >&2; exit 1; fi
  gh repo view "$REPO" >/dev/null 2>&1 || gh repo create "$REPO" --public
  tmp=$(mktemp -d); cp -r ./* "$tmp"; cd "$tmp"; touch .nojekyll
  git init -q -b gh-pages; git add -A; git commit -qm "update $(date +%F)"
  git push -qf "https://github.com/$REPO.git" gh-pages
  gh api -X POST "repos/$REPO/pages" -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null 2>&1 || true
  echo "https://$(echo $REPO|cut -d/ -f1).github.io/$(echo $REPO|cut -d/ -f2)/"
else
  echo "Geen login: zet NETLIFY_AUTH_TOKEN/NETLIFY_SITE_ID, Cloudflare-gegevens of doe 'gh auth login'." >&2; exit 1
fi
