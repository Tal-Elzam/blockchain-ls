/**
 * Component tests for ApiLogWindow
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import ApiLogWindow from '../ApiLogWindow';
import type { ApiLogEntry } from '@/lib/types/blockchain';

// Mock BlockchainService
vi.mock('@/lib/services/blockchain-service', () => ({
  BlockchainService: {
    getApiLog: vi.fn(),
    clearApiLog: vi.fn(),
  },
}));

import { BlockchainService } from '@/lib/services/blockchain-service';

describe('ApiLogWindow', () => {
  const mockLogEntries: ApiLogEntry[] = [
    {
      id: '1',
      timestamp: Date.now(),
      method: 'GET',
      url: 'http://localhost:8000/api/address/test',
      status: 200,
      statusText: 'OK',
      duration: 150,
    },
    {
      id: '2',
      timestamp: Date.now() - 1000,
      method: 'GET',
      url: 'http://localhost:8000/api/address/test/graph',
      status: 404,
      statusText: 'Not Found',
      error: 'Address not found',
      duration: 100,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toggle button', () => {
    vi.mocked(BlockchainService.getApiLog).mockReturnValue([]);

    render(<ApiLogWindow />);

    expect(screen.getByRole('button', { name: /API Log/i })).toBeInTheDocument();
  });

  it('should display log count on button', () => {
    vi.mocked(BlockchainService.getApiLog).mockReturnValue(mockLogEntries);

    render(<ApiLogWindow />);

    expect(screen.getByRole('button', { name: /API Log \(0\)/i })).toBeInTheDocument();
  });

  it('should open log window when button clicked', async () => {
    vi.mocked(BlockchainService.getApiLog).mockReturnValue([]);
    const user = userEvent.setup();

    render(<ApiLogWindow />);

    const button = screen.getByRole('button', { name: /API Log/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('API Call Log')).toBeInTheDocument();
    });
  });

  it('should display log entries when window is open', async () => {
    vi.mocked(BlockchainService.getApiLog).mockReturnValue(mockLogEntries);
    const user = userEvent.setup();

    render(<ApiLogWindow />);

    const button = screen.getByRole('button', { name: /API Log/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('404')).toBeInTheDocument();
    });
  });

  it('should display empty state when no logs', async () => {
    vi.mocked(BlockchainService.getApiLog).mockReturnValue([]);
    const user = userEvent.setup();

    render(<ApiLogWindow />);

    const button = screen.getByRole('button', { name: /API Log/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/No API calls yet/i)).toBeInTheDocument();
    });
  });

  it('should display success status correctly', async () => {
    const successEntry: ApiLogEntry[] = [
      {
        id: '1',
        timestamp: Date.now(),
        method: 'GET',
        url: 'http://test.com',
        status: 200,
        statusText: 'OK',
        duration: 100,
      },
    ];

    vi.mocked(BlockchainService.getApiLog).mockReturnValue(successEntry);
    const user = userEvent.setup();

    render(<ApiLogWindow />);

    const button = screen.getByRole('button', { name: /API Log/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('200')).toBeInTheDocument();
    });
  });

  it('should display error status correctly', async () => {
    const errorEntry: ApiLogEntry[] = [
      {
        id: '1',
        timestamp: Date.now(),
        method: 'GET',
        url: 'http://test.com',
        status: 500,
        statusText: 'Internal Server Error',
        error: 'Server error',
        duration: 100,
      },
    ];

    vi.mocked(BlockchainService.getApiLog).mockReturnValue(errorEntry);
    const user = userEvent.setup();

    render(<ApiLogWindow />);

    const button = screen.getByRole('button', { name: /API Log/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });

  it('should display request duration', async () => {
    vi.mocked(BlockchainService.getApiLog).mockReturnValue(mockLogEntries);
    const user = userEvent.setup();

    render(<ApiLogWindow />);

    const button = screen.getByRole('button', { name: /API Log/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('150ms')).toBeInTheDocument();
      expect(screen.getByText('100ms')).toBeInTheDocument();
    });
  });

  it('should close window when close button clicked', async () => {
    vi.mocked(BlockchainService.getApiLog).mockReturnValue([]);
    const user = userEvent.setup();

    render(<ApiLogWindow />);

    const button = screen.getByRole('button', { name: /API Log/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('API Call Log')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('✕');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('API Call Log')).not.toBeInTheDocument();
    });
  });
});

