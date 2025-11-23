/**
 * Unit tests for blockchain service utility functions
 */
import { describe, expect, it } from 'vitest';

import { formatSatoshisToBTC, formatTimestamp, isValidBitcoinAddress, mergeGraphData } from '../blockchain-service';

import type { GraphData, GraphLink } from '@/lib/types/blockchain';

describe('mergeGraphData', () => {
  it('should merge two empty graphs', () => {
    const graph1: GraphData = { nodes: [], links: [] };
    const graph2: GraphData = { nodes: [], links: [] };

    const result = mergeGraphData(graph1, graph2);

    expect(result.nodes).toHaveLength(0);
    expect(result.links).toHaveLength(0);
  });

  it('should merge graphs with unique nodes', () => {
    const graph1: GraphData = {
      nodes: [{ id: 'addr1', label: 'Address 1' }],
      links: [],
    };
    const graph2: GraphData = {
      nodes: [{ id: 'addr2', label: 'Address 2' }],
      links: [],
    };

    const result = mergeGraphData(graph1, graph2);

    expect(result.nodes).toHaveLength(2);
    expect(result.nodes.map((n) => n.id)).toContain('addr1');
    expect(result.nodes.map((n) => n.id)).toContain('addr2');
  });

  it('should not duplicate nodes with same id', () => {
    const graph1: GraphData = {
      nodes: [{ id: 'addr1', label: 'Address 1' }],
      links: [],
    };
    const graph2: GraphData = {
      nodes: [{ id: 'addr1', label: 'Address 1 Updated' }],
      links: [],
    };

    const result = mergeGraphData(graph1, graph2);

    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0]?.id).toBe('addr1');
  });

  it('should merge graphs with unique links', () => {
    const graph1: GraphData = {
      nodes: [],
      links: [
        {
          source: 'addr1',
          target: 'addr2',
          value: 100,
          txHash: 'tx1',
        },
      ],
    };
    const graph2: GraphData = {
      nodes: [],
      links: [
        {
          source: 'addr2',
          target: 'addr3',
          value: 200,
          txHash: 'tx2',
        },
      ],
    };

    const result = mergeGraphData(graph1, graph2);

    expect(result.links).toHaveLength(2);
  });

  it('should not duplicate links with same source, target, and txHash', () => {
    const link: GraphLink = {
      source: 'addr1',
      target: 'addr2',
      value: 100,
      txHash: 'tx1',
    };

    const graph1: GraphData = { nodes: [], links: [link] };
    const graph2: GraphData = { nodes: [], links: [link] };

    const result = mergeGraphData(graph1, graph2);

    expect(result.links).toHaveLength(1);
  });

  it('should keep links with same addresses but different transactions', () => {
    const graph1: GraphData = {
      nodes: [],
      links: [
        {
          source: 'addr1',
          target: 'addr2',
          value: 100,
          txHash: 'tx1',
        },
      ],
    };
    const graph2: GraphData = {
      nodes: [],
      links: [
        {
          source: 'addr1',
          target: 'addr2',
          value: 200,
          txHash: 'tx2',
        },
      ],
    };

    const result = mergeGraphData(graph1, graph2);

    expect(result.links).toHaveLength(2);
  });
});

describe('formatSatoshisToBTC', () => {
  it('should format 1 BTC correctly', () => {
    expect(formatSatoshisToBTC(100000000)).toBe('1.00000000');
  });
});

describe('formatTimestamp', () => {
  it('should format unix timestamp to readable date', () => {
    const timestamp = 1609459200; // 2021-01-01 00:00:00 UTC
    const result = formatTimestamp(timestamp);

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('isValidBitcoinAddress', () => {
  // Legacy addresses (P2PKH - start with 1)
  it('should validate legacy P2PKH addresses', () => {
    expect(isValidBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(true);
    expect(isValidBitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(true);
  });

  // Legacy addresses (P2SH - start with 3)
  it('should validate legacy P2SH addresses', () => {
    expect(isValidBitcoinAddress('3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy')).toBe(true);
  });

  // SegWit addresses (start with bc1)
  it('should validate SegWit (bech32) addresses', () => {
    expect(isValidBitcoinAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toBe(true);
  });

  // Taproot addresses (start with bc1p)
  it('should validate Taproot addresses', () => {
    expect(isValidBitcoinAddress('bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297')).toBe(true);
  });

  // Invalid addresses
  it('should reject empty string', () => {
    expect(isValidBitcoinAddress('')).toBe(false);
  });

  it('should reject too short addresses', () => {
    expect(isValidBitcoinAddress('1A1zP1')).toBe(false);
  });

  it('should reject too long addresses', () => {
    expect(isValidBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')).toBe(false);
  });

  it('should reject addresses with invalid characters', () => {
    expect(isValidBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf0O')).toBe(false); // 0 and O not allowed
    expect(isValidBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfIl')).toBe(false); // I and l not allowed
  });

  it('should reject addresses not starting with 1, 3, or bc1', () => {
    expect(isValidBitcoinAddress('2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(false);
    expect(isValidBitcoinAddress('4J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy')).toBe(false);
  });

  it('should reject invalid SegWit format', () => {
    expect(isValidBitcoinAddress('bc1invalidaddress')).toBe(false);
  });
});
