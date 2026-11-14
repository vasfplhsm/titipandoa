# Tumpang Doa

React 19 + Vite app for entrusting private prayers to an Umrah traveller. The public
invitation is simple and account-free; the verified owner has a prayer inbox,
resumable reading mode, private trip planning, the reviewed doa/zikir library and
persistent Digital Tasbih. Installable PWA and native widget source are retained.

**Before deployment:** read [the redesign and backend rollout guide](docs/TUMPANG_DOA_REBRAND.md).
Production RLS could not be verified here. No SQL is executed automatically.

## Development

Use Node 24 (Vite supports Node 20.19+ or 22.12+), then:

```sh
npm ci
cp .env.example .env.local
# Set the existing project's public VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
npm run dev
```

Public/offline features start even without those two settings. Server reads/writes
need the real settings. The anon key is a public browser key; never use a service-role
key in a Vite environment variable, frontend, repository or widget.

```sh
npm test
npm run lint
npm run build
npm run preview -- --port 4177 --base /titipandoa/
```

`npm test` checks the 54-entry content audit, library/Tasbih models, IndexedDB queue
transactions and native bundled-content equality. The native equality check does
not compile Swift. Browser suites use separately installed Playwright/Chromium,
with remote requests mocked/blocked so tests do not alter real records:

```sh
PLAYWRIGHT_MODULE=/path/to/playwright TASBIH_TEST_URL=http://127.0.0.1:4177/titipandoa/ node tests/pwa.browser.cjs
PLAYWRIGHT_MODULE=/path/to/playwright TASBIH_TEST_URL=http://127.0.0.1:4177/titipandoa/ node tests/library.browser.cjs
PLAYWRIGHT_MODULE=/path/to/playwright TASBIH_TEST_URL=http://127.0.0.1:4177/titipandoa/ node tests/tasbih.browser.cjs
PLAYWRIGHT_MODULE=/path/to/playwright TASBIH_TEST_URL=http://127.0.0.1:4177/titipandoa/ node tests/redesign.browser.cjs
PLAYWRIGHT_MODULE=/path/to/playwright TASBIH_TEST_URL=http://127.0.0.1:4177/titipandoa/ node tests/pwa-update.browser.cjs
```

The update suite temporarily changes only the generated `dist/sw.js`, restoring it
in `finally`. Run it separately from another build/deploy. Chromium defaults to
`/usr/bin/chromium`; set `CHROMIUM_PATH` for another installation. Playwright is not
an application dependency; fake-indexeddb is a small test-only dev dependency.

## Features and data

- Sage & Sand light/dark design with centralized tokens and locally hosted fonts.
  The public homepage centres on “Ada doa nak dikirim?” and an optional-name form.
- Verified owner inbox, search/category/read filters, date sorting, explicit read/undo,
  resumable large-type reading mode, configurable public announcement and dates,
  WhatsApp/native sharing and safe copy links. Private planning and educational
  features are separate from the visitor invitation.
- **Koleksi Doa & Zikrullah:** 54 source-checked entries, 16 categories, local search,
  source filters, favourites, Arabic-size/Rumi/meaning controls, reading mode,
  native sharing with clipboard/manual fallback and standalone offline HTML export.
  Deep links use `#doa/<id>` and `#panduan/<id>` without server routing rewrites.
- **Tasbih Digital:** accurate tap/keyboard counter, independent per-zikr counts,
  undo/reset confirmation, custom zikr/targets, guided sessions, local history,
  focus mode, optional sound/haptics, and source-aware library handoff. Existing
  localStorage data is migrated to IndexedDB with compatibility recovery; counts
  are never sent to Supabase on every tap.
- **PWA:** real manifest/icons/Apple touch metadata, scoped versioned service worker,
  public-shell precache, standalone iPhone installation guide and safe update UI.
  A completed first download supports offline reopen. There is no fake install button.
- **Offline changes:** opted-in private checklist/itinerary snapshots, automatic local
  notes, explicit note-sync action, durable UUID-based doa submissions, versioned
  owner patch queue and clear conflict/auth/error states. Finances and destructive
  actions are online-only; Amin is not queued for replay.
