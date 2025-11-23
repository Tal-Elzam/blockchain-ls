'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from 'd3-force';
import type { GraphData, GraphNode as BlockchainGraphNode } from '@/lib/types/blockchain';
import '@xyflow/react/dist/style.css';

interface BlockchainGraphProps {
  graphData: GraphData;
  selectedNode: BlockchainGraphNode | null;
  onNodeClick?: (node: BlockchainGraphNode | null) => void;
  loading?: boolean;
  height?: number;
}

// Extended node type for d3-force simulation
interface SimulationNode extends SimulationNodeDatum {
  id: string;
  label?: string;
  balance?: number;
  txCount?: number;
}

// Extended link type for d3-force simulation
interface SimulationLink extends SimulationLinkDatum<SimulationNode> {
  source: string;
  target: string;
  value: number;
  txHash: string;
}

function BlockchainGraphInner({
  graphData,
  selectedNode,
  onNodeClick,
  loading = false,
  height = 600,
}: BlockchainGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const simulationRef = useRef<any>(null);
  const tickCountRef = useRef<number>(0);

  // Convert blockchain graph data to React Flow format
  const convertToReactFlowFormat = (data: GraphData, selectedId?: string, highlightedId?: string) => {
    const rfNodes: Node[] = data.nodes.map((node) => {
      const size = node.txCount ? Math.min(40 + node.txCount / 2, 100) : 40;
      
      return {
        id: node.id,
        type: 'default',
        position: { x: node.x || Math.random() * 1000, y: node.y || Math.random() * 700 },
        data: {
          label: node.id.substring(0, 2) + '...' + node.id.slice(-2),
          balance: node.balance,
          txCount: node.txCount,
          fullId: node.id,
        },
        style: {
          background: selectedId === node.id ? '#ef4444' : 
                     highlightedId === node.id ? '#3b82f6' : '#6b7280',
          color: '#fff',
          border: '2px solid #1f2937',
          borderRadius: '50%',
          width: size,
          height: size,
          fontSize: '10px',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      };
    });

    // Create edges in React Flow format
    const rfEdges: Edge[] = data.links.map((link, index) => {
      const valueInBTC = link.value / 100000000;
      const width = Math.min(Math.max(valueInBTC / 10, 1), 5);
      
      return {
        id: `${link.source}-${link.target}-${index}`,
        source: link.source,
        target: link.target,
        type: 'straight',
        animated: false,
        style: {
          stroke: '#475569',
          strokeWidth: width,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#475569',
          width: 30,
          height: 30,
        },
        data: {
          value: link.value,
          txHash: link.txHash,
        },
      };
    });

    return { nodes: rfNodes, edges: rfEdges };
  };

  // Initialize and run force simulation
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    const { nodes: rfNodes, edges: rfEdges } = convertToReactFlowFormat(graphData, selectedNode?.id, highlightedNode || undefined);
    
    // Create simulation nodes and links
    const simNodes: SimulationNode[] = graphData.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      balance: node.balance,
      txCount: node.txCount,
      x: node.x,
      y: node.y,
    }));

    const simLinks: SimulationLink[] = graphData.links.map((link) => ({
      source: link.source,
      target: link.target,
      value: link.value,
      txHash: link.txHash,
    }));

    // Stop previous simulation if exists
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Reset tick counter
    tickCountRef.current = 0;
    const maxTicks = 150;

    // Create new force simulation with controlled cooldown
    const simulation = forceSimulation(simNodes)
      .force('charge', forceManyBody().strength(-300))
      .force('link', forceLink(simLinks).id((d: any) => d.id).distance(100))
      .force('center', forceCenter(350, 350))
      .force('collide', forceCollide().radius(40))
      .alphaMin(0.001)
      .alphaDecay(0.02);

    simulation.on('tick', () => {
      tickCountRef.current++;
      
      // Stop simulation after max ticks
      if (tickCountRef.current >= maxTicks) {
        simulation.stop();
      }
      
      // Update node positions
      setNodes((nds) =>
        nds.map((node) => {
          const simNode = simNodes.find((n) => n.id === node.id);
          if (simNode) {
            return {
              ...node,
              position: { x: simNode.x || 0, y: simNode.y || 0 },
            };
          }
          return node;
        })
      );
    });

    setNodes(rfNodes);
    setEdges(rfEdges);

    simulationRef.current = simulation;

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [graphData]);

  // Update node styles when selection or highlight changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const size = node.data.txCount ? Math.min(40 + (node.data.txCount as number) / 2, 100) : 40;
        return {
          ...node,
          style: {
            ...node.style,
            background: selectedNode?.id === node.id ? '#ef4444' : 
                       highlightedNode === node.id ? '#3b82f6' : '#6b7280',
            width: size,
            height: size,
          },
        };
      })
    );
  }, [selectedNode, highlightedNode, setNodes]);

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const clickedNode = graphData.nodes.find((n) => n.id === node.id);
      onNodeClick?.(clickedNode || null);
    },
    [graphData.nodes, onNodeClick]
  );

  // Handle node mouse enter (hover)
  const handleNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setHighlightedNode(node.id);
    },
    [graphData.nodes]
  );

  // Handle node mouse leave
  const handleNodeMouseLeave = useCallback(() => {
    setHighlightedNode(null);
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50"
        style={{ height }}
      >
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (!graphData.nodes.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-gray-300 bg-gray-50"
        style={{ height }}
      >
        <p className="text-gray-600">No graph data available</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg border border-gray-300 bg-white" style={{ height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
      <div className="absolute bottom-4 left-4 rounded bg-black/70 px-3 py-1 text-xs text-white">
        {graphData.nodes.length} nodes • {graphData.links.length} links
      </div>
    </div>
  );
}

export default function BlockchainGraph(props: BlockchainGraphProps) {
  return (
    <ReactFlowProvider>
      <BlockchainGraphInner {...props} />
    </ReactFlowProvider>
  );
}
