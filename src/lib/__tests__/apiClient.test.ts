// API client tests
import { ApiClient } from '@/lib/apiClient';

describe('API Client', () => {
  const client = new ApiClient('/api');

  test('client initializes', () => {
    expect(client).toBeDefined();
  });

  // Note: Actual API tests would require mocking fetch
  // This is a placeholder test structure
});
