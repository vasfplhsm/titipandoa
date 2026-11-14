> Current redesign/auth update: see [Tumpang Doa rollout](TUMPANG_DOA_REBRAND.md).
> Local PIN/URL flags no longer open owner mode. Previously verified device records and
> explicit matching-owner downloads permit offline reading; live actions require
> server authorization. Read/undo prayer status remains online-only.

# Tumpang Doa 2.0 — PWA, offline storage and synchronization

## Installation on iPhone

1. Open the HTTPS GitHub Pages/Netlify site in Safari, not an embedded social-app browser.
2. Open Share → Add to Home Screen. Enable **Open as Web App** if offered, then Add.
3. Launch Tumpang Doa from the Home Screen. It should run in standalone mode.
4. Open Lain-lain → Luar Talian & Pemasangan.
5. Choose **Muat Turun untuk Kegunaan Offline** and wait for the explicit successful
   download message. The public shell also precaches on the first successful service
   worker installation. A PID, visited page, or partially completed download is not
   an offline-readiness guarantee.
6. Before travel, close/reopen with airplane mode and test your actual iPhone.

The app does not show a fake auto-install button. Standalone mode is detected;
installation steps are replaced by a status message when already installed. The
manifest, Apple touch icon and safe-area presentation work without an Apple account.
The icon/title/solid launch background provide a compatible launch presentation;
no unsupported device-specific splash-screen dimensions are claimed.

## Caching and paths

`public/manifest.webmanifest` uses relative id/start_url/scope and relative PNG
icons. `scripts/pwa.mjs` builds a content-hashed, scoped `dist/sw.js` from
`src/offline/sw-template.js`. It precaches the actual static build output, including
HTML, JS chunks, CSS, local fonts, icons and illustrations. New workers wait until
the user accepts an update; they do not force-refresh a running form. Only that
scope's superseded caches are removed after activation.

- GitHub Pages: `https://vasfplhsm.github.io/titipandoa/`, worker scope `/titipandoa/`.
- Netlify/root hosting: start URL `/`, worker scope `/` using the same relative build.
- The service worker ignores non-GET requests, cross-origin requests and API/auth
  paths. Supabase responses, tokens and private records are not put in Cache Storage.
- Navigation uses network-first with the precached public index as offline fallback.
- Public static assets use cache-first within the explicit build-time allowlist.
- Registration is production-only. `npm run dev` does not promise service-worker
  offline behavior. Use a production preview for acceptance tests.
- `netlify.toml` sets build output and no-cache headers for the worker/manifest.
  GitHub Pages controls its own HTTP cache headers; registration uses updateViaCache
  `none`. A foreground update check is rate-limited to thirty minutes, not a timer.

The app still starts its public/offline features if Supabase build variables are
missing. Server operations then remain blocked instead of crashing the whole shell.
The real public URL and anon key are still needed for actual server functionality.
Never build with a service-role key.

## IndexedDB and compatibility

`src/offline/db.js` wraps native IndexedDB (no runtime database dependency). Database
`titipandoa-offline`, schema version 1, contains:

| Store | Contents |
| --- | --- |
| publicContent | Explicitly downloaded reviewed doa/zikr catalogue |
| tasbih | Current per-zikr counts, settings/history/guided state |
| libraryState | Favourites, reading settings and guided-reading progress |
| preferences | Theme, dashboard visibility and explicit privacy/download choices |
| privateRecords | Only opted-in private doa/checklist/itinerary snapshots and selected flight settings |
| outbox | Durable server-bound operations and statuses/receipts |
| drafts | Explicitly saved/submitted doa drafts, including stable submission ID |
| notes | User-authored local itinerary notes |
| meta | Confirmed synchronization/download timestamps and downloaded owner ID |

`bootstrapPersistence()` migrates the existing Tasbih/library/theme keys without
resetting them. IndexedDB is primary; the existing localStorage values are mirrored
as a compatibility/recovery fallback where available. Each action schedules a write
immediately, and safe updates wait for outstanding transactions. Same-millisecond
legacy/IndexedDB recovery prefers a newer different compatibility snapshot over a
stale committed snapshot. Both unavailable/full stores produce an error, not a false
save. Storage eviction, private browsing policies, app removal and device failures
can still remove local data: keep important records on Supabase and export readings
when useful. Do not claim absolute crash/eviction immunity.

