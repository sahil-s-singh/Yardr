# Yardr

A mobile-first, AI-powered **garage sale discovery app** for neighborhoods — built with React Native + Expo on the frontend, Supabase on the backend, and Claude on the AI side. Designed and tested in Saskatchewan, Canada; aimed at a hyper-local launch in Saskatoon first.

> Point your camera at a pile of items, record a 5-second clip, and Yardr turns it into a complete listing (title, description, categories). Buyers browse a distance-sorted map/list, save favorites, set reminders, and get push notifications when a new sale matches something on their wishlist.

---

## 1. Tech Stack

| Layer | Tech |
|---|---|
| App framework | React Native `0.81.5`, React `19.1.0`, Expo SDK `~54`, Expo Router `~6` |
| Language | TypeScript `~5.9` |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions — Deno) |
| AI | Claude API (`claude-3-haiku-20240307`) via Supabase Edge Functions |
| Maps | `react-native-maps` (Google provider) + `react-native-google-places-autocomplete` |
| Media | `expo-camera`, `expo-video`, `expo-video-thumbnails`, `expo-image-manipulator` |
| Notifications | `expo-notifications` + Expo Push API |
| Storage | `@react-native-async-storage/async-storage` |
| Animations | `react-native-reanimated` `~4.1` + `react-native-worklets` |
| Testing | Jest + `jest-expo` (51 tests across 6 suites) |
| Build/Deploy | EAS + Expo Application Services |

New React Native architecture is enabled (`newArchEnabled: true`) and the React Compiler experiment is on.

---

## 2. Core Features

### 2.1 AI Video Analysis
Record a short video of sale items → Yardr extracts frames via `expo-video-thumbnails`, base64-encodes them, and sends them to the `analyze-video` edge function. The function calls Claude with the images and returns `{ title, description, categories }`, which auto-fills the listing form.

- Entry points: [app/add-garage-sale.tsx](app/add-garage-sale.tsx), [app/add-video/[id].tsx](app/add-video/[id].tsx)
- Camera UI: [components/VideoRecorder.tsx](components/VideoRecorder.tsx) — countdown uses `setInterval`, guarded by `onCameraReady`, and deliberately avoids the `expo-video` player (it caused a freeze during recording)
- Client wrapper: [lib/claude.ts](lib/claude.ts) → `analyzeGarageSaleVideo()`
- Edge function: [supabase/functions/analyze-video/index.ts](supabase/functions/analyze-video/index.ts)

### 2.2 Wishlist Matching (3-phase hybrid)
Buyers add items they're looking for. Whenever a new sale is published (or an existing sale is edited), Yardr runs a cascading match:

1. **Keyword match** — cheap string overlap
2. **Category match** — overlap between sale categories and the wishlist item's category
3. **Claude semantic verify** — `match-wishlist` edge function confirms via Claude, returning `{ isMatch, reason }`

Matches are rate-limited (batches of 5, 200ms delay) and written to `wishlist_matches`. Re-checks also run on sale edit via `recheckSaleAgainstWishlists()`.

- Matcher: [lib/wishlistMatcher.ts](lib/wishlistMatcher.ts)
- Service: [services/wishlistService.ts](services/wishlistService.ts)
- Re-check on edit: [services/matchUpdateService.ts](services/matchUpdateService.ts) → wired into [app/edit-sale/[id].tsx](app/edit-sale/[id].tsx)
- Edge function: [supabase/functions/match-wishlist/index.ts](supabase/functions/match-wishlist/index.ts)

### 2.3 Push Notifications & Reminders
- Wishlist-match notifications go out via Expo Push with 3x exponential retry and invalid-token cleanup.
- Reminders are stored server-side and delivered locally via `expo-notifications`. Each reminder saves its `local_notification_id` so it can be cancelled on delete.
- The `send-reminders` edge function queries due reminders and fires via Expo Push; it's deployed but needs a Supabase cron schedule to run automatically.
- Push tokens are cleared on logout inside [contexts/AuthContext.tsx](contexts/AuthContext.tsx).
- Deep linking handles all notification types using `garageSaleId`.

