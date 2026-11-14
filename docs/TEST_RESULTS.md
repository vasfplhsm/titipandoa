# Validation record — original announcement and themes

Executed on 14 November 2026 in Linux/Chromium with all Supabase HTTP/WebSocket
requests mocked or blocked. Fixture accounts/records are not live credentials/data.
No production database changes or deployments were made.

## Passed

- `npm test`: 27 tests (1 immutable original announcement, 7 library, 5 Tasbih,
  4 IndexedDB/queue, 5 redesign/public-profile models, 5 theme/contrast models).
  Content audit passes 54/54 reviewed entries (32 Quran, 22 hadith). Native bundled
  data equality passes for all 54; this does not compile Swift.
- `npm run lint`: no errors. Five warnings remain: four React compiler/manual-memoization and
  set-state-in-effect warnings in App, and one provider/hook Fast Refresh warning.
- `npm run build`: complete production artifact, original icons/social image,
  manifest and scoped revisioned worker. Main JS approximately 683 KB / 188 KB gzip;
  Excel export remains a lazy chunk. The existing >500 KB chunk warning remains.
- `tests/redesign.browser.cjs` at `/titipandoa/` and `/`: public records never
  requested/displayed; optional anonymous submission; examples only edit drafts;
  failed server requests remain pending; retries keep their UUID; confirmation
  follows acknowledgment; old local PIN/URL flags cannot authorize access; OTP
  disables account creation; a server-returned non-owner cannot open private data.
  Verified owner inbox search/status filters, read/undo confirmation and server
  failure handling; reader navigation does not mark prayers; text-size and stable-ID
  resume; settings save and clean sharing URLs; real offline reload of downloaded
  prayers, including an expired token; light/dark persistence and 320–1440px layouts.
- `tests/themes.browser.cjs` at both paths: all 11 original paragraphs equal the
  independent historic fixture, remain visible/in order, and precede the form CTA.
  Tests six palette/appearance variants, computed colors and meta theme-color,
  device-following changes, legacy preference migration, local overrides and reset,
  retained counter/history data, owner publication failure and acknowledged success,
  fresh visitor defaults, and no server writes from local viewing controls.
- `tests/settings-hydration.browser.cjs`: delayed initial profile data cannot replace
  edits or cause default fields to overwrite server records. Ordinary saves send
  only edited fields; newer edits during a request survive acknowledgment. Both
  response orders test stale profile reads cannot revert a completed save.
- `tests/pwa.browser.cjs` at both Pages subpath and root: real manifest/scope, full
  public-shell cache, offline page close/reopen, retained IndexedDB count, library
  deep link, stable queued submission/reconnect, private authorization rejection,
  mocked version conflict and lost-acknowledgment idempotent recovery, no Supabase
  API/auth responses in Cache Storage, mobile and landscape layouts.
- `tests/pwa-update.browser.cjs`: real waiting worker, pending operations block
  activation, explicit draft save/recovery across update reload, superseded scoped
  cache removed. The suite restores the generated worker in `finally`.
- `tests/library.browser.cjs`: 54 entries, categories/search/favourites/combined
  filters, deep-link reload, Arabic/Rumi/meaning/text-size/reading controls, sharing
  fallback, offline HTML export, source attribution, guide resume/counts and Tasbih
  handoff. Denied-storage context remains usable.
- `tests/tasbih.browser.cjs`: rapid taps, keyboard, beyond-target counts, undo,
  reset/cancel, saved history, custom zikr, guided sessions, reload, offline counting,
  cross-tab conflict recovery, app navigation/draft retention, focus, dark mode,
  320px overflow and both persistence stores failing. LocalStorage denial alone
  preserves IndexedDB counting.
- Screenshots inspected for public desktop/mobile, dark theme and private reader.
  Test screenshots contain fixture text. `git diff --check` passes.

## Not executed / required before deployment

- Read-only production schema probing failed with `URLError` under the environment's
  network policy. Actual RLS, schema/key types, grants, owner role/email delivery,
  closed-inbox trigger and SQL syntax/runtime were not tested on a live database.
  The additive theme/profile migrations and previous owner RLS migration are manual-review
  artifacts, not executed setup. Follow [the rollout guide](TUMPANG_DOA_REBRAND.md).
- Anonymous/non-owner direct API privacy must be verified in an isolated project
  and then production before releasing. UI hiding does not establish server privacy.
- Actual GitHub Pages/Netlify deployment, host environment variables, Auth redirect
  allowlists and WhatsApp preview rendering are not verified by local path tests.
  Set `VITE_PUBLIC_URL` to the correct absolute deployment URL before building.
- No Mac/Xcode/Swift compile, signing or physical iPhone/widget test was available.
  Native display names/colors/original AppIcon source use the default Rosewood palette and are updated; identifiers and
  widget kinds are unchanged. Follow [the iOS guide](../ios/README.md).
- Actual iPhone Safari/standalone keyboard/safe-area/VoiceOver, haptics/audio,
  force-close/reboot and OS eviction still need device acceptance. IndexedDB and
  downloaded private copies remain plaintext on the selected trusted device.
