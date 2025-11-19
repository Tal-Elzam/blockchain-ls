import type {
    AddressResponse,
    GraphData,
    GraphLink,
    GraphNode,
    Transaction,
  } from '../types/types';
  
  const BLOCKCHAIN_API_BASE = 'https://blockchain.info';
  const DEFAULT_TIMEOUT = 30000; // 30 seconds
  
  
  async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = DEFAULT_TIMEOUT,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }
  
  
  export async function fetchAddressDetails(
    address: string,
    limit = 50,
    offset = 0,
    timeoutMs = DEFAULT_TIMEOUT,
  ): Promise<AddressResponse> {
    const url = `${BLOCKCHAIN_API_BASE}/rawaddr/${address}?limit=${limit}&offset=${offset}`;
  
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        },
        timeoutMs,
      );
  
      if (!response.ok) {
        throw new Error(
          `Failed to fetch address details: ${response.status} ${response.statusText}`,
        );
      }
  
      return (await response.json()) as AddressResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unexpected error: ${String(error)}`);
    }
  }
  
  export function convertTransactionsToGraph(
    address: string,
    transactions: Transaction[],
  ): GraphData {
    const nodes = new Map<string, GraphNode>();
    const links: GraphLink[] = [];
  
    nodes.set(address, {
      id: address,
      label: `${address.slice(0, 8)}...${address.slice(-8)}`,
    });
  
    transactions.forEach((tx) => {
      // Inputs
      tx.inputs.forEach((input) => {
        if (!input.prev_out?.addr) return;
  
        const sourceAddr = input.prev_out.addr;
        const value = input.prev_out.value;
  
        if (!nodes.has(sourceAddr)) {
          nodes.set(sourceAddr, {
            id: sourceAddr,
            label: `${sourceAddr.slice(0, 8)}...${sourceAddr.slice(-8)}`,
          });
        }
  
        if (tx.out.some((output) => output.addr === address)) {
          links.push({
            source: sourceAddr,
            target: address,
            value,
            txHash: tx.hash,
            timestamp: tx.time,
          });
        }
      });
  
      // Outputs
      tx.out.forEach((output) => {
        if (!output.addr || output.addr === address) return;
  
        const destAddr = output.addr;
  
        if (!nodes.has(destAddr)) {
          nodes.set(destAddr, {
            id: destAddr,
            label: `${destAddr.slice(0, 8)}...${destAddr.slice(-8)}`,
          });
        }
  
        if (tx.inputs.some((i) => i.prev_out?.addr === address)) {
          links.push({
            source: address,
            target: destAddr,
            value: output.value,
            txHash: tx.hash,
            timestamp: tx.time,
          });
        }
      });
    });
  
    return {
      nodes: Array.from(nodes.values()),
      links,
    };
  }
  
  export function mergeGraphData(
    existing: GraphData,
    newData: GraphData,
  ): GraphData {
    const nodeMap = new Map<string, GraphNode>();
    const linkMap = new Map<string, GraphLink>();
  
    existing.nodes.forEach((node) => nodeMap.set(node.id, node));
    existing.links.forEach((link) => {
      const key = `${link.source}-${link.target}-${link.txHash}`;
      linkMap.set(key, link);
    });
  
    newData.nodes.forEach((node) => {
      if (!nodeMap.has(node.id)) {
        nodeMap.set(node.id, node);
      }
    });
  
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
  