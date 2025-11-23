/**
 * TypeScript types for blockchain data structures
 * These types match the Pydantic models in the Python backend
 */

// Transaction output
export interface TransactionOutput {
  type: number;
  spent: boolean;
  value: number; 
  spending_outpoints?: Array<{
    tx_index: number;
    n: number;
  }>;
  n: number;
  tx_index: number;
  script: string;
  addr?: string; 
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
    addr?: string; 
    value: number;
    n: number;
    script: string;
  };
  script?: string;
}

// Transaction from blockchain.info API
export interface Transaction {
  hash: string;
  ver: number;
  vin_sz: number; 
  vout_sz: number; 
  size: number;
  weight: number;
  fee: number; 
  relayed_by: string;
  lock_time: number;
  tx_index: number;
  double_spend: boolean;
  time: number; 
  block_index?: number;
  block_height?: number;
  inputs: TransactionInput[];
  out: TransactionOutput[];
  result?: number; 
}

// Address response from blockchain.info API
export interface AddressResponse {
  hash160: string;
  address: string;
  n_tx: number; 
  n_unredeemed: number;
  total_received: number; 
  total_sent: number; 
  final_balance: number; 
  txs: Transaction[];
}

// Graph node representing a Bitcoin address
export interface GraphNode {
  id: string; 
  label?: string;
  balance?: number; 
  txCount?: number; 
  x?: number;
  y?: number;
}

// Graph link representing a transaction between addresses
export interface GraphLink {
  source: string;
  target: string; 
  value: number; 
  txHash: string; 
  timestamp?: number;
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
  duration?: number;
}

