/**
 * Unit tests for backend-client API functions
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockAddressData, mockGraphData } from '@/__tests__/__mocks__/handlers';
import { clearApiLog, fetchAddressDetails, fetchAddressGraph, getApiLog } from '../backend-client';

// Mock fetch globally
const mockFetch = vi.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.fetch = mockFetch as any;

describe('backend-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearApiLog();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchAddressDetails', () => {
    it('should fetch address details successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockAddressData,
      });

      const result = await fetchAddressDetails('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      expect(result).toEqual(mockAddressData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should use custom limit and offset parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockAddressData,
      });

      await fetchAddressDetails('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 10, 5);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=10'), expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('offset=5'), expect.any(Object));
    });

    it('should throw error on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(fetchAddressDetails('invalid-address')).rejects.toThrow('Failed to fetch address details');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchAddressDetails('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Timeout');
            error.name = 'AbortError';
            reject(error);
          }, 100);
        });
      });

      await expect(fetchAddressDetails('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 50, 0, 50)).rejects.toThrow();
    });

    it('should log successful API calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockAddressData,
      });

      await fetchAddressDetails('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      const logs = getApiLog();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.method).toBe('GET');
      expect(logs[0]?.status).toBe(200);
      expect(logs[0]?.url).toContain('/api/address/');
    });

    it('should log failed API calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      try {
        await fetchAddressDetails('invalid-address');
      } catch {
        // Expected error
      }

      const logs = getApiLog();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.status).toBe(404);
    });
  });

  describe('fetchAddressGraph', () => {
    it('should fetch graph data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockGraphData,
      });

      const result = await fetchAddressGraph('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      expect(result).toEqual(mockGraphData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/address/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/graph'),
        expect.any(Object)
      );
    });

    it('should use custom limit and offset parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockGraphData,
      });

      await fetchAddressGraph('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 20, 10);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=20'), expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('offset=10'), expect.any(Object));
    });

    it('should throw error on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ detail: 'Server error' }),
      });

      await expect(fetchAddressGraph('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).rejects.toThrow();
    });

    it('should handle 503 errors with appropriate message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ detail: 'Rate limited' }),
      });

      await expect(fetchAddressGraph('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).rejects.toThrow(
        /temporarily unavailable or rate limited/
      );
    });

    it('should parse error detail from response', async () => {
      const errorDetail = 'Custom error message';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: errorDetail }),
      });

      await expect(fetchAddressGraph('invalid')).rejects.toThrow(errorDetail);
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(fetchAddressGraph('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).rejects.toThrow();
    });

    it('should log API calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockGraphData,
      });

      await fetchAddressGraph('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      const logs = getApiLog();
      expect(logs).toHaveLength(1);
      expect(logs[0]?.url).toContain('/graph');
    });
  });

  describe('API Log Management', () => {
    it('should return empty log initially', () => {
      clearApiLog();
      expect(getApiLog()).toHaveLength(0);
    });

    it('should clear log entries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockAddressData,
      });

      await fetchAddressDetails('test');
      expect(getApiLog()).toHaveLength(1);

      clearApiLog();
      expect(getApiLog()).toHaveLength(0);
    });

    it('should limit log entries to maximum', async () => {
      // Make more than 100 requests to test limit
      for (let i = 0; i < 105; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => mockAddressData,
        });
        await fetchAddressDetails(`address-${i}`);
      }

      const logs = getApiLog();
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it('should keep most recent entries when limit exceeded', async () => {
      clearApiLog();

      // Make 102 requests
      for (let i = 0; i < 102; i++) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => mockAddressData,
        });
        await fetchAddressDetails(`address-${i}`);
      }

      const logs = getApiLog();
      // Should have most recent 100 entries
      expect(logs.length).toBe(100);
      // First entry should be the most recent (address-101)
      expect(logs[0]?.url).toContain('address-101');
    });
  });
});
