# Validation record

This records work executed in the managed Linux/Chromium environment. It is not
an assertion of testing on a physical iPhone, a live Supabase policy deployment,
or an Xcode build.

## Passed

- `npm test`: 54/54 published entries pass the source/duplicate/count audit;
  7 library tests, 5 Tasbih tests and 4 native-IndexedDB transaction/queue tests pass.
  A separate data check confirms all 54 bundled native prayers match the reviewed
  web catalogue; it explicitly does not compile Swift.
- `npm run build`: production artifact generated successfully, including manifest,
  four PNG icon sizes/assets and a revisioned service worker. Excel export is now a
  separate lazy chunk. Main JS is approximately 700 KB / 189 KB gzip versus about
  948 KB / 274 KB gzip before this PWA stage; a >500 KB warning remains. These are
  build sizes, not a physical-device performance benchmark.
- `npm run lint`: no errors; React compiler/manual-memoization and set-state-in-effect
  warnings remain in the legacy orchestration component.
- `tests/pwa.browser.cjs`: exercised production at both `/titipandoa/` and `/`.
  Verified manifest/scope, complete public-shell caching, browser page close/reopen
  while offline, actual IndexedDB counter recovery, reading from cached assets,
  one durable queued submission, explicit unauthorized private-op blocking,
  mocked server conflicts and lost-acknowledgment idempotent recovery, no API/private
  responses in Cache Storage, and 320/390/430/844px layouts.
- `tests/pwa-update.browser.cjs`: installed a real newer waiting worker, verified
  queued operations disabled refresh, saved a form draft on explicit acceptance,
  activated/reloaded, recovered the draft, and removed the superseded scoped cache.
- Library/Tasbih/redesign browser regressions: search, categories/favourites,
  deep-link reload, reading controls, offline HTML export, source-count handoff,
  guided progress, rapid taps, other-tab resume, dual-store failure, owner/public
  visibility, and mocked failed/successful submissions/Amin requests.
- `git diff --check` and browser screenshots for visual review.

Browser requests to Supabase are mocked/blocked, including WebSockets. Fixture
records and fixture auth sessions are not real credentials or live records. The
production database is not modified by these tests.

## Not executed / rollout prerequisites

- The read-only live schema/OpenAPI request was unavailable through the environment's
  network path. Live table ID types, live RLS, owner registration, email delivery,
  secure private download/sync and the proposed SQL were not production-verified.
- The SQL migration is provided for manual review and isolated-project testing.
  It has an explicit approval guard, changes policy permissions, and must not be
  run blindly. Actual private sync requires the reviewed schema/RPC and a trusted
  server-assigned owner Auth role. Pending client operations stay blocked/visible
  until those prerequisites are met. See `PWA_AND_SYNC.md` for the acceptance matrix.
- No production schema/policy changes, row deletions/renames, automatic reseeding or
  new privileged frontend credentials were introduced.
- Real iPhone Safari/standalone installation, safe-area/keyboard behavior, OS eviction,
  haptics/audio and force-close/device-restart behavior need the physical-device
  checklist in `PWA_AND_SYNC.md`. Chromium offline reopen is not an iPhone test.
- Netlify root-path compatibility is locally verified; an actual Netlify account
  deployment and its configured environment variables are not claimed.
- Swift/Xcode generation, compilation, Apple signing, entitlement availability,
  native widget installation/rendering/App Intents and physical-device persistence
  are untested here. `ios/README.md` gives exact source membership and setup steps.
  PWA and native widget counts are independent; no App Group is assumed available
  under free Personal Team signing.

The source is prepared for review on a Git branch. The PWA rollout should follow
backend/schema review where private synchronization is required. Merely pushing
this source branch does not publish it to Pages, Netlify, or the cloud environment.