- Automatic sample-data seeding and five-second background polling were removed.
  Existing database rows are not deleted/renamed. Existing direct online mutations
  now retain drafts/report errors instead of claiming success after a failed write.

## Security and rollout requirements

The legacy local PIN and owner URL flags no longer authorize owner access.
Private server sync/downloads require a real Supabase Auth owner, trusted app_metadata
role and the reviewed backend setup described in [PWA_AND_SYNC.md](docs/PWA_AND_SYNC.md).
No production RLS policy or migration is executed automatically. The provided SQL
requires an explicit review flag, preserves records, and explains its policy impact.

Private local snapshots/notes/outbox contents are plaintext and explicitly opted in;
protect the device/browser profile and use the clear-copy controls. Credentials,
privileged keys, budgets and authenticated API responses are not stored in the
PWA's general IndexedDB/cache layer. OS storage eviction can still remove local data.
Only successful server acknowledgments mark queued work as synchronized.

A read-only production-schema inspection was unavailable through the environment's
network path. Do not assume live RLS or the primary-key type was verified. The
provided migration checks UUID/text-compatible doa IDs and refuses unsupported
schemas. Review and test it on an isolated project before private-sync rollout.
Pending operations remain visible instead of silently applying an unsafe fallback.

## Documentation

- [PWA, installation, storage, safe updates, supported sync and backend setup](docs/PWA_AND_SYNC.md)
- [Content audit: references, verification boundaries and one excluded candidate](docs/CONTENT_AUDIT.md)
- [Reviewed-content import, licensing and security workflow](docs/LIBRARY_WORKFLOW.md)
- [Native iOS WidgetKit companion and personal-device setup](ios/README.md)

The library includes 32 Qur'anic readings and 22 hadith-based entries. Rumi is supplied
for 12 short entries and omitted for 42 where it was not confidently checked. Fixed
repetition counts are cited; guided fallbacks of one reading do not claim a religious
prescription. One damaged-source candidate remains excluded. No runtime AI-generated
religious text or nonfunctional audio control is used.

## Code map

| Location | Purpose |
| --- | --- |
| src/App.jsx | Existing app orchestration, online features, routing and data hydration |
| src/components | Shared navigation/desktop hero, private community cards, About |
| src/rebrand | Public journey, owner inbox/reader/settings/auth, semantic tokens and model tests |
| src/design.css | Compatibility styles for retained components |
| src/mobile | Bottom navigation, feature hubs and compact/expanded dashboard widgets |
| src/library | Reviewed catalogue, reading/search/guides/sharing and daily selection |
| src/tasbih | Counter UI, model, source handoff and persistence integration |
| src/offline | IndexedDB, migration/recovery, durable outbox, PWA registration/update/privacy UI |
| scripts/pwa.mjs | Build-derived static precache and scoped worker generation |
| public | Manifest, original icons/illustrations, local open-license fonts and notices |
| content, docs | Source proofs/hashes, count decisions, licenses, audits and rollout instructions |
| supabase/migrations | Manual-review-only security/versioned-sync SQL; not run in production |
| ios | SwiftUI host, WidgetKit/App Intents, offline content and optional XcodeGen setup |
| tests | Browser regressions; native IndexedDB model tests live in src/offline |

## Deployment

Vite keeps `base: './'`. Relative assets, manifest and worker URLs support both
`/titipandoa/` on GitHub Pages and `/` on Netlify. No paid service is required for
PWA installation or public offline content. `netlify.toml` configures build output
and worker/manifest cache headers.

For the existing GitHub Pages workflow, with authorized repository push access and
public Supabase build variables configured:

```sh
npm run deploy
```

The existing predeploy script builds and `gh-pages -d dist` publishes the output.
Pages should serve the `gh-pages` branch root. Netlify should build the intended
reviewed source branch with `npm run build`, publish `dist`, and supply the two
existing public environment variables. A local root-path test does not establish
that a particular Netlify account deployment succeeded.

Native companion: regenerate `Library.json` with `npm run native:content`, then use
Xcode 15+ on a Mac/iOS 17+ as documented. No Xcode/signing/physical-iPhone execution
has been performed here. Native widgets and PWA storage are independent. Without
App Groups the widget and host counters are also independent; the working fallback
is extension-owned persistence and widget App Intents, not a fictitious Safari bridge.
