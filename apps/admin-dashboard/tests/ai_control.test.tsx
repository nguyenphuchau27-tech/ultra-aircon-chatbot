import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AIControl from '../src/pages/ai_control';

vi.mock('../src/services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { decision: 'auto-scale', cities: 5 },
    }),
  },
}));

describe('AIControl page', () => {
  it('renders fetched AI status', async () => {
    render(<AIControl />);

    await waitFor(() => {
      expect(screen.getByText(/Platform Decision:/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/auto-scale/i)).toBeInTheDocument();
    expect(screen.getByText(/5/i)).toBeInTheDocument();
  });
});
