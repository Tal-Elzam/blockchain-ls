'use client';

import { useEffect, useState } from 'react';

import { BlockchainService, formatSatoshisToBTC, formatTimestamp } from '@/lib/services/blockchain-service';

import type { AddressResponse, GraphNode } from '@/lib/types/blockchain';

interface AddressDetailsPanelProps {
  selectedNode: GraphNode | null;
  onUpdateGraph?: (nodeId: string, offset: number) => Promise<void>;
}

export default function AddressDetailsPanel({ selectedNode, onUpdateGraph }: AddressDetailsPanelProps) {
  const [addressData, setAddressData] = useState<AddressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.id.startsWith('bc1p')) {
        setError(
          ' Taproot addresses (bc1p...) are not supported by the blockchain API. Please select a different node.'
        );
        setAddressData(null);
        setLoading(false);
        return;
      }

      // Additional check for very long addresses
      if (selectedNode.id.length > 72) {
        setError(' This address format is not supported by the blockchain API. Please select a different node.');
        setAddressData(null);
        setLoading(false);
        return;
      }
      setAddressData(null);
      setLoading(true);
      setError(null);
      setOffset(0);

      BlockchainService.getAddressDetails(selectedNode.id, 10, 0)
        .then((data) => {
          setAddressData(data);
          setError(null);
        })
        .catch((err) => {
          console.error('Error fetching address details:', err);
          setError(err.message || (typeof err === 'string' ? err : 'Failed to fetch address details'));
          setAddressData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setAddressData(null);
      setError(null);
    }
  }, [selectedNode]);

  const handleLoadMore = async () => {
    if (!selectedNode || !addressData) return;

    const newOffset = offset + 10;
    setLoading(true);

    try {
      const newData = await BlockchainService.getAddressDetails(selectedNode.id, 10, newOffset);

      // Merge transactions
      setAddressData({
        ...addressData,
        txs: [...addressData.txs, ...newData.txs],
      });
      setOffset(newOffset);

      // Also update the graph with new connections from these transactions
      if (onUpdateGraph) {
        await onUpdateGraph(selectedNode.id, newOffset);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more transactions');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedNode) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-4 h-[700px] w-full flex flex-col items-center justify-center">
        <h3 className="mb-2 text-lg font-semibold">Address Details</h3>
        <p className="text-gray-500">Select a node to view details</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border border-gray-300 bg-white p-[21px] h-[700px] w-full flex flex-col"
      style={{ minWidth: '300px', paddingLeft: '5px', paddingRight: '5px',paddingTop: '10px' }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#1c272f' }}>
          Address Details
        </h3>
        <button
          onClick={() => {
            setAddressData(null);
            setError(null);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {loading && !addressData && (
        <div className="flex flex-col flex-1 items-center justify-center min-h-0">
          <div className="text-center">
            <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800">{error}</div>}

      {addressData && (
        <div className="flex flex-col flex-1 space-y-4 min-h-0 mx-5"
        style={{paddingBottom: '5px' }}>
          <div style={{paddingBottom: '10px' }}>
            <label className="text-xs font-medium text-gray-500">Address</label>
            <p className="break-all font-mono text-sm" style={{ color: '#1c272f' }}>
              {addressData.address}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Final Balance</label>
              <p className="text-lg font-semibold" style={{ color: '#1c272f' }}>
                {formatSatoshisToBTC(addressData.final_balance)} BTC
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Total Received</label>
              <p className="text-sm" style={{ color: '#1c272f' }}>
                {formatSatoshisToBTC(addressData.total_received)} BTC
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 rounded bg-gray-50 p-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Total TXs</label>
              <p className="text-lg font-semibold" style={{ color: '#1c272f' }}>
                {addressData.n_tx}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Loaded TXs</label>
              <p className="text-lg font-semibold" style={{ color: '#1c272f' }}>
                {addressData.txs.length}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Unredeemed</label>
              <p className="text-lg font-semibold" style={{ color: '#1c272f' }}>
                {addressData.n_unredeemed}
              </p>
            </div>
          </div>

          {addressData.txs.length > 0 && (
            <div className="flex flex-col flex-1 min-h-0">
              <label className="mb-2 block text-xs font-medium text-gray-500">
                Recent Transactions ({addressData.txs.length})
              </label>
              <div className="flex-1 space-y-3 overflow-y-auto min-h-0" style={{ paddingRight: '5px' }}>
                {addressData.txs.map((tx) => (
                  <div key={tx.hash} className="rounded border border-gray-200 p-3 text-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-sm" style={{ color: '#1c272f' }}>
                        {tx.hash.slice(0, 16)}...
                      </span>
                      <span className="text-gray-500 text-xs">{formatTimestamp(tx.time)}</span>
                    </div>
                    <div className="text-base font-medium" style={{ color: '#1c272f' }}>
                      {tx.result && tx.result > 0 ? '+' : ''}
                      {formatSatoshisToBTC(tx.result || 0)} BTC
                    </div>
                  </div>
                ))}
              </div>

              {addressData.txs.length < addressData.n_tx && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="mt-2 w-full rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Load More Transactions'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
