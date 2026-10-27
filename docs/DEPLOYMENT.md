# Hosting and domain

The public application is prepared for the canonical hostname https://tsunami.nonarkara.org/ with Cloudflare Workers Static Assets. `wrangler.jsonc` carries its custom-domain declaration. The existing authenticated Cloudflare account can attach Worker custom domains; no hand-created DNS credential is stored in this repository.

## Release command

```sh
npm ci
npm run deploy
```

The deploy command runs tests, strict compilation, the Vite build and contrast checks before Wrangler. Any failed step stops deployment, avoiding publication of stale assets. The final hostname must then be tested for its HTML and hashed assets, as well as important interactive behavior. Cloudflare login is an operator prerequisite, not a committed secret.

## Sites publishing history

A public Sites version was also published successfully at https://khao-lak-tsunami.nonsmartcity.chatgpt.site/ . Version 1 corresponds to commit 817950f76b4ba65f9acdb7c93f1affedf1f2237e. Its source and archive were synchronized with the supported Sites workflow. The attempted Sites custom-domain registration required two DNS verification TXT records and a CNAME. The existing Wrangler OAuth session has no DNS-edit scope. The pending Sites custom-domain registration was removed, then the canonical hostname was assigned through Cloudflare's native Worker custom-domain mechanism instead. No DNS records for another service were removed or overwritten.

The Sites URL is an initial published snapshot; the canonical Worker is the deployment target for future releases. Do not silently treat Sites as auto-synchronized after a GitHub push. The GitHub Actions workflow validates source; deployment currently requires the operator release command above.

## Access and data

The site is public by the owner's go-live instruction. Static hosting contains no paid API credential, account workflow, survey respondent data or uploaded personal plans. Local form entries remain in the visitor's browser.

Final deployed Worker version and live-response verification are appended after deployment succeeds.