The retained web Tasbih components share this **web app** state, including
separate counters and guided progress. Native WidgetKit storage is separate; see
[the iOS companion guide](../ios/README.md).

## Privacy controls

Public readings are safe to cache automatically. Private snapshots require explicit
selection plus a server-verified signed-in owner before download. The owner identity
comes from `auth.getUser()` and trusted `app_metadata.titipandoa_role = owner`, not the
legacy PIN. Expenses, budgets, tokens and privileged credentials are excluded from
the general offline database and HTTP cache.

Selected itinerary downloads also include flight settings only, never the budget settings. Private snapshots/notes/outbox data are local plaintext, not encrypted. The UI tells
the user to protect their device/browser profile. Download only what is necessary.
An opted-in prior download can be read offline on that device with its matching previously verified owner record. The former local owner PIN is unused; the device marker is not encryption or a backend authorization boundary.

The clear-private-copy action removes downloaded private records and local notes;
it refuses while private patches are unresolved. Pending changes must first be
resolved or explicitly discarded. Server records are never deleted by this action.
Draft saving has a separate opt-in, and each offline submission explicitly confirms
local retention. Confirmed/discarded outbox payloads are redacted, retaining only
non-secret identifiers/status metadata; unresolved payloads stay durable for recovery.

## Synchronization semantics

- Public submissions get a client UUID and payload fingerprint. Retries retain that
  UUID. Changing a draft cannot silently reuse an ID for a different payload.
- An insert is complete only after a successful server response. After a duplicate
  ID, the existing row must be read and compared before claiming success. If RLS
  prevents that confirmation, the operation remains blocked for review; no new ID
  is silently generated to create a duplicate.
- Offline checklist completion and explicitly queued itinerary **notes** use one
  IndexedDB transaction for optimistic local changes plus their outbox entry.
  Unsent edits to the same record coalesce. Other itinerary editing/creation,
  finances, deletion and Amin are online-only. No destructive action or Amin tap
  is silently queued for later replay.
- Owner patches retain the downloaded server `updated_at`. Sync verifies the same
  signed-in owner ID, then calls a version-checked idempotent RPC. Missing owner
  credentials, missing schema/RPC, unsupported UUID schema, unauthorized access and
  conflicts stay visible. They are never labelled synchronized.
- The reviewed RPC locks the row and records an operation receipt atomically.
  A lost acknowledgment can be retried under the same operation ID. A changed
  server version returns a conflict and does not overwrite newer data. The UI shows
  both values and permits explicit acceptance of the server/discarding the local
  patch. It does not offer a blind force overwrite.
- Sync runs on launch, reconnect, foreground and explicit user action. There is no
  reliance on iOS Background Sync, no continuous five-second polling, and no hidden
  retry loop while offline. Realtime is subscribed only for the visible online
  owner UI, with burst refreshes coalesced, and disconnected when hidden/offline.
- Automatic sample seeding and settings writes on startup/reconnect were removed.
  Existing rows are not deleted, renamed, rewritten or re-seeded by this change.
- Status labels describe pending device changes. The last successful timestamp is
  written only after confirmed server success; online connectivity alone does not
  imply that pending work has synchronized.

## Required backend setup for private sync — not automatically applied

The existing repository supplied only a browser anon client and local PIN. No secure
owner account, live policy introspection credentials or approved migration execution
was supplied. Therefore **private server synchronization is not production-verified
or enabled by a silently applied policy change**. Public offline reading/counting
works independently; private queued changes remain stored/blocked until setup.

Before using private sync:

1. Back up production data and the complete existing policy definitions, e.g. export
   `select * from pg_policies where schemaname='public';` and schema definitions.
   Test against a separate Supabase development project first.
2. Review `supabase/migrations/20261031_reviewed_offline_sync.sql`. It deliberately
   requires the session setting `titipandoa.security_review = approved` before it
   can run. No tool in this task executes it against production.
