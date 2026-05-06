import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DigitalTwin from '../src/pages/digital_twin';

const mockGet = vi.hoisted(() => vi.fn());

vi.mock('../src/services/api', () => ({
  default: {
    get: mockGet,
  },
}));

describe('DigitalTwin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows fallback when backend returns empty object', async () => {
    mockGet.mockResolvedValue({ data: {} });
    render(<DigitalTwin />);

    await waitFor(() => {
      expect(screen.getByText('No simulation data available.')).toBeInTheDocument();
    });
  });

  it('handles failed API call', async () => {
    mockGet.mockRejectedValue(new Error('Timeout'));
    render(<DigitalTwin />);

    await waitFor(() => {
      expect(screen.getByText('Timeout')).toBeInTheDocument();
    });
  });
});
