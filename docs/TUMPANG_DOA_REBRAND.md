> Superseded for homepage and themes by [the original announcement/theme upgrade](THEMES_AND_ANNOUNCEMENT.md). The complete original letter is restored, and Rosewood is now the default. Security and data-preservation prerequisites below still apply.

# Tumpang Doa redesign — review and rollout

Implemented on `feat/tumpang-doa-rebrand`, based on the existing offline PWA branch
(`797d178`). The initial workspace checkout was older; the PWA branch was retrieved
before making changes. No production deployment or database migration was performed.

## Architecture assessment and retained behavior

The original `App.jsx` orchestrates the visitor submission form, private prayer
records, checklist, flights, itinerary/timeline and expenses. Data lives in Supabase
`doas`, `checklist`, `itinerary`, `expenses` and `app_settings`. There is no server router:
Vite's relative base supports Pages `/titipandoa/` and Netlify `/`; library links use
`#doa/<id>` and `#panduan/<id>`. `#owner` and `?admin=true` now request verified login,
and no longer grant access themselves. Existing planning forms remain in App.

`src/library` owns the reviewed 54-entry catalogue, searches, favourites and guides.
`src/tasbih` owns counters, custom targets, history and source handoff. `src/offline`
owns the existing version-1 IndexedDB database, legacy localStorage migration, stable
submission IDs, owner operation queue, conflict handling and scoped service worker.
The database name, all existing storage keys, cache prefix, manifest ID/scope/start
URL, native bundle IDs/URL scheme/widget kinds and deployment paths remain stable.
No prayer IDs, historical flags, counters, notes or database records were migrated
or deleted by this redesign. Reader ID/font-size preferences are additive keys in
the existing preferences store and bootstrap migration.

`src/rebrand` adds the actual visitor journey, private inbox, resumable reader,
settings/sharing, owner sign-in, pure validation/filter helpers and Sage & Sand
semantic tokens. Existing CSS uses these tokens/compatibility aliases. Fonts remain
locally hosted Inter, Cormorant Garamond and Amiri. Original note/heart/arch SVGs
supply the wordmark symbol, favicon, raster app icons and social image.

## Public and owner boundaries

Public visitors see an invitation and optional-name/category prayer form, editable
examples, FAQ and confirmation after server acknowledgment. No request to read
`doas`, finances, itinerary or settings is made for an unauthenticated visitor.
Pending or blocked submissions remain visibly pending with their original UUID;
they cannot be edited/resubmitted under a new payload while unresolved. Original
input is retained through server failure. Offline submissions request local-save
consent. Religious examples are labelled personal wording, not scripture citations.

The old local PIN/default 1234/localStorage flag is no longer an authorization gate.
Owner access requires `supabase.auth.getUser()` returning trusted
`app_metadata.titipandoa_role = 'owner'`. OTP uses an existing account only
(`shouldCreateUser:false`). Account creation, role assignment and email delivery
must be configured by the project administrator. Never put service-role keys in
Vite variables. No account/role is created by this code.

Offline private reading requires a matching locally stored previously verified
owner marker and an explicitly downloaded snapshot bound to that owner. Only rows
matching that owner ID hydrate. Offline reading does not refresh expired Auth tokens. This is a convenience on a trusted device, not encryption or a
new server authentication guarantee. Use the clear-copy control before sharing a
browser/device; signing out clears in-memory private records but retains explicit
local downloads and pending operations for recovery. The old PIN keys remain
untouched and unused.

The inbox supports text/category/read filters, date ordering and confirmed read/undo
updates. The reader shows one prayer, optional sender, font controls, previous/next
and explicit read/undo; it resumes by stable record ID. Navigation never changes
reading status. Read status is online-only, with a compare-and-swap and confirmed
returned row. Downloaded prayers remain readable offline. No speculative offline
read-status synchronization was added to the reviewed versioned RPC.

The existing checklist, itinerary/flight editors, timeline, expenses, notes, library
and Tasbih remain available only in their appropriate modes. The countdown uses the
public departure date when configured, otherwise the existing private flight date.
Finances remain online-only. The old public community/Amin wall is removed from the
active experience; existing `amin_count` and bookmark fields/records are retained.

