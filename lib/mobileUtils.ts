/**
 * Mobile Utils - device detection, viewport helpers, orientation, safe areas
 */

export function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function getPlatform(): 'ios' | 'android' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'other';
}

export function getViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
}

export function onOrientationChange(callback: (orientation: 'portrait' | 'landscape') => void): () => void {
  const handler = () => {
    const o = getOrientation();
    callback(o);
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('orientationchange', handler);
    window.addEventListener('resize', handler);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('orientationchange', handler);
      window.removeEventListener('resize', handler);
    }
  };
}

export function getOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait';
  const { innerWidth: w, innerHeight: h } = window;
  return h >= w ? 'portrait' : 'landscape';
}

export function getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
  // Approximate via CSS env variables where supported
  if (typeof window === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;visibility:hidden;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
  document.body.appendChild(div);
  const style = window.getComputedStyle(div);
  const parse = (v: string) => parseFloat(v) || 0;
  const top = parse(style.paddingTop);
  const right = parse(style.paddingRight);
  const bottom = parse(style.paddingBottom);
  const left = parse(style.paddingLeft);
  document.body.removeChild(div);
  return { top, right, bottom, left };
}

export function estimateFPS(sampleMs: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frames = 0;
    let start = performance.now();

    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - start >= sampleMs) {
        const fps = (frames / (now - start)) * 1000;
        resolve(Math.round(fps));
      } else {
        requestAnimationFrame(loop);
      }
    };
    requestAnimationFrame(loop);
  });
}
