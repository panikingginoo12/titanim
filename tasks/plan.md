# Implementation Plan: Pa-ampon — seed & plant swap (Phase 5)

> Earlier phases (MVP + Phase 4) are in `tasks/plan-mvp.md`.

## Overview

Let plantitos and plantitas show what seeds, cuttings and plants they can share, find people nearby who have what they want, and arrange swaps or giveaways ("pa-ampon") that end in a meetup.

Three user-facing pieces:
1. **Binhi Box (my listings):** seeds, cuttings, pups and plants I'm willing to share, visible to other users.
2. **Malapit sa Akin (near me):** people within a few km and their available listings, with no exact location ever exposed.
3. **Palitan (trading):** request → accept → chat → meet → mark done → thumbs-up.

This is the first feature that needs a server. My Garden, photos, quests and XP stay on the phone exactly as today; only listings, profiles, trades and chat go online.

## Hard rules (decided up front)

| Rule | Why |
|---|---|
| **No exact locations, ever.** Server snaps location to a ~1 km grid cell; other users only see a distance bucket (< 1 km, 1–3, 3–5, 5–10 km) and a place label the owner typed (e.g. "Brgy. Malanday, Marikina"). | Rare plants get stolen; people get stalked. A grid cell is the most the database ever stores. |
| **Opt-in.** Nothing is visible until the user turns on "Ipakita ako sa Malapit sa Akin". | Data Privacy Act (RA 10173): consent for location. |
| **Swaps and gifts only, no money in v1.** | No payments to build, no BIR/DTI questions, and less fuel for the plant-poaching market. |
| **Meetups only, no shipping in v1.** | Moving plants between islands needs Bureau of Plant Industry permits. |
| **18+ to trade.** Browsing is open; requesting/accepting trades and chat need an 18+ confirmation. | Trades end in meeting a stranger. |
| **No wild-collected or threatened plants.** Every listing confirms "propagated, not taken from the wild"; names on a watch list (Waling-waling, pitcher plants, Kris/Green Velvet Alocasia, etc.) show a warning and get flagged for review. | RA 9147 covers plants. DENR has warned plantitos that selling or collecting wild threatened species carries jail time and fines up to ₱1M. |
| **Block and report exist before trading ships.** | Basic safety for a stranger-to-stranger feature. |

## Architecture decisions

- **Backend: Supabase Free.** Postgres + PostGIS (nearby queries), Auth, Storage (listing photos), Realtime (chat). All access goes through Row Level Security and a few `SECURITY DEFINER` RPCs.
  - Free limits that matter: 500 MB database, 1 GB file storage, 5 GB egress/month, 50k MAU, 2 projects. A free project **pauses after a week with no requests** and must be restored from the dashboard — only an issue during development.
- **Login: Google, via Supabase OAuth in the browser.**
  - Email codes are not ₱0: Supabase's built-in mailer is capped at 2 emails/hour, and a free SMTP plan like Resend's (100/day) needs a verified domain you'd have to buy.
  - Google sign-in through the system browser works in Expo Go for testing; the native Google button needs a development build later.
  - Browsing nearby listings can start from a Supabase **anonymous session** (no login); creating listings and trading require linking a Google account. Anonymous sign-ins need CAPTCHA (Turnstile, free) to stop database spam.
- **Location:** reuse the weather place (already rounded to ~1 km on the phone). The server snaps again to its own grid so a modified client can't store anything more precise. Nearby search is an RPC that returns listings plus a distance bucket, never coordinates; max radius 10 km.
- **Photos:** max 3 per listing, compressed to ~800 px (~80 KB) plus a 300 px thumbnail for lists. Keeps 1 GB storage and 5 GB/month egress workable for an early community.
- **Chat:** one thread per accepted trade, Supabase Realtime with a polling fallback. No chat before a trade is accepted.
- **Notifications:** v1 shows badges when the app opens. Push (new request, new message) comes later: it needs a development build or APK (Expo Go dropped remote push on Android) plus an Edge Function calling Expo's free push service.
- **Schema lives in the repo** as Supabase migrations (`supabase/migrations`), with RLS tests.

