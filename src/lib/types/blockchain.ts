/**
 * TypeScript types for blockchain data structures
 * These types match the Pydantic models in the Python backend
 */

// Transaction output
export interface TransactionOutput {
  type: number;
  spent: boolean;
  value: number; // Value in satoshis
  spending_outpoints?: Array<{
    tx_index: number;
    n: number;
  }>;
  n: number;
  tx_index: number;
  script: string;
  addr?: string; // Destination address
}

// Transaction input
export interface TransactionInput {
  sequence: number;
  witness?: string;
  prev_out?: {
    spent: boolean;
    spending_outpoints?: Array<{
      tx_index: number;
      n: number;
    }>;
    tx_index: number;
    type: number;
    addr?: string; // Source address
    value: number; // Value in satoshis
    n: number;
    script: string;
  };
  script?: string;
}

// Transaction from blockchain.info API
export interface Transaction {
  hash: string;
  ver: number;
  vin_sz: number; // Number of inputs
  vout_sz: number; // Number of outputs
  size: number;
  weight: number;
  fee: number; // Transaction fee in satoshis
  relayed_by: string;
  lock_time: number;
  tx_index: number;
  double_spend: boolean;
  time: number; // Unix timestamp
  block_index?: number;
  block_height?: number;
  inputs: TransactionInput[];
  out: TransactionOutput[];
  result?: number; // Balance change for this address (positive = received, negative = sent)
}

// Address response from blockchain.info API
export interface AddressResponse {
  hash160: string;
  address: string;
  n_tx: number; // Total number of transactions
  n_unredeemed: number;
  total_received: number; // Total received in satoshis
  total_sent: number; // Total sent in satoshis
  final_balance: number; // Final balance in satoshis
  txs: Transaction[];
}

// Graph node representing a Bitcoin address
export interface GraphNode {
  id: string; // Bitcoin address
  label?: string;
  balance?: number; // Balance in satoshis
  txCount?: number; // Number of transactions
  x?: number; // X position for React Flow
  y?: number; // Y position for React Flow
}

// Graph link representing a transaction between addresses
export interface GraphLink {
  source: string; // Source address ID
  target: string; // Destination address ID
  value: number; // Transaction amount in satoshis
  txHash: string; // Transaction hash
  timestamp?: number; // Transaction timestamp
}

// Graph data structure for React Flow
export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// API call log entry
export interface ApiLogEntry {
  id: string;
  timestamp: number;
  method: 'GET' | 'POST';
  url: string;
  status?: number;
  statusText?: string;
  error?: string;
  duration?: number; // Request duration in ms
}

