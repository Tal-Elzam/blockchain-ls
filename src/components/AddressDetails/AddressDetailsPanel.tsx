'use client';

import { useState, useEffect } from 'react';
import type { GraphNode, AddressResponse } from '@/lib/types/blockchain';
import { formatSatoshisToBTC, formatTimestamp } from '@/lib/services/blockchain-service';
import { BlockchainService } from '@/lib/services/blockchain-service';

interface AddressDetailsPanelProps {
  selectedNode: GraphNode | null;
  onLoadMore?: (address: string, offset: number) => void;
}

export default function AddressDetailsPanel({
  selectedNode,
  onLoadMore,
}: AddressDetailsPanelProps) {
  const [addressData, setAddressData] = useState<AddressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (selectedNode) {
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
          setError(
            err.message || 
            (typeof err === 'string' ? err : 'Failed to fetch address details')
          );
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
      const newData = await BlockchainService.getAddressDetails(
        selectedNode.id,
        10,
        newOffset,
      );
      
      // Merge transactions
      setAddressData({
        ...addressData,
        txs: [...addressData.txs, ...newData.txs],
      });
      setOffset(newOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more transactions');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedNode) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-4">
        <h3 className="mb-2 text-lg font-semibold">Address Details</h3>
        <p className="text-gray-500">Select a node to view details</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#1c272f' }}>Address Details</h3>
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
        <div className="py-8 text-center">
          <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {addressData && (
        <div className="space-y-4">
          {/* Address */}
          <div>
            <label className="text-xs font-medium text-gray-500">Address</label>
            <p className="break-all font-mono text-sm" style={{ color: '#1c272f' }}>{addressData.address}</p>
          </div>

          {/* Balance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Final Balance
              </label>
              <p className="text-lg font-semibold" style={{ color: '#1c272f' }}>
                {formatSatoshisToBTC(addressData.final_balance)} BTC
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Total Received
              </label>
              <p className="text-sm" style={{ color: '#1c272f' }}>
                {formatSatoshisToBTC(addressData.total_received)} BTC
              </p>
            </div>
          </div>

          {/* Transaction Stats */}
          <div className="grid grid-cols-3 gap-4 rounded bg-gray-50 p-3">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Total TXs
              </label>
              <p className="text-lg font-semibold" style={{ color: '#1c272f' }}>{addressData.n_tx}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Loaded TXs
              </label>
              <p className="text-lg font-semibold" style={{ color: '#1c272f' }}>{addressData.txs.length}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">
                Unredeemed
              </label>
              <p className="text-lg font-semibold" style={{ color: '#1c272f' }}>
                {addressData.n_unredeemed}
              </p>
            </div>
          </div>

          {/* Transactions List */}
          {addressData.txs.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500">
                Recent Transactions ({addressData.txs.length})
              </label>
              <div className="max-h-[400px] space-y-2 overflow-y-auto">
                {addressData.txs.map((tx) => (
                  <div
                    key={tx.hash}
                    className="rounded border border-gray-200 p-2 text-xs"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-mono text-xs" style={{ color: '#1c272f' }}>
                        {tx.hash.slice(0, 16)}...
                      </span>
                      <span className="text-gray-500">
                        {formatTimestamp(tx.time)}
                      </span>
                    </div>
                    <div style={{ color: '#1c272f' }}>
                      {tx.result && tx.result > 0 ? '+' : ''}
                      {formatSatoshisToBTC(tx.result || 0)} BTC
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {addressData.txs.length < addressData.n_tx && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="mt-3 w-full rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400"
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