Files: [lib/wishlistNotifications.ts](lib/wishlistNotifications.ts), [lib/notifications.ts](lib/notifications.ts), [services/remindersService.ts](services/remindersService.ts), [supabase/functions/send-reminders/index.ts](supabase/functions/send-reminders/index.ts).

### 2.4 Discover Feed (List + Map)
One screen component powers both tabs: [components/screens/DiscoverScreen.tsx](components/screens/DiscoverScreen.tsx), used by [app/(tabs)/index.tsx](app/(tabs)/index.tsx) and [app/(tabs)/map.tsx](app/(tabs)/map.tsx).

- Custom radius slider (1–160 km, default 25 km) — [components/ui/RadiusSlider.tsx](components/ui/RadiusSlider.tsx) — uses `setNativeProps` for zero-lag drag (no React re-renders during drag), with a 400ms debounce before the API refetch.
- Map animates zoom to match radius on change.
- Sales are filtered to `end_date >= today` and sorted by haversine distance (closest first). The "show all sales globally" fallback was deliberately removed.

### 2.5 Garage Sale CRUD
Create, edit, delete sales with geolocation, video upload, categories, multi-day dates, and contact info. Types in [types/garageSale.ts](types/garageSale.ts).

- Create: [app/add-garage-sale.tsx](app/add-garage-sale.tsx)
- Edit: [app/edit-sale/[id].tsx](app/edit-sale/[id].tsx) (triggers wishlist re-check)
- Detail: [app/sale-detail/[id].tsx](app/sale-detail/[id].tsx)
- My sales: [app/my-sales.tsx](app/my-sales.tsx)
- Service: [services/garageSaleService.ts](services/garageSaleService.ts)

### 2.6 Auth
Email/password via Supabase Auth. Sign-in, sign-up, and a forgot-password flow that calls `authService.resetPassword`.

- [app/auth/sign-in.tsx](app/auth/sign-in.tsx), [app/auth/sign-up.tsx](app/auth/sign-up.tsx)
- [services/authService.ts](services/authService.ts), [contexts/AuthContext.tsx](contexts/AuthContext.tsx)

### 2.7 Favorites, Reminders, History
- [services/favoritesService.ts](services/favoritesService.ts) — favorite/unfavorite + count
- [services/remindersService.ts](services/remindersService.ts) — set/remove, stores local notification id
- [services/historyService.ts](services/historyService.ts) — view history
- Profile stats (Saved, Reminders) pull real counts, not placeholders.

---

## 3. Project Structure

```
Yardr_s/
├── app/                         # Expo Router routes
│   ├── (tabs)/                  # Tab bar: index (discover), map, search, profile
│   ├── auth/                    # sign-in, sign-up
│   ├── add-garage-sale.tsx
│   ├── add-video/[id].tsx
│   ├── add-wishlist-item.tsx
│   ├── edit-sale/[id].tsx
│   ├── sale-detail/[id].tsx
│   ├── wishlist-matches/[id].tsx
│   ├── wishlists.tsx
│   ├── my-sales.tsx
│   ├── api/                     # API routes (test-notification)
│   ├── test-notification.tsx
│   └── test-video.tsx
├── components/
│   ├── VideoRecorder.tsx
│   ├── FavoriteButton.tsx
│   ├── ReminderButton.tsx
│   ├── SplashLoader.tsx
│   ├── profile/                 # ProfileAuthSheet, ProfileMenuSheet, ProfileSignupSheet
│   ├── screens/DiscoverScreen.tsx
│   └── ui/                      # HeaderBar, RadiusSlider, SaleCard, StoriesBar, StoryViewer, CustomTabBar, …
├── services/                    # Business logic (see §4)
├── lib/                         # Utilities, Claude + Supabase clients, matcher, notifications
├── supabase/functions/          # Edge functions: analyze-video, match-wishlist, send-reminders
├── database/migrations/         # SQL migrations and RLS policy fixes
├── contexts/AuthContext.tsx
├── constants/                   # config.ts, theme.ts
├── types/                       # garageSale.ts, user.ts
├── hooks/
├── __tests__/                   # Jest suites + mocks
├── docs/                        # Setup and feature docs (see §9)
├── assets/                      # Icons, splash, images
├── app.json                     # Static Expo config (no secrets)
├── app.config.ts                # Dynamic Expo config, reads env vars
├── eas.json
├── jest.config.js
└── tsconfig.json
```

