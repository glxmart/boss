/**
 * Error handling utilities
 */

import { ErrorCategory, ConductorError } from '../types.js';

export function createError(
  category: ErrorCategory,
  message: string,
  options?: {
    workerId?: string;
    workerType?: string;
    details?: unknown;
  }
): ConductorError {
  const retryableCategories = [
    ErrorCategory.CONTAINER_CREATION_FAILED,
    ErrorCategory.CONTAINER_CONFIG_FAILED,
    ErrorCategory.WORKER_EXECUTION_FAILED,
    ErrorCategory.MERGE_FAILED,
    ErrorCategory.CONTAINER_USE_UNAVAILABLE,
  ];

  return {
    category,
    message,
    workerId: options?.workerId,
    workerType: options?.workerType,
    details: options?.details,
    retryable: retryableCategories.includes(category),
  };
}

export function wrapError(
  error: unknown,
  category: ErrorCategory,
  defaultMessage: string
): ConductorException {
  if (error instanceof Error) {
    return new ConductorException(createError(category, error.message, { details: error }));
  }
  return new ConductorException(createError(category, defaultMessage, { details: error }));
}

export class ConductorException extends Error {
  constructor(public readonly error: ConductorError) {
    super(error.message);
    this.name = 'ConductorException';
  }
}

export function throwConductorError(
  category: ErrorCategory,
  message: string,
  options?: {
    workerId?: string;
    workerType?: string;
    details?: unknown;
  }
): never {
  throw new ConductorException(createError(category, message, options));
}
