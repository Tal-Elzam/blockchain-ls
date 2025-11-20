/**
 * Backend API Client
 * HTTP client for communicating with the Python FastAPI backend
 */
import { clientEnv } from '../env/client';
import type {
  AddressResponse,
  GraphData,
  ApiLogEntry,
} from '../types/blockchain';

// Direct backend API calls from the browser
// Using NEXT_PUBLIC_ prefix to expose the backend URL to the client
const BACKEND_URL = clientEnv.NEXT_PUBLIC_BACKEND_URL;

const DEFAULT_TIMEOUT = 30000; // 30 seconds

// API Log Store (for tracking API calls)
const apiLog: ApiLogEntry[] = [];
const MAX_LOG_ENTRIES = 100;

/**
 * Add entry to API log
 */
function addApiLogEntry(entry: ApiLogEntry): void {
  apiLog.unshift(entry);
  // Keep only the last MAX_LOG_ENTRIES entries
  if (apiLog.length > MAX_LOG_ENTRIES) {
    apiLog.pop();
  }
}

/**
 * Get API log entries
 */
export function getApiLog(): ApiLogEntry[] {
  return [...apiLog]; // Return a copy
}

/**
 * Clear API log
 */
export function clearApiLog(): void {
  apiLog.length = 0;
}

/**
 * Fetch with timeout and logging
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const startTime = Date.now();
  const logEntry: ApiLogEntry = {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    method: (options.method as 'GET' | 'POST') || 'GET',
    url,
  };

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    logEntry.status = response.status;
    logEntry.statusText = response.statusText;
    logEntry.duration = duration;

    addApiLogEntry(logEntry);

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    logEntry.error = error instanceof Error ? error.message : String(error);
    logEntry.duration = duration;

    if (error instanceof Error && error.name === 'AbortError') {
      logEntry.error = `Request timeout after ${timeoutMs}ms`;
    }

    addApiLogEntry(logEntry);
    throw error;
  }
}

/**
 * Fetch address details from backend
 */
export async function fetchAddressDetails(
  address: string,
  limit = 50,
  offset = 0,
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<AddressResponse> {
  // Direct call to Python backend
  const url = `${BACKEND_URL}/api/address/${address}?limit=${limit}&offset=${offset}`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
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

/**
 * Fetch address graph data from backend
 */
export async function fetchAddressGraph(
  address: string,
  limit = 50,
  offset = 0,
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<GraphData> {
  // Direct call to Python backend
  const url = `${BACKEND_URL}/api/address/${address}/graph?limit=${limit}&offset=${offset}`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: 'GET',
      },
      timeoutMs,
    );

    if (!response.ok) {
      let errorMessage = `Failed to fetch graph data: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        // If JSON parsing fails, use default error message
      }
      
      // Add more context for 503 errors
      if (response.status === 503) {
        errorMessage = `${errorMessage}. The blockchain API may be temporarily unavailable or rate limited. Please try again in a few minutes.`;
      }
      
      throw new Error(errorMessage);
    }

    return (await response.json()) as GraphData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error: ${String(error)}`);
  }
}

/**
 * Health check endpoint
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
      // Direct call to Python backend
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      clearTimeout(timeoutId);
      // Ignore abort errors for health check
      if (error instanceof Error && error.name === 'AbortError') {
        return false;
      }
      return false;
    }
  } catch {
    return false;
  }
}

