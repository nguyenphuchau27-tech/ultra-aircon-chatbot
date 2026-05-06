import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GlobalDashboard from '../src/pages/global';

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('../src/services/api', () => ({
  default: {
    get: mockGet,
  },
}));

describe('GlobalDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows fallback for empty data', async () => {
    mockGet.mockResolvedValue({ data: {} });
    render(<GlobalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No global stats available.')).toBeInTheDocument();
    });
  });

  it('shows API error state', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<GlobalDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
