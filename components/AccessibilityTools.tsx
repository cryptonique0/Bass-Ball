"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';

// Utility: WCAG contrast ratio
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) return null;
  const h = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = toLin(r), G = toLin(g), B = toLin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(fg: string, bg: string): number | null {
  const f = hexToRgb(fg); const b = hexToRgb(bg);
  if (!f || !b) return null;
  const L1 = relativeLuminance(f);
  const L2 = relativeLuminance(b);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Skip to content link
export function SkipToContent({ targetId = 'main' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: 'translateY(-200%)',
        background: '#000',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 6,
        zIndex: 10000,
      }}
      onFocus={(e) => { (e.currentTarget.style.transform = 'translateY(0)'); }}
      onBlur={(e) => { (e.currentTarget.style.transform = 'translateY(-200%)'); }}
    >
      Skip to content
    </a>
  );
}

// Live region announcer
export function LiveRegion({ politeness = 'polite' as 'polite' | 'assertive' }) {
  const [message, setMessage] = useState<string>('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, []);

  const announce = (text: string) => {
    setMessage(''); // clear first to force screen reader update
    timerRef.current = window.setTimeout(() => setMessage(text), 100);
  };

  (window as any).a11yAnnounce = announce; // simple global hook

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}
    >
      {message}
    </div>
  );
}

// Color contrast checker
export function ColorContrastChecker() {
  const [fg, setFg] = useState<string>('#000000');
  const [bg, setBg] = useState<string>('#ffffff');
  const ratio = useMemo(() => contrastRatio(fg, bg), [fg, bg]);

  const aaText = ratio != null && ratio >= 4.5 ? 'Pass' : 'Fail';
  const aaLarge = ratio != null && ratio >= 3 ? 'Pass' : 'Fail';
  const aaaText = ratio != null && ratio >= 7 ? 'Pass' : 'Fail';

  return (
    <div style={{ border: '1px solid #444', borderRadius: 12, padding: 12 }}>
      <h3>Color Contrast Checker</h3>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          Foreground
          <input type="text" value={fg} onChange={(e) => setFg(e.target.value)} placeholder="#000000" style={{ marginLeft: 8 }} />
        </label>
        <label>
          Background
          <input type="text" value={bg} onChange={(e) => setBg(e.target.value)} placeholder="#ffffff" style={{ marginLeft: 8 }} />
        </label>
        <div style={{ padding: 8, background: bg, color: fg, borderRadius: 6 }}>
          Sample Text
        </div>
      </div>
      <p>Contrast Ratio: {ratio ? ratio.toFixed(2) : 'Invalid colors'}</p>
      <ul>
        <li>WCAG AA Text (normal 4.5:1): {aaText}</li>
        <li>WCAG AA Large (3:1): {aaLarge}</li>
        <li>WCAG AAA Text (7:1): {aaaText}</li>
      </ul>
    </div>
  );
}

// Global toggles panel
export default function AccessibilityTools() {
  const [focusVisible, setFocusVisible] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-focus-visible', focusVisible);
    root.classList.toggle('a11y-reduced-motion', reducedMotion);
    root.classList.toggle('a11y-high-contrast', highContrast);
  }, [focusVisible, reducedMotion, highContrast]);

  // Inject minimal CSS helpers
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .a11y-focus-visible :focus-visible { outline: 3px solid #00aaff; outline-offset: 2px; }
      .a11y-reduced-motion * { animation: none !important; transition: none !important; }
      .a11y-high-contrast { --bg: #000; --fg: #fff; }
      .a11y-high-contrast body { background: var(--bg); color: var(--fg); }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <section aria-label="Accessibility tools" style={{ border: '1px solid #333', borderRadius: 12, padding: 12, display: 'grid', gap: 12 }}>
      <SkipToContent />
      <LiveRegion politeness="polite" />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <label><input type="checkbox" checked={focusVisible} onChange={(e) => setFocusVisible(e.target.checked)} /> Show focus outlines</label>
        <label><input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} /> Reduced motion</label>
        <label><input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} /> High contrast mode</label>
        <button onClick={() => (window as any).a11yAnnounce?.('Update applied successfully.')}>Announce update</button>
      </div>
      <ColorContrastChecker />
    </section>
  );
}
