/**
 * Mock Service Worker handlers for API mocking
 * Used in tests to mock backend API calls
 */

// Mock data for tests
export const mockAddressData = {
  hash160: '62e907b15cbf27d5425399ebf6f0fb50ebb88f18',
  address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  n_tx: 5,
  n_unredeemed: 2,
  total_received: 500000000,
  total_sent: 300000000,
  final_balance: 200000000,
  txs: [
    {
      hash: 'abc123def456',
      ver: 1,
      vin_sz: 1,
      vout_sz: 1,
      size: 250,
      weight: 1000,
      fee: 10000,
      relayed_by: '0.0.0.0',
      lock_time: 0,
      tx_index: 123456,
      double_spend: false,
      time: 1609459200,
      block_index: 670000,
      block_height: 670000,
      inputs: [
        {
          sequence: 4294967295,
          prev_out: {
            addr: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
            value: 50000000,
            script: '76a914...',
            spent: false,
            tx_index: 123455,
            type: 0,
            n: 0,
          },
          script: '47304402...',
        },
      ],
      out: [
        {
          type: 0,
          spent: false,
          value: 100000000,
          n: 0,
          tx_index: 123456,
          script: '76a914...',
          addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        },
      ],
      result: 50000000,
    },
  ],
};

export const mockGraphData = {
  nodes: [
    {
      id: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      label: '1A1zP1eP...DivfNa',
      balance: 200000000,
      txCount: 5,
    },
    {
      id: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      label: '1BvBMSEY...JaNVN2',
      balance: 50000000,
      txCount: 2,
    },
  ],
  links: [
    {
      source: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      target: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      value: 100000000,
      txHash: 'abc123def456',
      timestamp: 1609459200,
    },
  ],
};
