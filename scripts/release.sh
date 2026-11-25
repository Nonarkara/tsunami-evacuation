#!/bin/sh
set -eu

origin=https://tsunami.nonarkara.org
mkdir -p output
source_changes=$(git status --porcelain --untracked-files=normal -- src public index.html package.json package-lock.json vite.config.ts tsconfig.json wrangler.jsonc)
if [ -n "$source_changes" ]; then
    printf '%s\n' 'Commit the build inputs before releasing so the receipt can identify the source.' "$source_changes" >&2
    exit 1
fi

step='local production preflight'
published=false
report_failure() {
    status=$?
    if [ "$status" -eq 0 ]; then return; fi
    printf 'Release failed during %s.\n' "$step" >&2
    if [ "$published" = true ]; then
        printf '%s\n' 'Cloudflare deployment before publication is in output/previous-deployment.json.' >&2
        printf '%s\n' 'Recovery steps are in docs/DEPLOYMENT.md.' >&2
    fi
}
trap report_failure EXIT

npm run preflight
step='local page geometry'
npm run verify:pages
step='recording the current Cloudflare deployment'
wrangler deployments status --json > output/previous-deployment.json
step='Cloudflare publication'
wrangler deploy --message "Git $(git rev-parse HEAD)"
published=true
step='public Escape interaction and asset verification'
npm run smoke:release -- --origin "$origin" --out output/release-smoke-live.json
step='public viewport evidence'
npm run capture:evidence
step='public Results and data dialog evidence'
npm run capture:playback
step='public terrain, resume and linework evidence'
npm run capture:geometry
step='public Results pagination'
npm run verify:pagination
step='release receipts'
npm run verify:release
