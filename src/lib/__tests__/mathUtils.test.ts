// Math utilities tests
import { distance, normalize, clamp } from '@/lib/mathUtils';

describe('Math Utilities', () => {
  test('distance calculation', () => {
    const d = distance({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(d).toBeCloseTo(5);
  });

  test('normalize vector', () => {
    const n = normalize({ x: 3, y: 4 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
  });

  test('clamp value', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
  });
});
