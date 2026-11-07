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

## Deferred (needs a server)
- Cloud sync, Halamanan feed, Pa-ampon plant swap, leaderboards, 3D

## Ongoing
- [x] Care profiles for common PH plants (general guidance; review with an experienced grower)
- [ ] Plant photos for the catalog (Wikimedia Commons + attribution)
- [x] Quest copy in Taglish
