import { NextRequest, NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env/server';
import type { GraphData } from '@/lib/types/blockchain';

const BACKEND_URL = serverEnv.BACKEND_URL || 'http://localhost:8000';

/**
 * GET /api/address/[address]/graph
 * Proxy endpoint for fetching address graph data from Python backend
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

    const url = `${BACKEND_URL}/api/address/${address}/graph?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Return error with detail from backend
      return NextResponse.json(
        { detail: errorData.detail || errorData.error || `Backend error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = (await response.json()) as GraphData;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch graph data',
      },
      { status: 500 },
    );
  }
}

