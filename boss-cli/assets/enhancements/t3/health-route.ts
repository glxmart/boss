import { NextResponse } from 'next/server';

/**
 * Health check response type
 */
interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  checks?: {
    database?: 'ok' | 'error';
    cache?: 'ok' | 'error';
  };
}

/**
 * GET /api/health
 *
 * Health check endpoint for container orchestration and load balancers.
 * Returns 200 if the service is healthy, 503 if degraded.
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const startTime = process.hrtime.bigint();

  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Add optional health checks here
  // Example: database connectivity check
  // try {
  //   await db.$queryRaw`SELECT 1`;
  //   response.checks = { ...response.checks, database: 'ok' };
  // } catch {
  //   response.checks = { ...response.checks, database: 'error' };
  //   response.status = 'degraded';
  // }

  const statusCode = response.status === 'ok' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}
