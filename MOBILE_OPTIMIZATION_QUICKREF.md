# Mobile Optimization Quick Reference

- PWA Hook: `hooks/usePWA.ts`
  - `state`: `{ isOnline, isInstalled, isInstallable, hasServiceWorker, cacheSize }`
  - `installApp()` → prompt install
  - `checkUpdates()` → returns boolean
  - `clearCache()` → clears all caches
  - `subscribeToPush(vapidKey)` → `PushSubscription`
  - `registerSyncTask(tag, data)` → background sync

- Service Worker: `public/sw.js`
  - Cache name: `bb-cache:v1.0.0`
  - Precaches: `/`, `/manifest.json`
  - Strategies: HTML→network-first, assets→cache-first
  - Excludes: `/api/*`, `/admin/*`

- Manifest: `public/manifest.json`
  - Icons: `icons/icon-192.png`, `icon-512.png`, `icon-1024.png`
  - Colors: `theme_color`, `background_color`
  - Display: `standalone`

- Gestures Hook: `hooks/useTouch.ts`
  - Bind to `ref`
  - Callbacks: `onTap`, `onLongPress`, `onSwipe(dir)`, `onPanStart/Move/End(dx,dy)`, `onPinchStart/Move/End(scale)`

- Mobile Utils: `lib/mobileUtils.ts`
  - `isMobile()`, `getPlatform()`, `getViewportSize()`
  - `getSafeAreaInsets()`, `getOrientation()`, `onOrientationChange(cb)`
  - `estimateFPS(ms)`