---

## 4. Services & Lib (Where the Logic Lives)

### Services
| File | Responsibility |
|---|---|
| [services/garageSaleService.ts](services/garageSaleService.ts) | CRUD for sales, nearby query with `end_date >= today` filter |
| [services/wishlistService.ts](services/wishlistService.ts) | Wishlist CRUD, rate-limited matching loops, pagination (default 50) |
| [services/matchUpdateService.ts](services/matchUpdateService.ts) | `recheckSaleAgainstWishlists()` on sale edit |
| [services/remindersService.ts](services/remindersService.ts) | Set/remove reminders, stores `local_notification_id` |
| [services/videoService.ts](services/videoService.ts) | Upload/delete video to Supabase Storage |
| [services/authService.ts](services/authService.ts) | Sign in/up/out, resetPassword, getUserProfile |
| [services/rateLimitService.ts](services/rateLimitService.ts) | Client-side 5 sales/day (AsyncStorage) |
| [services/favoritesService.ts](services/favoritesService.ts) | Favorite/unfavorite + counts |
| [services/historyService.ts](services/historyService.ts) | View history |

### Lib
| File | Responsibility |
|---|---|
| [lib/claude.ts](lib/claude.ts) | `analyzeGarageSaleVideo()`, `analyzeWishlistMatch()` — invoke edge functions |
| [lib/wishlistMatcher.ts](lib/wishlistMatcher.ts) | 3-phase keyword → category → AI pipeline |
| [lib/wishlistNotifications.ts](lib/wishlistNotifications.ts) | Expo Push send with retry + bad-token cleanup |
| [lib/notifications.ts](lib/notifications.ts) | Notification init, foreground handler, Android channel |
| [lib/notificationCopy.ts](lib/notificationCopy.ts) | Notification title/body templates |
| [lib/supabase.ts](lib/supabase.ts) | Supabase client (env-based) |
| [lib/mappers.ts](lib/mappers.ts) | `mapGarageSaleRow()` — DB row → app model |
| [lib/locationUtils.ts](lib/locationUtils.ts) | Location helpers (haversine, formatting) |
| [lib/dateUtils.ts](lib/dateUtils.ts) | Date helpers |
| [lib/validation.ts](lib/validation.ts) | Form validation |
| [lib/draftSale.ts](lib/draftSale.ts) | Draft persistence for in-progress sales |
| [lib/alerts.ts](lib/alerts.ts) | Alert helpers |

---

## 5. Data Flow (Happy Path)

1. User records a video → `VideoRecorder` → `add-garage-sale.tsx`.
2. Frames extracted via `expo-video-thumbnails` → base64 → `supabase.functions.invoke('analyze-video')`.
3. Edge function calls Claude API → returns `{ title, description, categories }` → form auto-fills.
4. Sale created in Postgres → `checkNewSaleAgainstWishlists()` runs in the background.
5. For each active wishlist item: keyword match → category match → Claude semantic verify.
6. Match found → insert into `wishlist_matches` → send Expo Push with retry.
7. Recipient taps notification → deep link opens `sale-detail/[id]`.

---

## 6. Backend: Supabase

Project ref, URL, and dashboard links are stored in `.env.local` and the Supabase dashboard — not checked into the repo.

### Edge Functions
| Function | Purpose |
|---|---|
| `analyze-video` | Takes base64 images → Claude → `{ title, description, categories }` |
| `match-wishlist` | Takes wishlist + sale → Claude → `{ isMatch, reason }` |
| `send-reminders` | Cron-driven: queries due reminders, fires via Expo Push |

**Deploying:**
```bash
supabase login
supabase link --project-ref <SUPABASE_PROJECT_REF>
supabase functions deploy analyze-video
supabase functions deploy match-wishlist
supabase functions deploy send-reminders
```

