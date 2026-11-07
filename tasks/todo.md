# Titanim — To-do (₱0 build)

## Phase 0: Spikes
- [x] 0.1 Free API spike — GBIF, Open-Meteo geocoding and Pl@ntNet response formats checked
- [ ] 0.2 Camera + local photo storage on a real phone (photo size, airplane mode)
- [x] **Checkpoint 0:** runs on a real Android phone (Expo Go)

## Phase 1: Foundation
- [x] 1 Scaffold (Expo SDK 58, Expo Router), local SQLite with migrations, onboarding
- [x] 2 Add / edit / delete a plant + My Garden
- [ ] **Checkpoint 1:** data survives restart (verify on device)

## Phase 2: Core
- [x] 3 Catalog search (56 bundled PH plants + GBIF online)
- [x] 4 Plant detail + add from catalog
- [x] 5 Daily progress photo (one per plant per day, retake replaces)
- [x] 6 Photo timeline + full-screen viewer
- [x] 7 On-device quest engine
- [x] 8 Today screen: complete / skip quests
- [ ] **Checkpoint 2:** full flow offline on device

## Phase 3: Fun layer
- [x] 9 XP, levels, Filipino titles
- [x] 10 Dilig streaks + weekly streak freeze
- [x] 11 Badges
- [x] 12 Ghost overlay camera
- [x] 13 Local daily reminder
- [ ] **Checkpoint 3 (MVP):** APK to testers

## Phase 4: Post-MVP (still ₱0)
- [x] 14 Weather-aware quests (Open-Meteo)
- [x] 15 Snap-to-identify (Pl@ntNet, 5 per phone per day; needs API key in .env.local)
- [x] 16 Before–after slider, growth slideshow, share card
- [x] 17 Plant moods
- [x] 18 Backup and restore (zip via share sheet; restore also on onboarding)

## Phase 4 checks on a phone
- [ ] Daily reminder fires (Expo Go uses the default notification channel)
- [ ] Weather card + rainy/windy quests with a real city
- [ ] Identify with a real Pl@ntNet key
- [ ] Backup to Drive, restore on a fresh install
- [ ] Glow-up share image

## Phase 5: Pa-ampon swap (plan: tasks/plan.md)

### 5.0 Spikes
- [ ] 5.0a Supabase + Google login in Expo Go — S
- [ ] 5.0b Nearby query with ~1 km grid + distance buckets — S
- [ ] **Checkpoint 5.0:** login works on phone, buckets only, human review of rules + open questions

### 5.1 Accounts and Binhi Box
- [ ] T1 Supabase project, client, migrations + RLS tests — M
- [ ] T2 Sign in with Google + profile (area, 18+, consent) — M
- [ ] T3 Binhi Box: my listings with photos — M
- [ ] T4 Offer from My Garden shortcut — S
- [ ] T5 Other user's profile + public listings — S
- [ ] **Checkpoint 5.1:** two accounts see each other's public listings; RLS tests pass

### 5.2 Malapit sa Akin
- [ ] T6 Location opt-in + server-snapped cell — S
- [ ] T7 Nearby feed (radius, kind, name filters) — M
- [ ] T8 Block and report — S
- [ ] **Checkpoint 5.2:** correct buckets, no coordinates in any response, blocks work both ways

### 5.3 Palitan
- [ ] T9 Trade request + inbox — M
- [ ] T10 Accept / decline / cancel + reservation — M
- [ ] T11 Trade chat + safety card — M
- [ ] T12 Mark done + thumbs-up + "Unang Palitan" badge — S
- [ ] **Checkpoint 5.3:** full swap on two phones; closed beta in one city

### 5.4 Before public launch
- [ ] T13 Account and data deletion (in app + web page) — M
- [ ] T14 Privacy policy, terms, safety tips, Play data-safety form — S
- [ ] T15 Moderation: watch list, auto-hide, review view — M
- [ ] T16 Push notifications (development build + Edge Function) — M

## Deferred (needs a server)
- Cloud sync, Halamanan feed, leaderboards, 3D

## Ongoing
- [x] Care profiles for common PH plants (general guidance; review with an experienced grower)
- [ ] Plant photos for the catalog (Wikimedia Commons + attribution)
- [x] Quest copy in Taglish
