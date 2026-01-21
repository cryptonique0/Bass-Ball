# Mobile Optimization Guide

This guide covers Phase 7 deliverables: PWA capabilities, touch gestures, and mobile utilities.

## Overview
- PWA: Offline caching, service worker, install prompt, push notifications.
- Gestures: Tap, long-press, swipe, pan, pinch.
- Mobile utils: Device/platform detection, viewport/safe-area helpers, orientation, FPS.

## PWA Setup
- Manifest: `public/manifest.json` (name, icons, colors, screenshots).
- Service Worker: `public/sw.js` (install, activate, fetch strategies, push, sync).
- PWA Service: `lib/pwaService.ts` registers SW, manages cache, background sync, notifications.
- Hook: `hooks/usePWA.ts` initializes service and exposes status/actions.

### Service Worker Strategies
- HTML: network-first for updates.
- CSS/JS/JSON: cache-first or stale-while-revalidate.
- Images/Fonts: cache-first.
- API/admin routes: bypass caching.

### Using `usePWA`
```tsx
const { state, installApp, checkUpdates, clearCache } = usePWA();
```
- `state`: `isOnline`, `isInstalled`, `isInstallable`, `hasServiceWorker`, `cacheSize`.
- `installApp()`: triggers install prompt (if available).
- `checkUpdates()`: polls SW for updates.
- `clearCache()`: clears all cache.
- `subscribeToPush(vapidKey)`, `registerSyncTask(tag, data)` available.

## Touch Gestures
- Library: `lib/touchGestures.ts` for tap, long-press, swipe, pan, pinch.
- Hook: `hooks/useTouch.ts` binds gestures to a `ref` and invokes callbacks.

### Example
```tsx
const boxRef = useRef<HTMLDivElement>(null);
useTouch(boxRef, { swipeThreshold: 40 }, {
  onSwipe: dir => console.log('swipe', dir),
  onTap: () => console.log('tap'),
});
```

## Mobile Utilities
- `lib/mobileUtils.ts`: `isMobile()`, `getPlatform()`, `getViewportSize()`, `getSafeAreaInsets()`, `getOrientation()`, `onOrientationChange()`, `estimateFPS()`.

## Demo Page
- `src/app/mobile-demo/page.tsx` demonstrates gestures, PWA, and performance.

## Troubleshooting
- Service Worker not registering: ensure served from root and HTTPS (or localhost) and file at `public/sw.js`.
- Icons missing: add files under `public/icons/` matching manifest sizes.
- Install prompt not appearing: Chrome shows it only when criteria met; use `usePWA.state.isInstallable`.
- Offline not working: check `fetch` handler, route exclusions, and cache names.

## Deployment Checklist
- Verify `manifest.json` is linked by Next.js (public directory auto-served).
- Test install on Android/Chrome; confirm offline cache works.
- Validate push permission flow; subscribe with VAPID key.
- Confirm gestures perform smoothly on mobile devices.
