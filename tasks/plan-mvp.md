# Implementation Plan: Plantito/Plantita App (₱0 build)

## Overview

A mobile app for Filipino plant hobbyists ("plantitos" and "plantitas"). Users add plants to their garden, take a daily progress photo of each plant, browse a plant catalog, and get daily care quests. A game layer (XP, streaks, badges, titles) and weather-aware tips make daily care feel like play.

**Constraint: zero running cost.** No paid APIs, no paid hosting, no server to keep alive. Everything runs on the phone, and only free, keyless (or free-key) public APIs are called.

## Requested features

1. **Daily progress log** — camera capture per plant, timeline of photos.
2. **Plant list** — searchable catalog backed by an open plant API.
3. **Daily quests** — small care tasks for growing each plant.

## Added features (all ₱0)

| Feature | Why it's fun | Effort |
|---|---|---|
| **Ghost overlay camera** | Last photo shows faintly over the viewfinder so every shot lines up | S |
| **Before–after slider + growth slideshow** | Swipe Day 1 vs today, or auto-play every photo in order | S |
| **XP, levels, Filipino titles** | Baguhan → Plantito/Plantita → Tito/Tita ng Halaman → Hari/Reyna ng Halamanan | S |
| **Dilig streaks** | Daily streak with one free "streak freeze" per week | S |
| **Badges** | "Unang Usbong", "Bagyo Survivor", "7-day Dilig", "Collector: 10 plants" | S |
| **Plant names and moods** | Each plant has a nickname and looks happy, thirsty, or sad based on care | S |
| **Local reminders** | Scheduled on the phone itself, no push server | S |
| **Weather-aware quests** | "Uulan bukas — skip watering", "Bring pots inside" during habagat/typhoon season | M |
| **Snap-to-identify** | Point the camera at an unknown plant and get the species | M |
| **Backup and restore** | Export garden + photos as one file to Drive/Files via the share sheet | M |
| **Taglish copy** | Familiar, friendly tone | S |

**Deferred (needs a server):** cloud sync across devices, Halamanan feed, Pa-ampon plant swap, leaderboards, any 3D features.

## Free data sources

| Source | What it gives | Limits / terms | Use it for |
|---|---|---|---|
| **Bundled care data** (our own JSON) | Care profiles for ~50 common PH plants | We write it; images from Wikimedia Commons with attribution | Quests and plant details |
| **GBIF Species API** | Taxonomy, scientific and vernacular names | Free, no key, open data | Catalog search beyond the bundled 50 |
| **Pl@ntNet API** | Identify a plant from a photo | Free up to 500 IDs/day, attribution required, one free account per person | Snap-to-identify |
| **Open-Meteo** | Weather forecast | Free, no key, CC BY 4.0 (attribution) | Weather-aware quests |
| ~~Perenual~~ | Care data | Free tier non-commercial, 100 req/day shared by all users, care guides paid | Dropped |
| ~~Trefle~~ | — | Shut down | Dropped |

## Architecture decisions

