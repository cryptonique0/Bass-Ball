// Format validation tests
import { validateEmail, validateWalletAddress, validateRange } from '@/lib/validators';

describe('Validators', () => {
  describe('Email validation', () => {
    test('accepts valid email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    test('rejects invalid email', () => {
      expect(validateEmail('invalid')).toBe(false);
    });
  });

  describe('Wallet address validation', () => {
    test('accepts valid address', () => {
      expect(validateWalletAddress('0x1234567890123456789012345678901234567890')).toBe(true);
    });

    test('rejects invalid address', () => {
      expect(validateWalletAddress('invalid')).toBe(false);
    });
  });
});
