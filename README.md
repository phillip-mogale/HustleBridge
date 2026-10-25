# HustleBridge

Practise the business. Build the evidence. Find your next step.
A multi-page Progressive Web App: **Astro (static) + vanilla JS + CSS**, hosted on **Cloudflare Workers**, data in **Supabase** through a Worker proxy.

## Run it

```bash
npm install
npm run dev        # Astro dev server on :4321 (proxies /api to a local Worker on :8787)
npm test           # engine + worker tests (18)
cp .dev.vars.example .dev.vars   # then fill in the secrets
npm run preview    # builds, then runs the real Worker + static assets locally
```

## Deploy (Cloudflare)

```bash
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put AI_API_KEY          # optional: without it the app uses its offline guide
npm run deploy
```
Edit `wrangler.jsonc` to set `AI_PROVIDER` (`anthropic` or `openai` for any OpenAI-compatible endpoint), `AI_MODEL`, and optionally a second provider (`AI2_*`) that is tried if the first fails. Confirm current model names, quotas and data-use terms with the provider before launch.
The build also writes `dist/sw.js` with a content hash, so every deploy gets a new cache name automatically.

## How it fits together

| Piece | Where |
|---|---|
| Design (exact tokens from the supplied HTML; light is the default theme) | `src/styles/global.css` |
| Calculation engine: goods, services and resale. No AI, fully tested | `src/lib/engine.js`, `tests/engine.test.mjs` |
| Shape-specific wording, preset Blueprints, simulation events, offline intake parser | `src/lib/copy.js` |
| Missions, shared logic, state (local-first, synced when signed in) | `src/lib/missions.js`, `shared.js`, `state.js` |
| One view module per screen | `src/scripts/views/*.js`, mounted by `src/pages/*.astro` |
| Browser client: only ever calls `/api/*` | `src/lib/api.js` |
| Worker: Supabase auth + allow-listed DB proxy + AI guide | `worker/index.js`, `tests/worker.test.mjs` |
| Database contract and row-level security | `supabase/schema.sql` |
| Verified support listings | `src/lib/opportunities.js` |
| Logo (vector, themed; gradients live once per page in `Base.astro`) and app icons | `LOGO` / `LOGO_DEFS` in `src/lib/icons.js`, `public/icons/` |

**The rule the code follows:** the AI configures and explains, the engine calculates, the user decides. The AI returns a Blueprint in a fixed structure that is validated (`sanitizeBlueprint`) on the server and again in the browser. If the AI is slow or off, the chat falls back to rules-based questions and the one-tap example Blueprints keep the whole journey working.

## Before you submit (checklist)

- [ ] Run `supabase/schema.sql`; sign up two test accounts and confirm neither can read the other's rows.
- [ ] Set the three secrets, test sign-up, sign-in and a Blueprint round-trip on the deployed URL.
- [ ] Re-verify every listing in `src/lib/opportunities.js` against its official page and update `chk`. Add a `dl` (deadline) **only** when verified.
- [ ] Re-check the Stats SA figures and link in the landing page (`src/pages/index.astro`).
- [ ] Test installability and the offline page on a real Android phone and an iPhone.
- [ ] Add a Cloudflare rate-limiting rule on `/api/ai/*` and `/api/auth/*` (the Worker also limits per instance).
- [ ] Confirm the privacy wording matches what your backend really stores.
