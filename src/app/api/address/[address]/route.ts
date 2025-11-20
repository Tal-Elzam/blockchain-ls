import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env/server';
import type { AddressResponse } from '@/lib/types/blockchain';

const BACKEND_URL = serverEnv.BACKEND_URL || 'http://localhost:8000';

/**
 * GET /api/address/[address]
 * Proxy endpoint for fetching address details from Python backend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    const url = `${BACKEND_URL}/api/address/${address}?limit=${limit}&offset=${offset}`;

    // Add timeout for fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Return error with detail from backend
        return NextResponse.json(
          { detail: errorData.detail || errorData.error || `Backend error: ${response.status}` },
          { status: response.status },
        );
      }

      const data = (await response.json()) as AddressResponse;
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout - backend did not respond within 30 seconds');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch address details';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error for debugging
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      backendUrl: BACKEND_URL,
    });
    
    return NextResponse.json(
      {
        detail: errorMessage,
        error: 'Internal server error',
      },
      { status: 500 },
    );
  }
}

