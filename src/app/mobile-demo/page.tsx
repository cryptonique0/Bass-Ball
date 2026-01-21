"use client";
import React, { useEffect, useRef, useState } from 'react';
import usePWA from '@/hooks/usePWA';
import useTouch from '@/hooks/useTouch';
import { isMobile, getPlatform, getViewportSize, getSafeAreaInsets, estimateFPS } from '@/lib/mobileUtils';

export default function MobileDemoPage() {
  const { state, installApp, checkUpdates, clearCache } = usePWA();
  const gestureRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string>('Try swiping, tapping, or pinching.');
  const [fps, setFps] = useState<number>(0);
  const [safeArea, setSafeArea] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [viewport, setViewport] = useState(getViewportSize());

  useTouch(gestureRef, { swipeThreshold: 40, panThreshold: 3 }, {
    onTap: () => setMessage('Tap detected'),
    onLongPress: () => setMessage('Long press detected'),
    onSwipe: (dir) => setMessage(`Swipe ${dir}`),
    onPanStart: () => setMessage('Pan start'),
    onPanMove: (dx, dy) => setMessage(`Pan: ${Math.round(dx)}, ${Math.round(dy)}`),
    onPanEnd: (dx, dy) => setMessage(`Pan end: ${Math.round(dx)}, ${Math.round(dy)}`),
    onPinchStart: (scale) => setMessage(`Pinch start scale ${scale.toFixed(2)}`),
    onPinchMove: (scale) => setMessage(`Pinch scale ${scale.toFixed(2)}`),
    onPinchEnd: () => setMessage('Pinch end'),
  });

  useEffect(() => {
    estimateFPS(1000).then(setFps);
    setSafeArea(getSafeAreaInsets());
    const onResize = () => setViewport(getViewportSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Mobile Demo</h1>
      <p>Platform: {getPlatform()} • Mobile: {String(isMobile())}</p>
      <p>Viewport: {viewport.width} × {viewport.height}</p>
      <p>Safe area: t{safeArea.top} r{safeArea.right} b{safeArea.bottom} l{safeArea.left}</p>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #333', borderRadius: 12 }}>
        <h2>Gestures</h2>
        <div ref={gestureRef} style={{
          height: 240,
          border: '1px dashed #666',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          touchAction: 'none'
        }}>
          {message}
        </div>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #333', borderRadius: 12 }}>
        <h2>PWA</h2>
        <p>Online: {String(state.isOnline)} • Installed: {String(state.isInstalled)} • Installable: {String(state.isInstallable)}</p>
        <p>Cache size: {Math.round(state.cacheSize / 1024)} KB</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => installApp()} disabled={!state.isInstallable}>Install App</button>
          <button onClick={() => checkUpdates()}>Check Updates</button>
          <button onClick={() => clearCache()}>Clear Cache</button>
        </div>
      </section>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #333', borderRadius: 12 }}>
        <h2>Performance</h2>
        <p>Estimated FPS: {fps}</p>
      </section>
    </div>
  );
}
