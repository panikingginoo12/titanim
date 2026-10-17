# Titanim

Para sa mga Plantito at Plantita. A plant-care app with daily progress photos, care quests, XP, streaks and badges.

Everything runs on the phone: no backend, no paid APIs, ₱0 running cost.

## Features

- **My Garden**: add plants with a nickname, indoor/outdoor, and your own watering interval. Each plant shows a mood (Masaya, Nauuhaw, Nalulungkot).
- **Catalog**: 56 common Philippine plants with care guides (searchable by English, Tagalog or scientific name), plus online search through [GBIF](https://www.gbif.org).
- **Daily photos**: one progress photo per plant per day with a ghost overlay of the last photo, notes and milestones (new leaf, flower, fruit), and a "Day N" timeline.
- **Daily quests**: water, photo, fertilize, inspect leaves, rotate, mist — generated on the phone from each plant's care guide and history.
- **Game layer**: XP and levels (Baguhan → Plantito/Plantita → Tito/Tita ng Halaman → Hari/Reyna ng Halamanan), Dilig streaks with a weekly streak freeze, and badges.
- **Daily reminder**: a local notification scheduled by the phone itself.

## Run it

Requires Node.js 20 or newer.

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go on an Android phone (Expo Go must support SDK 58), or press `a` for an Android emulator.

## Build an APK for testers

```sh
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

The free EAS plan allows a limited number of low-priority builds per month. You can also build locally with `npx expo run:android` if Android Studio is installed.

## Checks

```sh
npm run typecheck
npm test
npm run lint
```

## Project layout

```
src/
  app/          Screens (Expo Router)
  components/   Shared UI
  data/         Bundled plant care data
  db/           SQLite schema and queries
  lib/          Quest engine, game rules, photos, notifications
tasks/          Plan and to-do list
```

Pure logic (quest engine, streaks, XP, badges, search, dates) has unit tests next to the code.

## Notes

- Photos and data live only on the phone. Turn on **Save a copy to Gallery** in Profile to keep photos if the app is uninstalled.
- Care guides are general guidance, not guarantees.