## Data model (server)

- `profiles` — `id` (= auth user), `display_name`, `area_label`, `cell` (PostGIS point, snapped), `nearby_visible`, `adult_confirmed_at`, `trades_completed`, `thumbs_up`, `created_at`
- `listings` — `id`, `owner_id`, `kind` (seed / cutting / pup / bulb / plant), `title`, `species_id` (bundled id, optional), `scientific_name`, `quantity`, `note`, `wants` ("kapalit" text), `gift_ok`, `photo_paths[]`, `status` (available / reserved / traded / hidden), `not_wild_confirmed`, timestamps
- `trades` — `id`, `requester_id`, `owner_id`, `listing_id` (what's asked for), `offered_listing_ids[]` (empty = asking as pa-ampon/gift), `message`, `status` (requested / accepted / declined / cancelled / completed), `requester_done`, `owner_done`, timestamps
- `messages` — `id`, `trade_id`, `sender_id`, `body`, `created_at`
- `ratings` — `trade_id`, `rater_id`, `ratee_id`, `thumbs_up`
- `blocks` — `blocker_id`, `blocked_id`
- `reports` — `id`, `reporter_id`, `target_user_id`, `listing_id`, `reason`, `status`, `created_at`

RPCs: `set_my_cell(lat, lon)`, `nearby_listings(radius_km, kind, query)`, `request_trade(...)`, `respond_trade(trade_id, accept)`, `cancel_trade(trade_id)`, `mark_trade_done(trade_id)`. Trade status changes only happen inside these RPCs, never by direct UPDATE.

## Dependency graph

```
Spikes: Supabase + Google login in Expo Go · PostGIS nearby RPC
   │
Supabase setup + client + migrations
   │
Sign in + profile (name, area, 18+, consent)
   │
Binhi Box: my listings + photos ──────── "Offer from My Garden" shortcut
   │
Other users' profiles (public listings) ─┐
   │                                     │
Location opt-in + snapped cell           │
   │                                     │
Malapit sa Akin feed ────────────────────┤
   │                                     │
Block + report ──────────────────────────┘
   │
Trade request + inbox
   │
Accept / decline / cancel (server state machine)
   │
Trade chat ── Mark done + thumbs-up
   │
Launch: account deletion, privacy policy, moderation, push
```

## Task list

### Phase 5.0: Spikes
- [ ] 5.0a Supabase + Google login works in Expo Go
- [ ] 5.0b Nearby query with snapped cells and distance buckets

### Checkpoint 5.0
- [ ] Login round-trip works on your phone in Expo Go
- [ ] Nearby RPC returns buckets only, verified with SQL
- [ ] Human review: confirm rules, login choice and open questions

### Phase 5.1: Accounts and Binhi Box
- [ ] T1 Supabase project, client, migrations in repo
- [ ] T2 Sign in with Google + profile setup
- [ ] T3 Binhi Box: add/edit/hide listings with photos
- [ ] T4 Offer from My Garden shortcut
- [ ] T5 View another user's profile and public listings

### Checkpoint 5.1
- [ ] Two test accounts: A's listings visible to B; B can't edit A's; hidden listings invisible
- [ ] RLS tests pass

### Phase 5.2: Malapit sa Akin
- [ ] T6 Location opt-in + snapped cell
- [ ] T7 Nearby feed with radius, type and name filters
- [ ] T8 Block and report

### Checkpoint 5.2
- [ ] Accounts placed in different cells see correct buckets; blocked users disappear both ways
- [ ] No API response contains coordinates

### Phase 5.3: Palitan
- [ ] T9 Trade request + inbox
- [ ] T10 Accept / decline / cancel with listing reservation
- [ ] T11 Trade chat
- [ ] T12 Mark done + thumbs-up

### Checkpoint 5.3 (closed beta)
- [ ] Full swap between two real phones, end to end
- [ ] 5–10 testers in one city for a week

### Phase 5.4: Before public launch
- [ ] T13 Account and data deletion (in app + web page)
- [ ] T14 Privacy policy, terms, safety tips, Play data-safety form
- [ ] T15 Moderation: report queue, auto-hide, wild-plant watch list
- [ ] T16 Push notifications (development build + Edge Function)

---

## Task details

### 5.0a Supabase + Google login spike
**Description:** Create a Supabase project, enable Google provider (Google Cloud OAuth client, free) and anonymous sign-ins. Throwaway screen: anonymous session → "Link Google" via `expo-web-browser` → session persists after restart.
**Acceptance criteria:**
- [ ] Works in Expo Go over tunnel; redirect URL handling documented
- [ ] Anonymous user converts to Google user without losing its id
**Verification:** Manual on your phone; note findings in `docs/supabase-spike.md`
**Dependencies:** None
**Scope:** S

### 5.0b Nearby query spike
**Description:** Local SQL: PostGIS points snapped to a ~1 km grid, `nearby_listings` returning distance buckets. Measure query time with 10k fake listings.
**Acceptance criteria:**
- [ ] Output contains bucket labels, never lat/lon
- [ ] < 100 ms for 10 km radius with 10k listings (GiST index)
**Verification:** SQL script + EXPLAIN output in `docs/supabase-spike.md`
**Dependencies:** None
**Scope:** S

### T1 Supabase project, client, migrations
**Description:** `supabase/` folder with migrations for all tables, RLS on every table, `src/lib/supabase.ts` client (session stored with expo-secure-store / AsyncStorage per Supabase's Expo guide), env vars in `.env.local`.
**Acceptance criteria:**
- [ ] `supabase db reset` builds the schema from scratch
- [ ] Every table has RLS enabled; anon key can't read private columns
**Verification:** RLS test file (pgTAP via `supabase test db`); `npm run typecheck`
**Dependencies:** Checkpoint 5.0
**Files:** `supabase/migrations/*`, `supabase/tests/*`, `src/lib/supabase.ts`, `.env.example`
**Scope:** M

### T2 Sign in + profile setup
**Description:** "Palitan" tab (or Profile section) → sign in with Google → profile form: display name (prefilled from local settings), area label, 18+ confirmation, consent to terms and location use.
**Acceptance criteria:**
- [ ] Can't create listings or trade without 18+ and consent
- [ ] Signing out keeps My Garden untouched
**Verification:** Manual; RLS test that unconfirmed profiles can't insert trades
**Dependencies:** T1
**Files:** `src/app/(tabs)/palitan.tsx`, `src/app/account/*`, `supabase/migrations/*profiles*`
**Scope:** M

### T3 Binhi Box: my listings
**Description:** Add/edit/hide listings: kind, plant (pick from catalog or free text), quantity, note, "kapalit" wants, gift OK, up to 3 photos (compressed + thumbnail, uploaded to Storage under `listings/<user>/<id>/`), "propagated, not from the wild" checkbox.
**Acceptance criteria:**
- [ ] Listing appears in my Binhi Box after app restart (from server)
- [ ] Photos ≤ 120 KB, thumbnails ≤ 30 KB; deleting a listing deletes its photos
- [ ] Max 30 active listings per user (enforced server-side)
**Verification:** Manual; storage policy test (users write only their own folder)
**Dependencies:** T2
**Files:** `src/app/listings/*`, `src/lib/listings.ts`, `supabase/migrations/*listings*`
**Scope:** M

### T4 Offer from My Garden
**Description:** Button on a plant's page: "Mag-alok ng cutting/binhi" → listing form prefilled with species, nickname and latest photo.
**Acceptance criteria:**
- [ ] Prefill correct for bundled and GBIF/unknown plants
**Verification:** Manual
**Dependencies:** T3
**Files:** `src/app/plant/[id]/index.tsx`, `src/app/listings/new.tsx`
**Scope:** S

### T5 Other user's profile
**Description:** Public profile screen: name, area label, trades completed, thumbs-up, available listings. Reached from nearby feed, trades, and a "share my Binhi Box" image (share sheet, no deep link needed).
**Acceptance criteria:**
- [ ] Hidden/traded listings not shown; no location fields in the response
**Verification:** Two accounts on two phones (or phone + web preview)
**Dependencies:** T3
**Files:** `src/app/u/[id].tsx`
**Scope:** S

### T6 Location opt-in + snapped cell
**Description:** Toggle "Ipakita ako sa Malapit sa Akin" with plain-language consent. Uses the weather place (or asks for it); calls `set_my_cell`, which snaps server-side. Turning it off clears the cell.
**Acceptance criteria:**
- [ ] Stored cell is grid-snapped even if the client sends precise coordinates
- [ ] Off = invisible in nearby results immediately
**Verification:** SQL test on `set_my_cell`; manual toggle test
**Dependencies:** T2
**Scope:** S

### T7 Malapit sa Akin feed
**Description:** List of nearby available listings grouped by person: thumbnail, plant, kind, distance bucket, area label, "kapalit". Filters: radius (1/3/5/10 km), kind, plant name. Pull to refresh, paged.
**Acceptance criteria:**
- [ ] Results sorted by distance bucket then newest
- [ ] Works with anonymous session for browsing; "Request" asks to sign in
- [ ] Response payload contains no coordinates (checked in test)
**Verification:** SQL tests for buckets and filters; manual with 2–3 accounts in different cells
**Dependencies:** T5, T6
**Files:** `src/app/(tabs)/palitan.tsx`, `src/lib/nearby.ts`, `supabase/migrations/*nearby*`
**Scope:** M

### T8 Block and report
**Description:** Block from profile or chat (hides both ways everywhere). Report a user or listing with a reason.
**Acceptance criteria:**
- [ ] Blocked users never appear in nearby, profiles, trades or chat for either side
- [ ] A user can't report the same listing twice
**Verification:** RLS tests for block visibility
**Dependencies:** T7
**Scope:** S

### T9 Trade request + inbox
**Description:** On a listing: "Makipagpalit" → choose what to offer from my Binhi Box, or ask as pa-ampon if the owner allows gifts; short message. Inbox with Incoming / Outgoing tabs and status chips; badge count on the tab.
**Acceptance criteria:**
- [ ] Can't request my own listing, a non-available listing, or from someone who blocked me
- [ ] Max 5 open outgoing requests per user (anti-spam)
**Verification:** SQL tests on `request_trade`; manual
**Dependencies:** T8
**Files:** `src/app/trades/*`, `src/lib/trades.ts`, `supabase/migrations/*trades*`
**Scope:** M

### T10 Accept / decline / cancel
**Description:** Owner accepts or declines; either side can cancel before completion. Accepting reserves the requested and offered listings and auto-declines other pending requests for the same listing.
**Acceptance criteria:**
- [ ] Only valid transitions succeed (requested→accepted/declined/cancelled, accepted→completed/cancelled)
- [ ] Cancelling an accepted trade frees reserved listings
**Verification:** SQL state-machine tests covering every transition
**Dependencies:** T9
**Scope:** M

### T11 Trade chat
**Description:** Chat per accepted trade (Realtime, with polling fallback). Pinned safety card: meet in a public place, daytime, bring a friend, don't share your home address. Block/report from chat.
**Acceptance criteria:**
- [ ] Only the two traders can read/send; chat read-only after completion or cancel
- [ ] Messages ≤ 1,000 chars; links and phone numbers allowed (their choice) with a reminder
**Verification:** RLS tests; two phones
**Dependencies:** T10
**Files:** `src/app/trades/[id].tsx`, `src/lib/chat.ts`
**Scope:** M

### T12 Mark done + thumbs-up
**Description:** Both sides tap "Tapos na ang palitan"; trade completes when both confirm. Then an optional thumbs-up. Profile shows completed trades and thumbs-up count. A new badge "Unang Palitan" in the local game layer.
**Acceptance criteria:**
- [ ] Completed only after both confirm; listings marked traded (or quantity reduced)
- [ ] One rating per person per trade
**Verification:** SQL tests; manual
**Dependencies:** T11
**Scope:** S

### T13 Account and data deletion
**Description:** "Delete my Palitan account" in app removes profile, listings, photos, chats and ratings (trades kept anonymized for the other party). Public web page with deletion instructions (GitHub Pages, free) — required by Google Play for apps with accounts.
**Acceptance criteria:**
- [ ] After deletion nothing identifies the user; My Garden on the phone unaffected
**Verification:** SQL test; manual
**Dependencies:** T12
**Scope:** M

### T14 Privacy policy, terms, safety
**Description:** Plain-language privacy policy (RA 10173), terms (swaps/gifts only, no wild plants, 18+, meetups at your own risk), safety tips page; link from sign-up and Profile. Fill in Play Console data-safety form.
**Acceptance criteria:**
- [ ] Shown and accepted during sign-up; versioned so changes can re-ask
**Verification:** Review by you before launch
**Dependencies:** T2
**Scope:** S

### T15 Moderation
**Description:** Watch list of protected plant names that triggers a warning and a review flag; listing auto-hidden after 3 reports from different users; a simple review view (SQL views in Supabase dashboard).
**Acceptance criteria:**
- [ ] Watch-listed names are flagged regardless of capitalization/spacing
- [ ] Auto-hide works and owner sees why
**Verification:** SQL tests
**Dependencies:** T8
**Scope:** M

### T16 Push notifications
**Description:** Move testing to a development build/APK; register Expo push token; Edge Function on new trade request, accept, and message sends via Expo's push service.
**Acceptance criteria:**
- [ ] Push arrives within a minute; tapping opens the trade
**Verification:** Two phones with the APK
**Dependencies:** T11, development build
**Scope:** M

## Parallelization

- 5.0a and 5.0b are independent.
- T4 and T5 can run in parallel after T3.
- T13–T15 can start once their dependencies land; T14 can be drafted any time.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Location leak or plant theft | High | Grid snap on server, buckets only, opt-in, no address fields, safety card |
| Scams, harassment at meetups | High | 18+, block/report, ratings, public-place guidance, chat only after accept |
| Listing wild/threatened plants (RA 9147) | High | Not-from-the-wild confirmation, watch list, reports, auto-hide |
| Free-tier limits (1 GB storage, 5 GB egress) | Med | 3 photos/listing, thumbnails in lists, 30 listings/user; watch usage monthly |
| Free project pauses after a week idle | Low (dev only) | Restore from dashboard; not an issue once people use it |
| Spam accounts | Med | Turnstile on anonymous sign-in; Google required to list/trade; request limits |
| Empty map at launch ("no one near me") | High | Launch city by city with a seeded community (plant groups on Facebook), invite link |
| Anonymous browsing abused to scrape | Low | Rate-limited RPC, buckets only, small pages |

## Open questions

1. **Login:** Google only for now? Email login needs a domain (~₱600/yr) for a free SMTP sender.
2. **Money:** confirm swaps and gifts only, no selling, for v1.
3. **Shipping:** confirm meetups only for v1.
4. **Testing setup:** is Docker Desktop available on your PC? Local Supabase and RLS tests (`supabase start`, `supabase test db`) need it; otherwise tests run against a separate free test project.
5. **Moderation:** you're the moderator at first? Reports would land in a dashboard view you check.
6. **Launch area:** which city goes first, so testers are actually near each other?