3. Verify the existing `doas.id` is UUID/text-compatible. The migration refuses an
   unsupported numeric key rather than renaming/converting a live primary key.
   For another schema, design/review an additive stable-client-ID adapter first.
4. The migration enables RLS and replaces existing policies on doas, checklist,
   itinerary, expenses and app_settings with authenticated-owner policies plus
   anonymous validated submission inserts. It adds version timestamps/itinerary
   notes and an RLS-protected receipt table/RPC; it does not delete existing rows.
   Existing anonymous owner reads/writes will stop working after this restriction.
5. Register a real owner in Supabase Auth. Through a trusted server/Admin API or
   trusted dashboard action, assign `app_metadata: {"titipandoa_role":"owner"}`.
   Never use editable user_metadata or localStorage for this grant.
6. Configure email OTP delivery and allow both production redirect URLs in Supabase
   Auth. The app's email flow uses `shouldCreateUser: false`. Obtain a fresh session
   after assigning the role, then use the signed-in owner's download/sync controls.
7. Download fresh records so the client has real version timestamps. Validate the
   RLS/RPC acceptance matrix below before production rollout.

Rollback: stop syncing, retain/export pending outbox items, and restore the exact
previous policies from the reviewed backup only if that is intentional. The added
columns/receipt data can safely remain. Do not automatically weaken RLS or drop
receipt/private data to make old anonymous access work. Removing the RPC alone
safely leaves operations blocked, not falsely completed.

## Live backend acceptance matrix (requires your approved isolated project)

These checks are instructions, **not tests claimed as executed against production**:

- Anonymous: valid new UUID submission succeeds; duplicate UUID cannot create a
  second row; private reads/checklist, expense and app_settings writes are rejected.
- Authenticated non-owner: all private reads/mutations and offline RPC rejected.
- Trusted owner: required reads/mutations permitted; server role cannot be obtained
  by changing user_metadata, JavaScript or localStorage.
- Download version A, change server to B, then submit a patch based on A: conflict,
  B unchanged. Inspect client local state and explicit conflict resolution.
- Apply one operation, lose its response, retry the same operation: one change,
  same receipt/result. Reuse its ID with a different payload: rejected.
- Unsupported entity/columns, null payload, malformed expected version, another
  owner's ID and missing records: rejected without partial updates or receipts.
- Check Realtime respects RLS and that no sensitive API response enters Cache Storage.

## Update flow

New workers wait. The update control is disabled while operations are pending or
syncing. On acceptance, the app waits for local transactions and persistence, blocks
active unsaved private editors, and explicitly offers to save an unsent doa draft.
Only then does it tell the waiting worker to activate and reload once. Local notes
autosave to IndexedDB. No forced update interrupts a running unsaved form.

## Test scope

Automated browser tests use Chromium with mocked Supabase responses; no production
record is created/modified by tests. They cover offline close/reopen, primary
IndexedDB counter recovery, durable submissions, authorization failure, conflicts,
lost acknowledgments, scope/path correctness, private HTTP-cache exclusion, safe
worker updates, and phone/landscape layouts. The same artifact is tested at root
(Netlify-style) and `/titipandoa/` (GitHub Pages-style). This is not a live Netlify
account deployment or a physical iPhone test.

Test on the actual iPhone before travel:

- Install from Safari; verify icon, standalone launch, theme, safe areas and keyboard.
- Wait for offline-ready confirmation; enable airplane mode, force-close and reopen.
- Read doa/zikir, tap Tasbih rapidly, reopen and verify counts. Test selected/private
  cached itinerary/checklist with the device protected. Verify undownloaded finance
  data is not presented as a successfully cached offline record.
- Edit checklist/notes offline, restart, reconnect after approved backend setup;
  verify one successful change and a real server version, or visible conflicts.
- Send a draft offline; reconnect; verify one row, not duplicate submissions.
- Test storage denial/eviction and device/app removal. Keep essential records backed
  up on Supabase; local persistence cannot defeat OS storage eviction.
- Test a new release with unsent drafts/pending outbox items; ensure no surprise refresh.
- Test VoiceOver, large Arabic font, landscape and small/large iPhone sizes.
