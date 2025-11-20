import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env/server';

const BACKEND_URL = serverEnv.BACKEND_URL || 'http://localhost:8000';

/**
 * GET /api/health
 * Health check endpoint that proxies to Python backend
 */
export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { status: 'unhealthy', backend: false },
        { status: 503 },
      );
    }

    const data = await response.json();
    return NextResponse.json({ status: 'healthy', backend: true, ...data });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        backend: false,
        error: error instanceof Error ? error.message : 'Backend connection failed',
      },
      { status: 503 },
    );
  }
}

