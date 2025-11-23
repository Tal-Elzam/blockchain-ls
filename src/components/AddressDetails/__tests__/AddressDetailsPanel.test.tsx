/**
 * Component tests for AddressDetailsPanel
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import AddressDetailsPanel from '../AddressDetailsPanel';
import type { GraphNode } from '@/lib/types/blockchain';
import { mockAddressData } from '@/__tests__/__mocks__/handlers';

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

import { BlockchainService } from '@/lib/services/blockchain-service';

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
    vi.mocked(BlockchainService.getAddressDetails).mockImplementation(
      () => new Promise(() => {}) 
    );

    render(<AddressDetailsPanel selectedNode={mockNode} />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('should display address details when data is loaded', async () => {
    vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(
      mockAddressData
    );

    render(<AddressDetailsPanel selectedNode={mockNode} />);

    await waitFor(() => {
      expect(screen.getByText(/Address Details/i)).toBeInTheDocument();
    });
  });

  it('should display error message on fetch failure', async () => {
    const errorMessage = 'Failed to fetch data';
    vi.mocked(BlockchainService.getAddressDetails).mockRejectedValue(
      new Error(errorMessage)
    );

    render(<AddressDetailsPanel selectedNode={mockNode} />);

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });
  });

  it('should call getAddressDetails with correct parameters', async () => {
    vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(
      mockAddressData
    );

    render(<AddressDetailsPanel selectedNode={mockNode} />);

    await waitFor(() => {
      expect(BlockchainService.getAddressDetails).toHaveBeenCalledWith(
        mockNode.id,
        10,
        0
      );
    });
  });

  it('should reset data when selectedNode changes to null', async () => {
    vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(
      mockAddressData
    );

    const { rerender } = render(<AddressDetailsPanel selectedNode={mockNode} />);

    await waitFor(() => {
      expect(screen.getByText(/Address Details/i)).toBeInTheDocument();
    });

    rerender(<AddressDetailsPanel selectedNode={null} />);

    expect(screen.getByText(/Select a node/i)).toBeInTheDocument();
  });

  it('should fetch new data when selectedNode changes', async () => {
    vi.mocked(BlockchainService.getAddressDetails).mockResolvedValue(
      mockAddressData
    );

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
      expect(BlockchainService.getAddressDetails).toHaveBeenLastCalledWith(
        newNode.id,
        10,
        0
      );
    });
  });
});