- **Local-first, no backend for MVP.** All data lives on the phone. Nothing to host, nothing that pauses or bills. (Supabase's free plan, for example, pauses projects after a week of inactivity and caps file storage at 1 GB — too small for daily photos from many users.)
- **Expo (React Native) + TypeScript.**
  - `expo-sqlite` for plants, photos metadata, quests, XP, badges.
  - `expo-camera` + `expo-image-manipulator` to capture and compress (~1080px JPEG).
  - `expo-file-system` to store photos in the app's own folder; optional "also save to Gallery".
  - `expo-notifications` **local** scheduled notifications.
  - `expo-location` (coarse) or manual city pick for weather.
- **Care data shipped inside the app** as versioned JSON. Updating it means an app update — free and simple.
- **Quest engine runs on the device.** On first open each day, the app generates that day's quests from care profiles, last-care dates, and the cached forecast.
- **Game state is local.** XP and streaks could be cheated, but with no leaderboards that's harmless.
- **Builds:** local builds (free, unlimited) or EAS Build Free plan (up to 15 Android builds/month, low-priority queue).
- **Android first.** iOS needs Apple's $99/year developer membership.

## Distribution cost (the one thing that isn't ₱0)

- **Sideloaded APK for testers:** ₱0.
- **Google Play:** one-time US$25 registration, no annual renewal. New personal accounts must run a closed test with at least 12 testers for 14 continuous days before going to production.
- **App Store:** $99/year — skipped for now.

## Core data model (on-device SQLite)

- `profile` — display name, plantito/plantita, xp, level, city/lat-lon, reminder time
- `species` — bundled + cached GBIF results: id, scientific name, common names (EN/Tagalog), image, attribution
- `care_profiles` — bundled: species_id, water every N days, light, humidity, fertilize every N days, toxic to pets, tips
- `user_plants` — nickname, species_id (nullable), indoor/outdoor, acquired date, last watered, last fertilized
- `progress_photos` — user_plant_id, date, local file path, note
- `quest_templates` — bundled: type, conditions, XP reward, Taglish copy
- `daily_quests` — date, user_plant_id, template, status
- `badges`, `streak`

## Dependency graph

```
Spikes (APIs, camera + local storage)
   │
Scaffold + local DB + onboarding
   │
user_plants (manual add) ─────────────┐
   │                                  │
Catalog (bundled + GBIF)              Daily photo ── Timeline ── Ghost overlay ── Before/after
   │                                  │
Add from catalog                      │
   │                                  │
Quest engine (on device) ─────────────┘
   │
Complete quest → XP / streaks → badges / titles
   │
Local reminders · Weather quests · Snap-to-identify · Plant moods · Backup
```

## Task list

### Phase 0: Spikes (fail fast)
- [ ] Task 0.1: Free API spike
- [ ] Task 0.2: Camera and local photo storage spike

### Checkpoint 0
- [ ] GBIF/Pl@ntNet/Open-Meteo confirmed usable at ₱0
- [ ] Capture → compress → save → display works offline on a real Android phone
- [ ] Human review of stack

### Phase 1: Foundation
- [ ] Task 1: Scaffold, local database, onboarding
- [ ] Task 2: Add a plant manually and see "My Garden"

### Checkpoint 1
- [ ] Builds clean, tests pass, data survives app restart

### Phase 2: Core features
- [ ] Task 3: Catalog search (bundled + GBIF)
- [ ] Task 4: Plant detail and add from catalog
- [ ] Task 5: Daily progress photo
- [ ] Task 6: Photo timeline per plant
- [ ] Task 7: On-device quest engine
- [ ] Task 8: Complete a quest (Today screen)

### Checkpoint 2
- [ ] End-to-end offline: add plant → get quests → take photo → complete quest
- [ ] Human review before game layer

### Phase 3: Fun layer
- [ ] Task 9: XP, levels, Filipino titles
- [ ] Task 10: Dilig streaks
- [ ] Task 11: Badges
- [ ] Task 12: Ghost overlay camera
- [ ] Task 13: Local care reminders

### Checkpoint 3 (MVP)
- [ ] All MVP criteria met on 2+ Android phones
- [ ] APK shared with testers

### Phase 4: Post-MVP (still ₱0)
- [ ] Task 14: Weather-aware quests
- [ ] Task 15: Snap-to-identify
- [ ] Task 16: Before–after slider and growth slideshow
- [ ] Task 17: Plant moods
- [ ] Task 18: Backup and restore

---

## Task details

### Task 0.1: Free API spike
**Description:** From a throwaway script, hit GBIF species search, Pl@ntNet identify (free key), and Open-Meteo. Check GBIF coverage and Tagalog vernacular names for 20 common PH plants, response sizes, and attribution requirements.
**Acceptance criteria:**
- [ ] Coverage table for 20 PH plants
- [ ] Attribution text list for Pl@ntNet, Open-Meteo, Wikimedia images
**Verification:** Review `docs/api-spike.md`
**Dependencies:** None
**Files:** `scripts/api-spike.ts`, `docs/api-spike.md`
**Scope:** S

### Task 0.2: Camera and local photo storage spike
**Description:** Minimal Expo screen: capture, compress, save to app folder, list and display. Measure file size and storage after 100 photos.
**Acceptance criteria:**
- [ ] Each photo ≤ 300 KB
- [ ] Works in airplane mode
**Verification:** Manual on a physical Android phone
**Dependencies:** None
**Files:** `spikes/camera/*`
**Scope:** S

### Task 1: Scaffold, local database, onboarding
**Description:** Expo + TypeScript + Expo Router, `expo-sqlite` with a migration runner, onboarding screens (name, Plantito or Plantita, city).
**Acceptance criteria:**
- [ ] Migrations run on first launch and on upgrade
- [ ] Onboarding shown once; profile saved locally
**Verification:** `npm test` (migration tests); manual fresh install
**Dependencies:** Checkpoint 0
**Files:** `app/_layout.tsx`, `app/onboarding/*`, `db/migrations/*`, `db/client.ts`
**Scope:** M

### Task 2: Add a plant manually and see "My Garden"
**Description:** `user_plants` table + form (nickname, indoor/outdoor, acquired date, cover photo) + My Garden grid. Edit and delete.
**Acceptance criteria:**
- [ ] Plant persists after restart; deleting removes its photos from disk
**Verification:** Unit test for form validation and delete cleanup; manual
**Dependencies:** Task 1
**Files:** `db/migrations/002_user_plants.ts`, `app/garden/*`, `components/PlantCard.tsx`
**Scope:** M

### Task 3: Catalog search (bundled + GBIF)
**Description:** Bundle `species.json` and `care_profiles.json` for ~50 PH plants. Search the bundled list first (works offline); when online, also query GBIF and cache results.
**Acceptance criteria:**
- [ ] "monstera" and "malunggay" return bundled results offline
- [ ] GBIF results marked "No care guide yet"
**Verification:** Unit tests for search merge; manual offline/online
**Dependencies:** Task 1, Task 0.1
**Files:** `data/species.json`, `data/care_profiles.json`, `lib/gbif.ts`, `app/catalog/*`
**Scope:** M

### Task 4: Plant detail and add from catalog
**Description:** Detail screen (names, light, water, toxicity, tips, image credit) with "Add to My Garden" pre-filling Task 2's form.
**Acceptance criteria:**
- [ ] Added plant linked to species and care profile
**Verification:** Manual; DB check
**Dependencies:** Tasks 2, 3
**Files:** `app/catalog/[id].tsx`, `app/garden/new.tsx`
**Scope:** S

### Task 5: Daily progress photo
**Description:** From a plant's page, capture, compress, add note, save locally. One official photo per plant per day (retake replaces). Optional "Save a copy to Gallery" setting.
**Acceptance criteria:**
- [ ] Date bucketed by Asia/Manila local day
- [ ] Replaced photo's old file deleted
**Verification:** Unit test for date bucketing; manual
**Dependencies:** Task 2, Task 0.2
**Files:** `app/plant/[id]/camera.tsx`, `lib/photos.ts`
**Scope:** M

### Task 6: Photo timeline per plant
**Description:** Timeline with "Day N" labels and notes; full-screen swipe viewer.
**Acceptance criteria:**
- [ ] Smooth scrolling with 100+ photos (thumbnails generated on save)
**Verification:** Manual with seeded photos
**Dependencies:** Task 5
**Files:** `app/plant/[id]/timeline.tsx`, `components/PhotoViewer.tsx`
**Scope:** S

### Task 7: On-device quest engine
**Description:** Pure-function rule engine: (care profile, last care dates, today, forecast?) → quests. Runs on first app open each day; idempotent. Plants without a care profile get generic quests. Max 3 quests per plant per day.
**Acceptance criteria:**
- [ ] Water quest only when due
- [ ] Re-opening the app the same day doesn't duplicate quests
**Verification:** Unit tests with fixed dates
**Dependencies:** Tasks 4, 5
**Files:** `lib/quests/engine.ts`, `data/quest_templates.json`, `db/migrations/003_quests.ts`
**Scope:** M

### Task 8: Complete a quest (Today screen)
**Description:** Today tab lists quests by plant. Tap to complete, or "skip" with no penalty. Photo quests open the camera and complete on save. Water/fertilize quests update last-care dates.
**Acceptance criteria:**
- [ ] Completion reflected in next day's quests
**Verification:** Integration test on engine + DB; manual
**Dependencies:** Task 7
**Files:** `app/(tabs)/today.tsx`, `lib/quests/complete.ts`
**Scope:** M

### Task 9: XP, levels, Filipino titles
**Description:** XP per quest; level thresholds map to titles; level-up animation.
**Acceptance criteria:**
- [ ] Title changes exactly at thresholds
**Verification:** Unit tests; manual animation
**Dependencies:** Task 8
**Files:** `lib/game/xp.ts`, `components/LevelUpModal.tsx`
**Scope:** S

### Task 10: Dilig streaks
**Description:** Streak = days with ≥1 quest done; one freeze per week.
**Acceptance criteria:**
- [ ] Correct across midnight and after skipping days
**Verification:** Unit tests with date fixtures
**Dependencies:** Task 8
**Files:** `lib/game/streak.ts`, `components/StreakFlame.tsx`
**Scope:** S

### Task 11: Badges
**Description:** Rules evaluated after quest completion and photo save; badge shelf on profile.
**Acceptance criteria:**
- [ ] Each badge awarded once
**Verification:** Unit test per rule
**Dependencies:** Tasks 9, 10
**Files:** `lib/game/badges.ts`, `data/badges.json`, `app/profile/badges.tsx`
**Scope:** M

### Task 12: Ghost overlay camera
**Description:** Previous photo at ~30% opacity over the viewfinder; toggle.
**Acceptance criteria:**
- [ ] Same aspect ratio; toggle remembered
**Verification:** Manual
**Dependencies:** Task 5
**Files:** `app/plant/[id]/camera.tsx`
**Scope:** S

### Task 13: Local care reminders
**Description:** Daily local notification at the user's chosen time with today's quest count; deep-links to Today. Rescheduled when settings change.
**Acceptance criteria:**
- [ ] Fires with app closed; can be turned off
**Verification:** Manual with a near-future test time
**Dependencies:** Task 7
**Files:** `lib/notifications.ts`, `app/settings.tsx`
**Scope:** S

### Task 14: Weather-aware quests
**Description:** Fetch Open-Meteo forecast once a day (cached). Engine rules: rain → skip watering outdoor plants; strong wind → bring pots in; heat → water early. Show Open-Meteo attribution.
**Acceptance criteria:**
- [ ] Indoor plants unaffected; offline falls back to normal quests
**Verification:** Engine unit tests with mocked forecasts
**Dependencies:** Task 7
**Files:** `lib/weather.ts`, `lib/quests/rules/weather.ts`
**Scope:** M

### Task 15: Snap-to-identify
**Description:** Camera → Pl@ntNet → top 3 matches → link to bundled species or GBIF → "Add to My Garden". Per-device daily cap (e.g. 5/day) to protect the shared 500/day quota. Required Pl@ntNet attribution shown.
**Acceptance criteria:**
- [ ] Graceful message when quota or network is unavailable
**Verification:** Manual with 10 known plants; unit test for cap
**Dependencies:** Tasks 3, 4
**Files:** `lib/plantnet.ts`, `app/identify.tsx`
**Scope:** M

### Task 16: Before–after slider and growth slideshow
**Description:** Drag slider comparing Day 1 and latest photo; auto-play slideshow of all photos. Share a side-by-side image via the share sheet.
**Acceptance criteria:**
- [ ] Shared image includes plant name and "Day 1 → Day N"
**Verification:** Manual
**Dependencies:** Task 6
**Files:** `app/plant/[id]/glowup.tsx`, `components/BeforeAfter.tsx`
**Scope:** S

### Task 17: Plant moods
**Description:** Avatar state (happy / thirsty / neglected) from overdue quests.
**Acceptance criteria:**
- [ ] Updates immediately after completing a quest
**Verification:** Unit tests
**Dependencies:** Task 8
**Files:** `lib/plantMood.ts`, `components/PlantAvatar.tsx`
**Scope:** S

### Task 18: Backup and restore
**Description:** Export DB + photos as one `.zip` via the share sheet (to Google Drive, Files, etc.); import restores it on a new phone.
**Acceptance criteria:**
- [ ] Round-trip export → fresh install → import restores everything
**Verification:** Manual on two devices
**Dependencies:** Tasks 5, 11
**Files:** `lib/backup.ts`, `app/settings/backup.tsx`
**Scope:** M

## Parallelization

- After Checkpoint 1: catalog (Tasks 3–4) and photos (Tasks 5–6) can run in parallel.
- After Task 8: Tasks 9–10, 12, 13 are independent.
- Writing `care_profiles.json` and Taglish quest copy can start on day one.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Phone lost or app uninstalled → photos gone | High | "Save a copy to Gallery" option (Task 5), backup/restore (Task 18), clear warning in onboarding |
| Wrong care advice | Med | Source each care profile; "tips, not guarantees"; user can edit watering interval per plant |
| Pl@ntNet key is inside the app and can be extracted | Low (worst case: quota used up, still ₱0) | Per-device cap; move behind a free proxy later if abused |
| Pl@ntNet 500/day shared by all users | Med once popular | Per-device cap; feature is optional |
| Phone storage fills up | Low | Compress to ~1080px, one photo per plant per day, show storage used |
| Quests feel like chores | Med | Max 3/plant/day, skip with no penalty, streak freeze |
| Image licensing for bundled plant photos | Low | Wikimedia Commons only, store and show attribution |

## Open questions

1. Share as APK to testers first, or pay the one-time US$25 for Google Play?
2. English, Tagalog, or Taglish as the default UI language?
3. Is cloud sync across phones needed later? That's the point where a free-tier backend (with its limits) would come in.