**Testing `analyze-video`:**
```bash
curl -X POST "<SUPABASE_URL>/functions/v1/analyze-video" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"base64Images":["<base64>"]}'
```

### Claude API
- Secret: `CLAUDE_API_KEY` — stored in Supabase secrets, never in the repo or client bundle
- Model in use: **`claude-3-haiku-20240307`**
- API version header: `anthropic-version: 2023-06-01`

### Database
Tables (implied by services and migrations): `garage_sales`, `wishlists`, `wishlist_matches`, `user_reminders`, `user_profiles`, `favorites`, `history`.

Migrations live in [database/migrations/](database/migrations/) and include RLS policy fixes plus:
- [add-local-notification-id.sql](database/migrations/add-local-notification-id.sql) — adds `local_notification_id` column to `user_reminders` (⚠️ needs to run before production)
- [add-push-token-to-profiles.sql](database/migrations/add-push-token-to-profiles.sql)
- Several `fix-*-policy.sql` files tightening RLS for `wishlist_matches`, `user_profiles`, etc.

---

## 7. Environment & Config

### `.env.local` (keys only — values live locally, never committed)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_PROJECT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Server-side secrets (set via `supabase secrets set`, not in `.env.local`):
- `CLAUDE_API_KEY`

### Expo config
- [app.json](app.json) — static config, no secrets. Plugins: `expo-router`, `expo-splash-screen`, `expo-video`, `expo-notifications`, `expo-camera` (with permission copy).
- [app.config.ts](app.config.ts) — dynamic config, injects `GOOGLE_MAPS_API_KEY` from env at build time.
- Android adaptive icon configured. Edge-to-edge enabled.

---

## 8. Testing

Jest + `jest-expo` preset. `npm test` / `npm run test:coverage`.

Suites in [__tests__/](__tests__/):
- `wishlistMatcher.test.ts`
- `wishlistService.test.ts`
- `wishlistNotifications.test.ts`
- `claude.test.ts`
- `remindersService.test.ts`
- `rateLimiting.test.ts`

Mocks under [__tests__/mocks/](__tests__/mocks/); shared setup in `__tests__/setup.ts`.

---

## 9. Docs in `/docs`

| File | Covers |
|---|---|
| [docs/README.md](docs/README.md) | Project intro |
| [docs/CLAUDE_VIDEO_SETUP.md](docs/CLAUDE_VIDEO_SETUP.md) | Video AI setup |
| [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) | Supabase bootstrap |
| [docs/GOOGLE_MAPS_SETUP.md](docs/GOOGLE_MAPS_SETUP.md) | Google Maps keys |
| [docs/FREE_ADDRESS_SOLUTION.md](docs/FREE_ADDRESS_SOLUTION.md) | Address autocomplete strategy |
| [docs/RATE_LIMITING.md](docs/RATE_LIMITING.md) | Rate limit design |
| [docs/MIGRATION_INSTRUCTIONS.md](docs/MIGRATION_INSTRUCTIONS.md) | Running SQL migrations |
| [docs/RUN_THIS_SQL.md](docs/RUN_THIS_SQL.md) | Immediate SQL to apply |
| [docs/VIDEO_FEATURE_STATUS.md](docs/VIDEO_FEATURE_STATUS.md) | Video feature state |
| [docs/VIDEO_TESTING_GUIDE.md](docs/VIDEO_TESTING_GUIDE.md) | Manual video QA steps |
| [docs/IMPLEMENTATION_COMPLETE.md](docs/IMPLEMENTATION_COMPLETE.md) | Historical completion notes |
| [LAUNCH_STRATEGY.md](LAUNCH_STRATEGY.md) | Go-to-market plan (Saskatoon → Prairies → US) |

---

## 10. Getting Started

```bash
# 1. Install deps
npm install

# 2. Set env vars
cp .env.local.example .env.local   # then fill in values

# 3. Run the app (dev client, not Expo Go)
npm run ios        # iOS dev client
npm run android    # Android dev client
npm run start      # dev client server

# 4. Tests
npm test
npm run test:coverage
```

