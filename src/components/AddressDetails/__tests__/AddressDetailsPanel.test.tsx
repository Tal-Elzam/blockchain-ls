/**
 * Component tests for AddressDetailsPanel
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockAddressData } from '@/__tests__/__mocks__/handlers';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { BlockchainService } from '@/lib/services/blockchain-service';
import AddressDetailsPanel from '../AddressDetailsPanel';

import type { GraphNode } from '@/lib/types/blockchain';

// Mock BlockchainService
vi.mock('@/lib/services/blockchain-service', async () => {
  const actual = await vi.importActual('@/lib/services/blockchain-service');
  return {
    ...actual,
    BlockchainService: {
      getAddressDetails: vi.fn(),
      getAddressGraph: vi.fn(),
      getApiLog: vi.fn(() => []),
      clearApiLog: vi.fn(),
    },
  };
});

describe('AddressDetailsPanel', () => {
  const mockNode: GraphNode = {
    id: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    label: 'Test Address',
    balance: 200000000,
    txCount: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no node selected', () => {
    render(<AddressDetailsPanel selectedNode={null} />);

    expect(screen.getByText(/Select a node/i)).toBeInTheDocument();
  });

  it('should show loading state while fetching data', () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    vi.mocked(BlockchainService.getAddressDetails).mockImplementation(() => new Promise(() => {}));

    render(<AddressDetailsPanel selectedNode={mockNode} />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should display address details when data is loaded', async () => {
    vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(mockAddressData);

    render(<AddressDetailsPanel selectedNode={mockNode} />);

    await waitFor(() => {
      expect(screen.getByText(/Address Details/i)).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    const errorMessage = 'Failed to fetch data';
    vi.mocked(BlockchainService.getAddressDetails).mockRejectedValue(new Error(errorMessage));

    render(<AddressDetailsPanel selectedNode={mockNode} />);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });
  });

  it('should call getAddressDetails with correct parameters', async () => {
    vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(mockAddressData);

    render(<AddressDetailsPanel selectedNode={mockNode} />);

    await waitFor(() => {
      expect(BlockchainService.getAddressDetails).toHaveBeenCalledWith(mockNode.id, 10, 0);
    });
  });

  it('should reset data when selectedNode changes to null', async () => {
    vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(mockAddressData);

    const { rerender } = render(<AddressDetailsPanel selectedNode={mockNode} />);

    await waitFor(() => {
      expect(screen.getByText(/Address Details/i)).toBeInTheDocument();
    });

    rerender(<AddressDetailsPanel selectedNode={null} />);

    expect(screen.getByText(/Select a node/i)).toBeInTheDocument();
  });

  it('should fetch new data when selectedNode changes', async () => {
    vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(mockAddressData);

    const { rerender } = render(<AddressDetailsPanel selectedNode={mockNode} />);

    await waitFor(() => {
      expect(BlockchainService.getAddressDetails).toHaveBeenCalledTimes(1);
    });

    const newNode: GraphNode = {
      ...mockNode,
      id: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
    };

    rerender(<AddressDetailsPanel selectedNode={newNode} />);

    await waitFor(() => {
      expect(BlockchainService.getAddressDetails).toHaveBeenCalledTimes(2);
      expect(BlockchainService.getAddressDetails).toHaveBeenLastCalledWith(newNode.id, 10, 0);
    });
  });

  describe('Load More Feature', () => {
    it('should call onUpdateGraph when Load More Transactions is clicked', async () => {
      vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(mockAddressData);
      const mockOnUpdateGraph = vi.fn();

      render(<AddressDetailsPanel selectedNode={mockNode} onUpdateGraph={mockOnUpdateGraph} />);

      await waitFor(() => {
        expect(screen.getByText(/Load More Transactions/i)).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText(/Load More Transactions/i);
      loadMoreButton.click();

      await waitFor(() => {
        expect(mockOnUpdateGraph).toHaveBeenCalledWith(mockNode.id, 10);
      });
    });

    it('should not call onUpdateGraph if not provided', async () => {
      vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(mockAddressData);

      render(<AddressDetailsPanel selectedNode={mockNode} />);

      await waitFor(() => {
        expect(screen.getByText(/Load More Transactions/i)).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText(/Load More Transactions/i);
      loadMoreButton.click();

      // Should not throw error
      await waitFor(() => {
        expect(screen.getByText(/Load More Transactions/i)).toBeInTheDocument();
      });
    });
  });
});