## Required backend review before deployment

The live schema/OpenAPI request failed with `URLError` under the configured network
policy. The schema, key types and actual production RLS have **not** been verified.
UI hiding is not a replacement for server authorization. Do not deploy until direct
anonymous REST checks prove that `doas`, `checklist`, `itinerary`, `expenses` and
`app_settings` return no private rows. Test authenticated non-owner denial too.

1. Back up existing policies/schema/data. Inspect every policy on the five private
   tables; permissive policies combine with OR, so adding another restrictive policy
   does not fix an existing public-read policy.
2. Review the previous `20261031_reviewed_offline_sync.sql` in an isolated project.
   It replaces legacy policies and supplies trusted owner authorization/versioned
   sync. It requires an explicit approval flag and UUID/text-compatible `doas.id`.
   Do not run it blindly or convert existing IDs. Verify custom category constraints
   accept the seven new labels plus historical/queued `Ampunan`/`Umum` values.
3. Create/configure the existing Supabase owner account and trusted app metadata;
   allow the exact root/Pages auth redirect URLs ending in `#owner`.
4. Review `20261114_tumpangdoa_public_profile.sql`, also guarded by explicit approval.
   It adds one visitor-safe profile table and an insert-validation trigger; it does
   not modify existing prayer rows or policies. Public SELECT is confined to the
   profile fields. Only verified owners may edit the profile. The trigger enforces
   inbox closure on the server, including old and offline clients. Existing queued
   submissions remain blocked/visible when the inbox is closed.
5. Test anonymous insert, anonymous/non-owner SELECT denial, owner read/undo,
   settings authorization, closed-inbox enforcement, queue conflict/lost-ack behavior
   and grants using real isolated-project credentials. Only then plan production.

If the new profile table is absent, the invitation uses the requested default
announcement and owner settings display a save error. No insecure fallback writes
private `app_settings` or publishes flight information. Optional anonymous names are
stored as `Tanpa nama`, compatible with the previous nonempty-name policy. The seven
new categories default to `Lain-lain`; historical category strings remain unchanged.
Anonymous duplicate inserts with a lost response cannot be assumed delivered when
SELECT is forbidden; the existing queue retains an unresolved/blocked state rather
than inventing confirmation. An administrator can reconcile that original UUID.

Rollback: revert the source branch to the prior PWA commit. After reviewing impact,
remove the new trigger/function using the instructions in its SQL; retain/back up
the profile table for recovery. No automatic rollback changes legacy RLS or records.

## Sharing and deployment

The owner's WhatsApp/native-share/copy link uses the current origin and pathname,
stripping all query/fragment owner state. No QR generator existed; the old QR icon
was decoration, so no nonfunctional QR control or extra dependency was introduced.
Configure `VITE_PUBLIC_URL` to the actual public origin and path for absolute static
Open Graph image URLs. Default: `https://vasfplhsm.github.io/titipandoa`.
Netlify/custom hosts must override it. WhatsApp caches and host responses determine
preview appearance; it is not guaranteed. Existing shared URLs/deep links still work.

Keep the existing GitHub Pages `gh-pages` branch/path or Netlify `dist` build config.
Build with the same public Supabase environment variables. Verify the security
checks above first. Publishing is a separate action; this task only prepares source.
Old installed PWAs update through the existing waiting-worker mechanism. Pending
operations block update activation and draft save is explicit. Do not clear storage
to force an update. Native display names, theme colors and widget labels are updated;
Swift symbols/bundle identifiers/widget kinds remain stable. Xcode/iPhone build and
installation still require the existing [iOS guide](../ios/README.md).

## Manual device acceptance

Test on an actual small iPhone in Safari and installed standalone mode: keyboard
and safe areas, text resizing/VoiceOver, reduced motion, light/dark themes, offline
force-close/reopen, pending submission reconnect, reading resume, old PWA update and
storage eviction. Linux Chromium results do not establish iPhone or Xcode behavior.
