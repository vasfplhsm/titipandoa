> Current owner authentication and redesign: [rollout guide](TUMPANG_DOA_REBRAND.md).
> The app now verifies a Supabase Auth owner. Historical discussion of a local PIN
> below describes the original repository, not the current authorization gate.

# Koleksi Doa & Zikrullah: content and security workflow

The curated library is versioned public content shipped with the application. The later PWA/platform storage and optional private-sync migration are documented separately in PWA_AND_SYNC.md. It
is separate from community submissions in `doas` and does not read or write a new
Supabase table. This is appropriate for this repository: there is no Supabase
Auth/admin authorization system, and the existing local owner PIN is not a trusted
server-side administrative role. No public editor, admin endpoint, service-role
key, migration or additional anonymous database permission is introduced.

## Content model

`src/library/entries.json` contains 54 published entries: 32 Qur'anic readings and
22 hadith-based supplications/zikr. Fields include stable IDs, title, exact Arabic,
optional Rumi, independently written Malay explanation, multiple categories,
source type/reference/link, context, sourced repetition count, verification status,
publication status, verification date, and Arabic SHA-256. Audio controls are
omitted because there are no permissioned recordings configured.

`content/source-excerpts.json` retains the actual selected source texts, reference
numbers, download origins and hashes. `content/provenance.json` records hashes of
the full downloaded datasets. `content/count-decisions.json` separately records
reviewed count/reference decisions. This material is audit evidence, not runtime
content fetched from external services. `content/pending.json` is NOT imported into
the application. Corrupted or pending material must stay there until corrected.

Arabic source snapshots were obtained from:

- QuranEnc Uthmani text via Risan Bagja Pradana's `quran-json` **v3.1.2**. Retain the
  attribution and CC BY-SA 4.0 license in `content/QURAN-LICENSE.txt`. Arabic strings
  are verbatim complete verses; line breaks separate verses. Their Malay text is
  a new explanation covering the displayed verse, including its narrative context.
- Arabic Bukhari/Muslim/Abu Dawud via `fawazahmed0/hadith-api`, edition **1**, whose
  references include Sunnah.com and other attributed hadith sources. Retain its
  Unlicense in `content/HADITH-LICENSE.txt`. Supplied Arabic is an exact substring
  of the selected full narration, without combining variants. Abu Dawud grading
  statements name the grading authority from the snapshot metadata.

The audit establishes text/reference correspondence with these attributed mirror
snapshots. Direct retrieval from Quran.com or Sunnah.com and a new scholarly
assessment of sanad are not claimed. A qualified independent religious review is
still useful before treating this as an officially endorsed religious publication.
No named reviewer or institutional endorsement is invented.

## Import and publication

1. Draft new content in a separate local candidate file or `content/pending.json`,
   with `published: false` and `verification_status: pending`. Never expose an
   unreviewed candidate by adding it to the published dataset.
2. Obtain the cited Arabic source and rights/provenance. Store its exact text,
   origin, reference and SHA-256 in `content/source-excerpts.json`. Do not repair
   corrupted Arabic by guessing. Do not combine narrations silently.
3. Review the Arabic against the source, write/review the Malay explanation and
   category assignments, and check the source reference/URL. Leave Rumi null when
   it cannot be checked confidently. Document edition, variant and context.
4. For an established count, retain the narration establishing that number and
   record the decision in `content/count-decisions.json`. Otherwise use null. A
   guided reader's fallback of one reading is explicitly a reading step, not a
   claimed religious prescription. Prayer/tawaf/sai rounds receive no invented
   individual supplications.
5. Only after that review, add the stable, unique entry to
   `src/library/entries.json` with `verification_status: verified`, `published: true`,
   the checked date, source key, and Arabic SHA-256. Remove its pending candidate.
   Preserve existing IDs and text when unrelated content changes. This is a
   trusted repository change reviewed through the normal Git/code-review workflow,
   not a privilege ordinary visitors obtain through JavaScript or localStorage.
6. Run `npm test`, `npm run lint` and `npm run build`. `npm test` regenerates
   `content/audit.json` and rejects duplicate IDs/Arabic, altered source hashes,
   Arabic not found verbatim in its source, invalid categories, missing metadata,
   changed count decisions and published unverified entries.
7. Review the audit and Git diff, run the browser suites, then deploy using the
   existing `npm run deploy` workflow. Build-time Supabase variables remain the
   existing public URL/anon key; never use a service-role key.

## Local data and offline access

- `titipandoa.library.v1` stores favourites, reading preferences and guide progress
  for guests. Input is sanitized against published IDs; it cannot add content or
  grant curated administrative permissions. Denied/full storage displays a warning
  and reading continues in memory. Existing Tasbih and owner keys are unchanged.
- Morning, evening and post-prayer sessions have distinct progress and can resume,
  skip, mark completion or restart with confirmation. Their editorial sequence is
  not called an official al-Ma'thurat edition or a compulsory ritual.
- Opening a sourced count in Tasbih requires a clear handoff action. Existing counts
  are retained; an active Tasbih guided session is archived only after confirmation.
- Already loaded content is usable offline. The offline-download button creates a
  complete standalone HTML reading pack with all Arabic, meanings and references;
  it needs no network, script, font CDN or API. Interactive progress is kept in the
  web app, not in the downloaded file. A fresh offline launch of an uncached web
  app is not promised; the PWA shell now supports offline relaunch after successful caching.
- Shares use `#doa/<id>` deep links under the existing `/titipandoa/` base. Native
  sharing falls back to clipboard, then selectable manual copy. Attribution and
  source links remain included.
- Daily selection is deterministic for the `Asia/Kuala_Lumpur` calendar day and
  is refreshed while an open page crosses midnight. It selects published content
  without generating religious text or making paid API calls.

## Verification boundaries

No database schema or RLS policy changes are required or applied. The browser
regressions mock existing Supabase reads, submissions and Amin writes, and block
all real remote writes. Existing live RLS/authorization cannot be established from
those tests and is not claimed. If curated content later moves into Supabase,
first establish server-verified Auth/administrator roles, RLS for public verified
reads and admin-only writes, and policy tests against an isolated database. Never
reuse the local owner PIN/localStorage flag as that authority.

Run browser checks against a preview built for `/titipandoa/`:

```sh
npm run preview -- --port 4174 --base /titipandoa/
PLAYWRIGHT_MODULE=/path/to/playwright TASBIH_TEST_URL=http://127.0.0.1:4174/titipandoa/ node tests/library.browser.cjs
PLAYWRIGHT_MODULE=/path/to/playwright TASBIH_TEST_URL=http://127.0.0.1:4174/titipandoa/ node tests/redesign.browser.cjs
PLAYWRIGHT_MODULE=/path/to/playwright TASBIH_TEST_URL=http://127.0.0.1:4174/titipandoa/ node tests/tasbih.browser.cjs
```

Playwright can be installed outside this checkout; it is not an application
dependency. Chromium defaults to `/usr/bin/chromium`; use `CHROMIUM_PATH` to change it.
