import { describe, expect, it } from 'vitest';
import api from '../src/services/api';

describe('api service', () => {
  it('uses an API base URL ending with /api', () => {
    expect(api.defaults.baseURL).toContain('/api');
  });

  it('has request timeout configured for network failures', () => {
    expect(api.defaults.timeout).toBe(10000);
  });
});


