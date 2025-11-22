'use client';

import { useState, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import BlockchainGraph from '@/components/Graph/BlockchainGraph';
import AddressDetailsPanel from '@/components/AddressDetails/AddressDetailsPanel';
import ApiLogWindow from '@/components/ApiLog/ApiLogWindow';
import type { GraphData, GraphNode } from '@/lib/types/blockchain';
import { BlockchainService } from '@/lib/services/blockchain-service';
import { mergeGraphData } from '@/lib/services/blockchain-service';
import { isValidBitcoinAddress } from '@/lib/services/blockchain-service';

export default function Home() {
  const [address, setAddress] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError('Blockchain API is temporarily unavailable. This may be due to rate limiting or maintenance. Please try again in a few minutes.');
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

  const handleNodeExpand = useCallback(async (nodeId: string, currentOffset: number) => {
    setLoading(true);
    try {
      const newData = await BlockchainService.getAddressGraph(nodeId, 50, currentOffset + 50);
      setGraphData((prev) => mergeGraphData(prev, newData));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to expand node';
      
      // Check if it's a rate limiting error
      if (errorMessage.includes('429') || errorMessage.includes('Too many requests')) {
        setError('Too many requests. Please wait a moment before expanding more nodes.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Blockchain Investigator
              </h1>
              <p className="text-sm text-gray-600">
                Visualize Bitcoin blockchain transactions
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Search Section */}
          <div className="mb-6 rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="address-input"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
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
                  placeholder="Enter Bitcoin address (e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
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
                <AddressDetailsPanel selectedNode={selectedNode} />
              </div>
            </div>
          )}

          {/* Empty State */}
          {!address && (
            <div className="flex min-h-[500px] items-center justify-center rounded-lg border border-gray-300 bg-white">
              <div className="text-center">
                <h2 className="mb-2 text-xl font-semibold text-gray-700">
                  Get Started
                </h2>
                <p className="mb-4 text-gray-600">
                  Enter a Bitcoin address above to visualize its transaction
                  network
                </p>
                <div className="text-sm text-gray-500">
                  <p>Example address:</p>
                  <p className="font-mono">
                    1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* API Log Window */}
        <ApiLogWindow />

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white flex items-center justify-center py-2" style={{ minHeight: '60px' }}>
          <div className="text-center text-sm text-gray-600">
            Blockchain Investigator - Built with Next.js & FastAPI
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
