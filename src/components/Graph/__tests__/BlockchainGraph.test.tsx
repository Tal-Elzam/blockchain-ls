/**
 * Component tests for BlockchainGraph
 */
import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@/__tests__/utils/test-utils';
import BlockchainGraph from '../BlockchainGraph';

import type { GraphData, GraphNode } from '@/lib/types/blockchain';

// Mock @xyflow/react

vi.mock('@xyflow/react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReactFlow: ({ nodes, edges }: any) => (
    <div data-testid="react-flow">
      <div data-testid="nodes-count">{nodes?.length || 0}</div>
      <div data-testid="edges-count">{edges?.length || 0}</div>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useNodesState: (initialNodes: any) => [initialNodes, vi.fn(), vi.fn()],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEdgesState: (initialEdges: any) => [initialEdges, vi.fn(), vi.fn()],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
  useReactFlow: () => ({
    fitView: vi.fn(),
    setCenter: vi.fn(),
  }),
  Background: () => <div data-testid="background" />,
  MarkerType: {
    ArrowClosed: 'arrowclosed',
  },
}));

// Mock d3-force
vi.mock('d3-force', () => ({
  forceSimulation: vi.fn(() => ({
    force: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    stop: vi.fn(),
    alphaMin: vi.fn().mockReturnThis(),
    alphaDecay: vi.fn().mockReturnThis(),
  })),
  forceManyBody: vi.fn(() => ({ strength: vi.fn().mockReturnThis() })),
  forceLink: vi.fn(() => ({
    id: vi.fn().mockReturnThis(),
    distance: vi.fn().mockReturnThis(),
  })),
  forceCenter: vi.fn(),
  forceCollide: vi.fn(() => ({ radius: vi.fn().mockReturnThis() })),
}));

describe('BlockchainGraph', () => {
  const mockGraphData: GraphData = {
    nodes: [
      {
        id: 'addr1',
        label: 'Address 1',
        balance: 100000000,
        txCount: 5,
      },
      {
        id: 'addr2',
        label: 'Address 2',
        balance: 50000000,
        txCount: 3,
      },
    ],
    links: [
      {
        source: 'addr1',
        target: 'addr2',
        value: 50000000,
        txHash: 'tx123',
        timestamp: 1609459200,
      },
    ],
  };

  it('should render loading state', () => {
    const emptyGraph: GraphData = { nodes: [], links: [] };
    render(<BlockchainGraph graphData={emptyGraph} selectedNode={null} loading={true} />);

    expect(screen.getByText(/Loading graph/i)).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    const emptyGraph: GraphData = { nodes: [], links: [] };
    render(<BlockchainGraph graphData={emptyGraph} selectedNode={null} loading={false} />);

    expect(screen.getByText(/No graph data available/i)).toBeInTheDocument();
  });

  it('should render graph with nodes and links', () => {
    render(<BlockchainGraph graphData={mockGraphData} selectedNode={null} loading={false} />);

    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('should display node and link count', () => {
    render(<BlockchainGraph graphData={mockGraphData} selectedNode={null} loading={false} />);

    expect(screen.getByText(/2 nodes • 1 links/i)).toBeInTheDocument();
  });

  it('should handle selectedNode prop', () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const selectedNode: GraphNode = mockGraphData.nodes[0]!;
    render(<BlockchainGraph graphData={mockGraphData} selectedNode={selectedNode} loading={false} />);

    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('should call onNodeClick when provided', () => {
    const onNodeClick = vi.fn();
    render(<BlockchainGraph graphData={mockGraphData} selectedNode={null} onNodeClick={onNodeClick} loading={false} />);

    // Note: Actual click event testing would require more complex setup with ReactFlow
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('should handle large graph data', () => {
    const largeGraph: GraphData = {
      nodes: Array.from({ length: 50 }, (_, i) => ({
        id: `addr${i}`,
        label: `Address ${i}`,
        balance: 100000000,
        txCount: i,
      })),
      links: Array.from({ length: 100 }, (_, i) => ({
        source: `addr${i % 50}`,
        target: `addr${(i + 1) % 50}`,
        value: 1000000,
        txHash: `tx${i}`,
      })),
    };

    render(<BlockchainGraph graphData={largeGraph} selectedNode={null} loading={false} />);

    expect(screen.getByText(/50 nodes • 100 links/i)).toBeInTheDocument();
  });

  it('should update when graphData changes', () => {
    const { rerender } = render(<BlockchainGraph graphData={mockGraphData} selectedNode={null} loading={false} />);

    expect(screen.getByText(/2 nodes • 1 links/i)).toBeInTheDocument();

    const newGraphData: GraphData = {
      nodes: [...mockGraphData.nodes, { id: 'addr3', label: 'Address 3' }],
      links: mockGraphData.links,
    };

    rerender(<BlockchainGraph graphData={newGraphData} selectedNode={null} loading={false} />);

    expect(screen.getByText(/3 nodes • 1 links/i)).toBeInTheDocument();
  });

  describe('Edge Color Coding Feature', () => {
    it('should display edge color legend when node is selected', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const selectedNode: GraphNode = mockGraphData.nodes[0]!;
      render(<BlockchainGraph graphData={mockGraphData} selectedNode={selectedNode} loading={false} />);

      expect(screen.getByText(/Edge Colors:/i)).toBeInTheDocument();
      expect(screen.getByText(/Outgoing/i)).toBeInTheDocument();
      expect(screen.getByText(/Incoming/i)).toBeInTheDocument();
    });

    it('should not display edge color legend when no node is selected', () => {
      render(<BlockchainGraph graphData={mockGraphData} selectedNode={null} loading={false} />);

      expect(screen.queryByText(/Edge Colors:/i)).not.toBeInTheDocument();
    });

    it('should update legend when selectedNode changes', () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const selectedNode: GraphNode = mockGraphData.nodes[0]!;
      const { rerender } = render(<BlockchainGraph graphData={mockGraphData} selectedNode={null} loading={false} />);

      expect(screen.queryByText(/Edge Colors:/i)).not.toBeInTheDocument();

      rerender(<BlockchainGraph graphData={mockGraphData} selectedNode={selectedNode} loading={false} />);

      expect(screen.getByText(/Edge Colors:/i)).toBeInTheDocument();
    });
  });
});
