/**
 * EVM Storage Visualizer - Type Definitions
 * TypeScript interfaces for storage data structures
 */

/**
 * Data types that can be decoded from storage slots
 */
export enum StorageDataType {
  ADDRESS = 'address',
  UINT256 = 'uint256',
  INT256 = 'int256',
  BYTES32 = 'bytes32',
  BOOL = 'bool',
  STRING = 'string',
  BYTES = 'bytes',
  UNKNOWN = 'unknown',
  EMPTY = 'empty'
}

/**
 * Individual storage slot data
 */
export interface StorageSlot {
  slot: number;                    // Slot number (0-255, etc.)
  slotHex: string;                 // Slot number as hex (0x00, 0x01, etc.)
  rawValue: string;                // Raw 32-byte hex value (64 chars)
  dataType: StorageDataType;       // Detected or specified data type
  decodedValue: string;            // Human-readable decoded value
  interpretations: {               // Multiple possible interpretations
    address?: string;              // As Ethereum address
    uint256?: string;              // As unsigned integer
    int256?: string;               // As signed integer
    bytes32?: string;              // As bytes32
    bool?: boolean;                // As boolean
    string?: string;               // As string (if applicable)
  };
  isEmpty: boolean;                // True if all zeros
  lastUpdated?: number;            // Timestamp of last update
}

/**
 * Contract metadata from GoldRush/RPC
 */
export interface ContractMetadata {
  address: string;                 // Contract address
  name?: string;                   // Contract name (if available)
  symbol?: string;                 // Token symbol (if ERC20)
  isVerified: boolean;             // Whether contract is verified
  abi?: any[];                     // Contract ABI (if verified)
  storageLayout?: StorageLayout;   // Parsed storage layout (if available)
  chainId: number;                 // Chain ID
  fetchedAt: number;               // When metadata was fetched
}

/**
 * Full contract storage state
 */
export interface ContractStorage {
  address: string;                 // Contract address
  chainId: number;                 // Chain ID
  slots: StorageSlot[];            // Array of storage slots
  metadata?: ContractMetadata;     // Contract metadata
  slotRange: {                     // Range of slots fetched
    start: number;
    end: number;
  };
  totalSlotsFetched: number;       // Number of slots fetched
  fetchedAt: number;               // Timestamp of fetch
  blockNumber?: number;            // Block number at which storage was fetched
}

/**
 * Storage layout for verified contracts (from Solidity compiler output)
 */
export interface StorageLayout {
  storage: StorageVariable[];      // Array of storage variables
  types: Record<string, TypeInfo>; // Type definitions
}

/**
 * Individual storage variable from contract ABI
 */
export interface StorageVariable {
  astId: number;                   // AST node ID
  contract: string;                // Contract name
  label: string;                   // Variable name
  offset: number;                  // Byte offset within slot
  slot: string;                    // Slot number
  type: string;                    // Type key (references types map)
}

/**
 * Type information for storage variables
 */
export interface TypeInfo {
  encoding: string;                // Encoding type (inplace, bytes, mapping, etc.)
  label: string;                   // Type label (uint256, address, etc.)
  numberOfBytes: string;           // Size in bytes
  base?: string;                   // Base type (for arrays/mappings)
  key?: string;                    // Key type (for mappings)
  value?: string;                  // Value type (for mappings)
}

/**
 * RPC request for eth_getStorageAt
 */
export interface StorageRPCRequest {
  address: string;                 // Contract address
  slot: string;                    // Slot number as hex
  blockTag: string | number;       // Block number or 'latest'
}

/**
 * Batch RPC request for multiple slots
 */
export interface BatchStorageRequest {
  address: string;                 // Contract address
  slots: number[];                 // Array of slot numbers
  blockTag: string | number;       // Block number or 'latest'
  chainId: number;                 // Chain ID for RPC endpoint
}

/**
 * Cache entry structure
 */
export interface StorageCacheEntry<T> {
  data: T;                         // Cached data
  timestamp: number;               // When cached
  expiresAt: number;               // When cache expires
}

/**
 * API response for storage endpoint
 */
export interface StorageAPIResponse {
  success: boolean;
  data?: ContractStorage;
  error?: string;
  cached?: boolean;
  latency?: number;
}

/**
 * API response for metadata endpoint
 */
export interface MetadataAPIResponse {
  success: boolean;
  data?: ContractMetadata;
  error?: string;
  cached?: boolean;
  latency?: number;
}

/**
 * Export options for storage data
 */
export interface StorageExportOptions {
  format: 'json' | 'csv';
  includeMetadata: boolean;
  includeInterpretations: boolean;
  onlyNonEmpty: boolean;
}

/**
 * Storage decoder configuration
 */
export interface DecoderConfig {
  useHeuristics: boolean;          // Use heuristic type detection
  preferredTypes?: Record<number, StorageDataType>; // User-specified types per slot
  strictMode: boolean;             // Strict validation
}

/**
 * RPC provider configuration
 */
export interface RPCProvider {
  name: string;                    // Provider name (Alchemy, Infura, etc.)
  endpoint: string;                // RPC endpoint URL
  chainId: number;                 // Chain ID
  apiKey?: string;                 // API key (if required)
  maxBatchSize: number;            // Max batch request size
  timeout: number;                 // Request timeout in ms
}

/**
 * Storage fetch options
 */
export interface StorageFetchOptions {
  startSlot: number;               // Starting slot number
  endSlot: number;                 // Ending slot number
  batchSize: number;               // Batch request size
  blockTag?: string | number;      // Block number or 'latest'
  includeEmpty: boolean;           // Include empty (all-zero) slots
  timeout?: number;                // Request timeout
}
