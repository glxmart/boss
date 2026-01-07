import { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Error response structure
 */
interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

/**
 * Global error handler plugin for Fastify.
 *
 * Provides consistent error formatting across all routes.
 *
 * Usage:
 * ```ts
 * import errorHandler from '@/plugins/error-handler';
 *
 * fastify.register(errorHandler);
 * ```
 */
async function errorHandler(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler(
    (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
      const statusCode = error.statusCode ?? 500;

      const errorResponse: ErrorResponse = {
        statusCode,
        error: error.name || 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      // Add request ID if available
      const requestId = request.headers['x-request-id'] as string | undefined;
      if (requestId) {
        errorResponse.requestId = requestId;
      }

      // Log the error
      if (statusCode >= 500) {
        request.log.error({ err: error, requestId }, 'Server error');
      } else {
        request.log.warn({ err: error, requestId }, 'Client error');
      }

      reply.status(statusCode).send(errorResponse);
    }
  );

  // Handle 404 errors
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const errorResponse: ErrorResponse = {
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    reply.status(404).send(errorResponse);
  });
}

export default fp(errorHandler, {
  name: 'error-handler',
  fastify: '4.x',
});
