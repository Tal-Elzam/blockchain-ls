'use client';

import { useCallback, useState } from 'react';

import AddressDetailsPanel from '@/components/AddressDetails/AddressDetailsPanel';
import ApiLogWindow from '@/components/ApiLog/ApiLogWindow';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BlockchainGraph from '@/components/Graph/BlockchainGraph';
import { BlockchainService, isValidBitcoinAddress } from '@/lib/services/blockchain-service';

import type { GraphData, GraphNode } from '@/lib/types/blockchain';

export default function Home() {
  const [address, setAddress] = useState(''); // The central/initial address
  const [inputValue, setInputValue] = useState('');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandCount, setExpandCount] = useState(0); // Track number of expansions
  const [expandLoading, setExpandLoading] = useState(false);
  const MAX_EXPANSIONS = 3; // Maximum 3 expansions (total 80 transactions: 50 + 10 + 10 + 10)

  const handleSearch = useCallback(async () => {
    const trimmedAddress = inputValue.trim();

    if (!trimmedAddress) {
      setError('Please enter a Bitcoin address');
      return;
    }

    if (!isValidBitcoinAddress(trimmedAddress)) {
      setError('Invalid Bitcoin address format');
      return;
    }

    setAddress(trimmedAddress);
    setSelectedNode(null);
    setError(null);
    setLoading(true);
    setExpandCount(0); // Reset expansion count on new search

    try {
      const data = await BlockchainService.getAddressGraph(trimmedAddress, 50, 0);
      setGraphData(data);

      // Select the central address node
      const centralNode = data.nodes.find((n) => n.id === trimmedAddress);
      if (centralNode) {
        setSelectedNode(centralNode);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch blockchain data';

      // Check if it's a rate limiting or service unavailable error
      if (errorMessage.includes('429') || errorMessage.includes('Too many requests')) {
        setError('Too many requests. Please wait a moment before trying again. The blockchain API has rate limits.');
      } else if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
        setError(
          'Blockchain API is temporarily unavailable. This may be due to rate limiting or maintenance. Please try again in a few minutes.'
        );
      } else {
        setError(errorMessage);
      }

      setGraphData({ nodes: [], links: [] });
    } finally {
      setLoading(false);
    }
  }, [inputValue]);

  const handleNodeClick = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleExpandGraph = useCallback(async () => {
    if (!address) return;

    // Check if reached maximum expansions
    if (expandCount >= MAX_EXPANSIONS) {
      setError(`Maximum expansions reached (${MAX_EXPANSIONS}). Total ${50 + expandCount * 10} transactions loaded.`);
      return;
    }

    setExpandLoading(true);
    setError(null);

    try {
      // Calculate offset: initial 50 + (expandCount * 10)
      const offset = 50 + expandCount * 10;

      const newData = await BlockchainService.getAddressGraph(address, 10, offset);

      const existingNodeIds = new Set(graphData.nodes.map((n) => n.id));
      const newNodes = newData.nodes.filter((n) => !existingNodeIds.has(n.id));

      const updatedGraphData: GraphData = {
        nodes: [...graphData.nodes, ...newNodes],
        links: [...graphData.links, ...newData.links],
      };

      setGraphData(updatedGraphData);
      setExpandCount((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to expand graph';

      if (errorMessage.includes('429') || errorMessage.includes('Too many requests')) {
        setError('Too many requests. Please wait before expanding.');
      } else if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
        setError('Blockchain API is temporarily unavailable. Please try again later.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setExpandLoading(false);
    }
  }, [graphData, expandCount, address, MAX_EXPANSIONS]);

  const handleUpdateGraphFromTransactions = useCallback(
    async (nodeId: string, offset: number) => {
      try {
        // Fetch additional transactions and update graph
        const newData = await BlockchainService.getAddressGraph(nodeId, 10, offset);

        // Merge new nodes with existing ones, avoiding duplicates
        const existingNodeIds = new Set(graphData.nodes.map((n) => n.id));
        const newNodes = newData.nodes.filter((n) => !existingNodeIds.has(n.id));

        // Merge links
        const updatedGraphData: GraphData = {
          nodes: [...graphData.nodes, ...newNodes],
          links: [...graphData.links, ...newData.links],
        };

        setGraphData(updatedGraphData);
      } catch (err) {
        console.error('Failed to update graph from transactions:', err);
      }
    },
    [graphData]
  );

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        {/* Header */}
        <header className="w-full border-b border-gray-200 bg-white shadow-sm">
          <div className="w-full py-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Blockchain Investigator</h1>
            <p className="text-sm text-gray-600">Visualize Bitcoin blockchain transactions</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 mx-auto max-w-[1340px] px-4 pt-8 pb-6 sm:px-6 lg:px-8">
          {/* Search Section */}
          <div
            className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
            style={{ marginTop: '20px', marginBottom: '20px' }}
          >
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="address-input" className="mb-2 block text-sm font-medium text-gray-700">
                  Bitcoin Address
                </label>
                <input
                  id="address-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError(null);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter Bitcoin address (e.g., bc1ql3smp4dphdfxldzecjkj3h4vt8lw8payekxf7h)"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Investigate'}
                </button>
              </div>
            </div>
          </div>

          {/* Graph Expansion Controls */}
          {address && (
            <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm"
            style={{ marginBottom: '20px'}} >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 text-xs font-medium text-gray-500">Central Address</div>
                  <div className="font-mono text-sm text-gray-900">{address}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Expansions</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {expandCount} / {MAX_EXPANSIONS}
                    </div>
                  </div>
                  <button
                    onClick={handleExpandGraph}
                    disabled={expandLoading || expandCount >= MAX_EXPANSIONS}
                    className="rounded-md bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    title={
                      expandCount >= MAX_EXPANSIONS
                        ? `Maximum expansions reached`
                        : `Expand graph with 10 more transactions from central address`
                    }
                  >
                    {expandLoading ? 'Expanding...' : expandCount >= MAX_EXPANSIONS ? 'Max Reached' : 'Expand Graph'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Graph and Details Section */}
          {address && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Graph - Takes 2/3 of the width */}
              <div className="lg:col-span-2">
                <BlockchainGraph
                  graphData={graphData}
                  selectedNode={selectedNode}
                  onNodeClick={handleNodeClick}
                  loading={loading}
                  height={700}
                />
              </div>

              {/* Address Details - Takes 1/3 of the width */}
              <div className="lg:col-span-1">
                <AddressDetailsPanel selectedNode={selectedNode} onUpdateGraph={handleUpdateGraphFromTransactions} />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!address && (
            <div className="flex min-h-[500px] items-center justify-center rounded-lg border border-gray-300 bg-white">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-gray-700">Get Started</h2>
                <p className="mb-4 text-gray-600">Enter a Bitcoin address above to visualize its transaction network</p>
                <div className="text-sm text-gray-500">
                  <p>Example address:</p>
                  <p className="font-mono">bc1ql3smp4dphdfxldzecjkj3h4vt8lw8payekxf7h</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* API Log Window */}
        <ApiLogWindow />

        {/* Footer */}
        <footer
          className="w-full border-t border-gray-200 bg-white flex items-center justify-center py-2"
          style={{ minHeight: '60px',marginTop: '20px' }} 
        >
          <div className="text-center text-sm text-gray-600">
            Blockchain Investigator - Built with Next.js & FastAPI
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
