import { Type, Static } from '@sinclair/typebox';

/**
 * TypeBox schemas for common API patterns.
 *
 * Usage in routes:
 * ```ts
 * import { IdParamsSchema, PaginationQuerySchema } from '@/schemas/common';
 *
 * fastify.get('/users/:id', {
 *   schema: {
 *     params: IdParamsSchema,
 *   },
 *   handler: async (request, reply) => {
 *     const { id } = request.params;
 *     // ...
 *   },
 * });
 * ```
 */

// Common ID parameter schema
export const IdParamsSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
});
export type IdParams = Static<typeof IdParamsSchema>;

// Pagination query schema
export const PaginationQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  sort: Type.Optional(Type.String()),
  order: Type.Optional(Type.Union([Type.Literal('asc'), Type.Literal('desc')])),
});
export type PaginationQuery = Static<typeof PaginationQuerySchema>;

// Error response schema
export const ErrorResponseSchema = Type.Object({
  statusCode: Type.Integer(),
  error: Type.String(),
  message: Type.String(),
  timestamp: Type.String({ format: 'date-time' }),
  path: Type.String(),
  requestId: Type.Optional(Type.String()),
});
export type ErrorResponse = Static<typeof ErrorResponseSchema>;

// Success response wrapper
export const SuccessResponseSchema = <T extends ReturnType<typeof Type.Object>>(dataSchema: T) =>
  Type.Object({
    success: Type.Literal(true),
    data: dataSchema,
  });

// Paginated response wrapper
export const PaginatedResponseSchema = <T extends ReturnType<typeof Type.Object>>(
  itemSchema: T
) =>
  Type.Object({
    success: Type.Literal(true),
    data: Type.Array(itemSchema),
    pagination: Type.Object({
      page: Type.Integer(),
      limit: Type.Integer(),
      total: Type.Integer(),
      totalPages: Type.Integer(),
    }),
  });
