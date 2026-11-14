# Original announcement and theme upgrade

Work branch: `feat/original-announcement-multitheme`, based on the completed Tumpang
Doa rebrand. No database scripts or production deployment are run automatically.

## The original message is immutable

The previous redesign had replaced the long message with a short invitation. The
complete `INTRO_NOTE` was recovered directly from `src/App.jsx` in Git commit
`797d178` (the same original text is also in the older main revision). All eleven
paragraphs, including 23 November 2026, forgiveness requests, halal-kan wording,
emoji, punctuation and closing greeting are preserved verbatim and in order.

The shared constant now lives in `src/content/intro-note.js` and is imported by App.
`tests/fixtures/original-intro-note.json` is an independent historical fixture;
`src/content/intro-note.test.js` checks every paragraph plus its immutable SHA-256:
`8267ecfe5ba5ddc7505d6a95849eb5eed2e049bde1bbcffc8cb6d47c72223b15`.
Do not regenerate that fixture/hash to accommodate an unintended text change.

The public homepage shows the welcome, every original paragraph without collapsing
or truncating it, and then “Ada doa nak dikirim?” with the Tumpang Doa button.
The form is not mounted on the homepage. Selecting the button opens the accessible
submission view. Returning home always restores the whole announcement. Shared
links continue to use only origin/path and never bypass the message.

The existing editable `announcement` profile field is retained as a separate,
optional additional note after the original. It cannot replace, shorten or reorder
the original message. The generic default additional note is omitted to avoid
repeating it. Existing profile fields, dates and sharing text remain stored.

## One application, three themes

`src/theme/model.js` centralizes Rosewood & Champagne (default), Sage & Sand and
Coastal Serenity, each with a deliberately designed light and dark palette. Semantic
text and button pairs are contrast-tested. `ThemeProvider` resolves the public
defaults, independent local overrides and device appearance. `themes.css` maps these
tokens into the retained library, Tasbih, planning forms, dialogs and navigation.
Theme changes do not reload or remount the app or alter prayers, reading flags,
notes, counters, history, travel records, outbox operations or authentication.

In owner settings, **Tema & Penampilan** has three preview cards with swatches,
selected indicators and apply buttons. Appearance options are Cerah, Gelap and
Ikut Peranti. System mode listens for live device preference changes. The existing
Tasbih appearance selector now controls the same app appearance; its old saved
settings object and all counter data remain intact.

Local overrides use `titipandoa.palette` (additive) and the existing
`titipandoa.theme` key (light/dark/system). IndexedDB bootstrap retains legacy
light/dark preferences. “Ikut Tema Awam” writes an empty-string sentinel to follow
the owner's defaults; it does not clear storage. Visitor header appearance choices
remain local. No visitor action can publish public preferences.

**Jadikan tema awam** is a separate owner action requiring fresh verified Supabase
owner authorization. Only `public_theme` and `public_appearance` are PATCHed, and
matching returned fields are required before confirming success. Ordinary profile
saves PATCH only intentionally edited non-theme fields and require matching returned
data. Untouched server fields and newer edits typed during a save are preserved.
A revision guard prevents late profile reads from overwriting acknowledged settings.
These saves also work with the earlier profile schema. New visitors fetch the public
profile; previously cached defaults are available offline. Existing local choices
take precedence until reset. Failed publication remains visibly unconfirmed.

## Backend and deployment prerequisites

Review `supabase/migrations/20261114120000_public_theme_defaults.sql` after the
previous owner-RLS and public-profile migrations. It adds only two NOT NULL text
columns with allowlisted CHECK constraints and default Rosewood/light values.
Existing owner-write/public-profile-read policies remain unchanged. It requires the
explicit review flag and does not run in the browser or build. No private tables,
prayers, dates, identifiers or policies are renamed/deleted. Retaining the additive
columns is safe when reverting the frontend; export their values before any
optional reviewed rollback.

The live Supabase schema/RLS remains unverified under this environment's network
policy. Before deployment, test anonymous and non-owner profile UPDATE denial,
verified-owner UPDATE/RETURNING, invalid palette/mode rejection, anonymous prayer
insert and direct private-table SELECT denial in an isolated project, then verify
production policies. No privileged credentials are introduced. See the previous
[security rollout guide](TUMPANG_DOA_REBRAND.md) for account/grant/RPC prerequisites.
If the theme columns are absent, visitor defaults safely fall back to Rosewood/light
and publication reports a save error; it never pretends local-only selection is public.

PWA IDs, scope, relative deployment paths, storage/database identifiers, native bundle
IDs and widget kinds are unchanged. Static manifest/launch colors, original icons,
Apple touch icon and social artwork use the default Rosewood palette. Runtime
`theme-color`, body and color-scheme follow the selected theme. Installed icon and
launch-image caching is controlled by iOS; icons do not recolor on theme changes.
Native widget source uses the default palette and remains independent of PWA
preferences; no cross-platform theme synchronization is claimed.

Set `VITE_PUBLIC_URL` to the actual public host/path for social metadata; WhatsApp
preview caching is host/app-dependent. GitHub Pages `/titipandoa/` and Netlify `/`
remain supported. Builds and mocked browser tests do not publish either site.

## Validation

Run `npm test`, `npm run lint`, `npm run build` and the existing browser suites.
The new `tests/themes.browser.cjs` checks exact visible paragraph order, form
activation, all six theme variants, system changes, local persistence/legacy state,
owner publication failure/success and fresh visitor behavior at both deployment
paths. `tests/settings-hydration.browser.cjs` covers late profile loading and saved updates
arriving in either order (`SETTINGS_LATE_PROFILE=1` selects the second case).
Browser tests mock/block backend requests and never change production records.
Physical iPhone Safari/standalone installation, safe areas/keyboard/VoiceOver,
OS eviction, and Xcode/native compilation remain manual device checks.