Yardr uses a **dev client** (`expo-dev-client`), not Expo Go — native modules like `expo-camera` and `react-native-maps` require it.

---

## 11. Git & Deploy

- Remote: private GitHub repo over SSH (repo-scoped key via `git config core.sshCommand`)
- Branches: `main` (base), `v2` (active development)
- Builds: EAS (project ID stored in `.env.local` / EAS config, not committed)

Push:
```bash
git push origin v2
```

---

## 12. Status

### Recently completed
- Video analysis works end-to-end from both `add-garage-sale` and `add-video/[id]`.
- `VideoRecorder` freeze fixed (removed `expo-video` player, countdown via `setInterval`, `onCameraReady` guard).
- Wishlist: category selector enabled, re-check on edit wired up, pagination added, matching loops rate-limited.
- Notifications: push token cleared on logout, 3x retry + invalid-token cleanup, `send-reminders` deployed, deep linking, reminder cancellation via stored `local_notification_id`.
- Security: Google Maps key moved out of `app.json` into env, test-notification endpoint gated behind auth + dev-only, hardcoded Supabase creds removed from test route.
- Discover: expired sales filtered, zero-lag radius slider (1–160 km), distance sort, debounced refetch, map zoom-to-radius.
- Profile stats pull real data.
- Jest suite: 51 tests across 6 suites, all passing.

### Must do before production
1. **Rotate any API keys that may have leaked** through git history or chat logs.
2. **Run migration** `add-local-notification-id.sql` on the Supabase DB.
3. **Set up `send-reminders` cron** — Supabase Dashboard → Database → Cron Jobs (every 1–2 min).
4. **Set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` in EAS secrets** — currently only in `.env.local`.
5. **Upgrade Claude model** if quality demands it.
6. **Real-device QA pass**: record video → post sale → add wishlist → receive match → tap → set reminder → delete.

### Should fix
- Client-side rate limiting is bypass-able — add a server-side check (RLS trigger).
- No crash/error monitoring (Sentry or similar).
- Search tab is a "Coming Soon" placeholder.
- No notification preferences UI.
- `match-wishlist` edge function has no length limits — prompt-injection risk.
- Wishlist matches never expire.

### Minor / post-launch
- Haversine distance is duplicated between `garageSaleService.ts` and `DiscoverScreen.tsx`.
- No global error boundary.
- `wishlistMatcher` uses `any` for the garage sale parameter — should use `GarageSale`.

---

## 13. Design Principles

- **Minimalist UI** — clean, uncluttered, elements combined where possible (e.g. radius slider inline with title).
- **Performance first** — native approaches over React state for animations. `setNativeProps` for drag interactions.
- **Kilometers, not miles** — the app is Canada-first.
- **End-to-end or not at all** — ship features fully working, not half-wired.
- **Keys stay server-side** — Claude API key lives in Supabase secrets; the client only invokes edge functions.
- **Real-device QA** — developed and tested on a real iOS device, not the simulator.

---

## 14. Launch Strategy (Summary)

Full plan in [LAUNCH_STRATEGY.md](LAUNCH_STRATEGY.md). The short version:

1. **Pre-launch** — TestFlight beta, waitlist landing page, Instagram/TikTok content, outreach to community centers and local Facebook groups.
2. **Soft launch (Saskatoon)** — seed 10–20 real listings, yard-sign QR codes at physical sales, referral program, pitch local media. Targets: 1,000 downloads and 100 active listings by week 8.
3. **Growth (months 3–6)** — expand to Regina, Calgary, Edmonton, Winnipeg. Add advanced search/filters, seller ratings, a route planner. Begin monetization tests (featured listings, promoted sales, pro seller sub).
4. **Scale (months 6–12)** — cross into US suburbs, optimize ASO for "yard sale", run "Garage Sale Weekend" events, raise if the data supports it.

**Key risk:** the classic marketplace chicken-and-egg — no buyers without listings, no listings without buyers. The mitigation is staying hyper-local and manually seeding Saskatoon until the loop is self-sustaining.
