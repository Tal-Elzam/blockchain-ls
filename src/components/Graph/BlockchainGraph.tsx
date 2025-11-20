'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { GraphData, GraphNode } from '@/lib/types/blockchain';

// Dynamic import to avoid SSR issues with react-force-graph-2d
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
});

interface BlockchainGraphProps {
  graphData: GraphData;
  selectedNode: GraphNode | null;
  onNodeClick?: (node: GraphNode | null) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  loading?: boolean;
  height?: number;
}

export default function BlockchainGraph({
  graphData,
  selectedNode,
  onNodeClick,
  onNodeHover,
  loading = false,
  height = 600,
}: BlockchainGraphProps) {
  const graphRef = useRef<any>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);

  // Handle node click
  const handleNodeClick = useCallback(
    (node: any) => {
      const clickedNode = graphData.nodes.find((n) => n.id === node.id);
      onNodeClick?.(clickedNode || null);
      
      // Center on clicked node
      if (graphRef.current) {
        graphRef.current.centerAt(node.x, node.y, 1000);
      }
    },
    [graphData.nodes, onNodeClick],
  );

  // Handle node hover
  const handleNodeHover = useCallback(
    (node: any | null) => {
      if (node) {
        setHighlightedNode(node.id);
        const hoveredNode = graphData.nodes.find((n) => n.id === node.id);
        onNodeHover?.(hoveredNode || null);
      } else {
        setHighlightedNode(null);
        onNodeHover?.(null);
      }
    },
    [graphData.nodes, onNodeHover],
  );

  // Highlight selected node
  useEffect(() => {
    if (selectedNode && graphRef.current) {
      const node = graphData.nodes.find((n) => n.id === selectedNode.id);
      if (node && graphRef.current) {
        // Center on selected node after a short delay
        // Use the node from graphData directly instead of getGraphData()
        setTimeout(() => {
          if (graphRef.current) {
            // Find the node in the rendered graph to get its current position
            // We'll use zoomToFit to center on the node instead
            graphRef.current.zoomToFit(400, 20, (node: any) => node.id === selectedNode.id);
          }
        }, 100);
      }
    }
  }, [selectedNode, graphData.nodes]);

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
    <div className="relative rounded-lg border border-gray-300 bg-white">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: any) => `${node.label || node.id}\n${node.balance ? `${(node.balance / 100000000).toFixed(8)} BTC` : ''}`}
        nodeColor={(node: any) => {
          if (selectedNode?.id === node.id) {
            return '#ef4444'; // Red for selected
          }
          if (highlightedNode === node.id) {
            return '#3b82f6'; // Blue for highlighted
          }
          return '#6b7280'; // Gray for default
        }}
        nodeVal={(node: any) => {
          // Node size based on transaction count or balance
          const baseSize = 5;
          if (node.txCount) {
            return Math.min(baseSize + node.txCount / 10, 20);
          }
          return baseSize;
        }}
        linkColor={(link: any) => '#94a3b8'}
        linkWidth={(link: any) => {
          // Link width based on transaction value
          const valueInBTC = link.value / 100000000;
          return Math.min(Math.max(valueInBTC / 10, 1), 5);
        }}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.1}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={100}
        onEngineStop={() => {
          if (graphRef.current) {
            graphRef.current.zoomToFit(400, 20);
          }
        }}
        width={undefined}
        height={height}
      />
      <div className="absolute bottom-4 left-4 rounded bg-black/70 px-3 py-1 text-xs text-white">
        {graphData.nodes.length} nodes • {graphData.links.length} links
      </div>
    </div>
  );
}

