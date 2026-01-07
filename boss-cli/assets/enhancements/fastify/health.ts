import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Health check response
 */
interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  checks?: {
    database?: 'ok' | 'error';
  };
}

/**
 * Health check routes for container orchestration and load balancers.
 *
 * Routes:
 * - GET /health - Overall health status
 * - GET /ready - Readiness check
 *
 * Usage:
 * ```ts
 * import healthRoutes from '@/routes/health';
 *
 * fastify.register(healthRoutes);
 * ```
 */
export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * Health check endpoint
   */
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    // Add optional health checks here
    // Example: database connectivity check
    // try {
    //   await prisma.$queryRaw`SELECT 1`;
    //   response.checks = { ...response.checks, database: 'ok' };
    // } catch {
    //   response.checks = { ...response.checks, database: 'error' };
    //   response.status = 'degraded';
    // }

    const statusCode = response.status === 'ok' ? 200 : 503;
    reply.status(statusCode).send(response);
  });

  /**
   * Readiness check endpoint
   * Use this for Kubernetes readiness probes
   */
  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    // Add readiness checks here
    // These should verify that the service can handle requests

    const statusCode = response.status === 'ok' ? 200 : 503;
    reply.status(statusCode).send(response);
  });
}
