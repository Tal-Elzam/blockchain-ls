/**
 * Blockchain Service
 * High-level service layer for blockchain operations
 */
import { clearApiLog, fetchAddressDetails, fetchAddressGraph, getApiLog } from '../api/backend-client';

import type { AddressResponse, ApiLogEntry, GraphData, GraphLink, GraphNode } from '../types/blockchain';

/**
 * Merge two graph data structures, avoiding duplicates
 */
export function mergeGraphData(existing: GraphData, newData: GraphData): GraphData {
  const nodeMap = new Map<string, GraphNode>();
  const linkMap = new Map<string, GraphLink>();

  // Process existing nodes and links
  existing.nodes.forEach((node) => nodeMap.set(node.id, node));
  existing.links.forEach((link) => {
    const key = `${link.source}-${link.target}-${link.txHash}`;
    linkMap.set(key, link);
  });

  // Add new nodes (if they don't exist)
  newData.nodes.forEach((node) => {
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, node);
    }
  });

  // Add new links (if they don't exist)
  newData.links.forEach((link) => {
    const key = `${link.source}-${link.target}-${link.txHash}`;
    if (!linkMap.has(key)) {
      linkMap.set(key, link);
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.values()),
  };
}

export function formatSatoshisToBTC(satoshis: number): string {
  return (satoshis / 100_000_000).toFixed(8);
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function isValidBitcoinAddress(address: string): boolean {
  if (!address || address.length < 26 || address.length > 100) {
    return false;
  }

  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
    return true;
  }

  if (/^bc1[a-z0-9]{39,59}$/i.test(address)) {
    return true;
  }

  if (/^bc1p[a-z0-9]{58}$/i.test(address)) {
    return true;
  }

  return false;
}

export class BlockchainService {
  static async getAddressDetails(address: string, limit = 50, offset = 0): Promise<AddressResponse> {
    if (!isValidBitcoinAddress(address)) {
      throw new Error('Invalid Bitcoin address format');
    }
    // Check if this is a Taproot address (bc1p...) - not supported by blockchain.info
    if (address.startsWith('bc1p')) {
      throw new Error('Taproot addresses (bc1p...) are not supported by the blockchain API');
    }

    // Check if the address is too long (additional safety check)
    if (address.length > 90) {
      throw new Error('This address format is not supported by the blockchain API');
    }

    return fetchAddressDetails(address, limit, offset);
  }

  static async getAddressGraph(address: string, limit = 50, offset = 0): Promise<GraphData> {
    if (!isValidBitcoinAddress(address)) {
      throw new Error('Invalid Bitcoin address format');
    }

    return fetchAddressGraph(address, limit, offset);
  }

  static getApiLog(): ApiLogEntry[] {
    return getApiLog();
  }

  static clearApiLog(): void {
    clearApiLog();
  }
}
