/**
 * TouchGestures - Lightweight gesture recognition for mobile
 * Supports: tap, long-press, swipe, pan/drag, pinch (scale)
 */

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface GestureOptions {
  tapThreshold?: number; // ms
  longPressThreshold?: number; // ms
  swipeThreshold?: number; // px
  panThreshold?: number; // px
  multiTouch?: boolean;
}

export interface GestureCallbacks {
  onTap?: (e: PointerEvent) => void;
  onLongPress?: (e: PointerEvent) => void;
  onSwipe?: (dir: SwipeDirection, e: PointerEvent) => void;
  onPanStart?: (e: PointerEvent) => void;
  onPanMove?: (dx: number, dy: number, e: PointerEvent) => void;
  onPanEnd?: (dx: number, dy: number, e: PointerEvent) => void;
  onPinchStart?: (scale: number, e: PointerEvent) => void;
  onPinchMove?: (scale: number, e: PointerEvent) => void;
  onPinchEnd?: (scale: number, e: PointerEvent) => void;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

export class TouchGestures {
  private el: HTMLElement | null = null;
  private opts: Required<GestureOptions>;
  private cbs: GestureCallbacks;

  private startPoint: Point | null = null;
  private lastPoint: Point | null = null;
  private longPressTimer: number | null = null;
  private panActive = false;
  private pinchActive = false;
  private initialDistance = 0;

  constructor(options: GestureOptions = {}, callbacks: GestureCallbacks = {}) {
    this.opts = {
      tapThreshold: options.tapThreshold ?? 180,
      longPressThreshold: options.longPressThreshold ?? 500,
      swipeThreshold: options.swipeThreshold ?? 50,
      panThreshold: options.panThreshold ?? 3,
      multiTouch: options.multiTouch ?? true,
    };
    this.cbs = callbacks;
  }

  attach(el: HTMLElement): void {
    this.detach();
    this.el = el;
    el.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    el.addEventListener('pointermove', this.onPointerMove, { passive: true });
    el.addEventListener('pointerup', this.onPointerUp, { passive: true });
    el.addEventListener('pointercancel', this.onPointerCancel, { passive: true });
  }

  detach(): void {
    if (!this.el) return;
    this.el.removeEventListener('pointerdown', this.onPointerDown);
    this.el.removeEventListener('pointermove', this.onPointerMove);
    this.el.removeEventListener('pointerup', this.onPointerUp);
    this.el.removeEventListener('pointercancel', this.onPointerCancel);
    this.el = null;
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.el) return;
    this.el.setPointerCapture?.(e.pointerId);
    this.startPoint = { x: e.clientX, y: e.clientY, time: Date.now() };
    this.lastPoint = this.startPoint;
    this.panActive = false;
    this.pinchActive = false;

    // Long press init
    if (this.longPressTimer) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.longPressTimer = window.setTimeout(() => {
      this.longPressTimer = null;
      this.cbs.onLongPress?.(e);
    }, this.opts.longPressThreshold);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.startPoint) return;

    // Multi-touch pinch
    if (this.opts.multiTouch && e.pointerType === 'touch' && (e as any).getCoalescedEvents) {
      const touches = (e as any).getCoalescedEvents?.() || [];
      if (touches.length >= 2) {
        const t1 = touches[0];
        const t2 = touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        if (!this.pinchActive) {
          this.pinchActive = true;
          this.initialDistance = dist;
          this.cbs.onPinchStart?.(1, e);
        } else {
          const scale = dist / (this.initialDistance || dist);
          this.cbs.onPinchMove?.(scale, e);
        }
        return;
      }
    }

    const dx = e.clientX - this.startPoint.x;
    const dy = e.clientY - this.startPoint.y;
    const moved = Math.hypot(dx, dy);

    if (!this.panActive && moved > this.opts.panThreshold) {
      this.panActive = true;
      this.cbs.onPanStart?.(e);
    }
    if (this.panActive) {
      this.cbs.onPanMove?.(dx, dy, e);
    }

    this.lastPoint = { x: e.clientX, y: e.clientY, time: Date.now() };
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.longPressTimer) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (!this.startPoint || !this.lastPoint) {
      this.reset();
      return;
    }

    const dt = this.lastPoint.time - this.startPoint.time;
    const dx = this.lastPoint.x - this.startPoint.x;
    const dy = this.lastPoint.y - this.startPoint.y;
    const moved = Math.hypot(dx, dy);

    // Pinch end
    if (this.pinchActive) {
      const scale = 1; // final scale unknown without continuous distance; emit end
      this.cbs.onPinchEnd?.(scale, e);
      this.pinchActive = false;
    }

    // Pan end
    if (this.panActive) {
      this.cbs.onPanEnd?.(dx, dy, e);
      this.panActive = false;
    }

    // Tap
    if (dt <= this.opts.tapThreshold && moved < this.opts.panThreshold) {
      this.cbs.onTap?.(e);
      this.reset();
      return;
    }

    // Swipe
    if (moved >= this.opts.swipeThreshold && dt <= 600) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      let dir: SwipeDirection;
      if (absX > absY) {
        dir = dx > 0 ? 'right' : 'left';
      } else {
        dir = dy > 0 ? 'down' : 'up';
      }
      this.cbs.onSwipe?.(dir, e);
    }

    this.reset();
  };

  private onPointerCancel = (_e: PointerEvent) => {
    if (this.longPressTimer) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.reset();
  };

  private reset() {
    this.startPoint = null;
    this.lastPoint = null;
    this.panActive = false;
    this.pinchActive = false;
    this.initialDistance = 0;
  }
}

export default TouchGestures;
