import { describe, it, expect } from 'vitest';
import {
  createError,
  wrapError,
  ConductorException,
  throwConductorError,
} from '../../src/utils/error-handler.js';
import { ErrorCategory } from '../../src/types.js';

describe('error-handler', () => {
  describe('createError', () => {
    it('should create error with retryable category', () => {
      const error = createError(
        ErrorCategory.CONTAINER_CREATION_FAILED,
        'Container creation failed'
      );

      expect(error.category).toBe(ErrorCategory.CONTAINER_CREATION_FAILED);
      expect(error.message).toBe('Container creation failed');
      expect(error.retryable).toBe(true);
    });

    it('should create error with non-retryable category', () => {
      const error = createError(ErrorCategory.WORKER_CONFIG_NOT_FOUND, 'Worker config not found');

      expect(error.category).toBe(ErrorCategory.WORKER_CONFIG_NOT_FOUND);
      expect(error.message).toBe('Worker config not found');
      expect(error.retryable).toBe(false);
    });

    it('should include optional worker details', () => {
      const error = createError(ErrorCategory.WORKER_EXECUTION_FAILED, 'Execution failed', {
        workerId: 'worker-123',
        workerType: 'architect',
        details: { reason: 'timeout' },
      });

      expect(error.workerId).toBe('worker-123');
      expect(error.workerType).toBe('architect');
      expect(error.details).toEqual({ reason: 'timeout' });
      expect(error.retryable).toBe(true);
    });

    it('should mark MERGE_FAILED as retryable', () => {
      const error = createError(ErrorCategory.MERGE_FAILED, 'Merge conflict');
      expect(error.retryable).toBe(true);
    });

    it('should mark CONTAINER_USE_UNAVAILABLE as retryable', () => {
      const error = createError(
        ErrorCategory.CONTAINER_USE_UNAVAILABLE,
        'Container-use not available'
      );
      expect(error.retryable).toBe(true);
    });
  });

  describe('wrapError', () => {
    it('should wrap Error instance', () => {
      const originalError = new Error('Original error');
      const wrapped = wrapError(
        originalError,
        ErrorCategory.WORKER_EXECUTION_FAILED,
        'Default message'
      );

      expect(wrapped.category).toBe(ErrorCategory.WORKER_EXECUTION_FAILED);
      expect(wrapped.message).toBe('Original error');
      expect(wrapped.details).toBe(originalError);
    });

    it('should wrap non-Error values with default message', () => {
      const wrapped = wrapError(
        'string error',
        ErrorCategory.WORKER_EXECUTION_FAILED,
        'Default message'
      );

      expect(wrapped.category).toBe(ErrorCategory.WORKER_EXECUTION_FAILED);
      expect(wrapped.message).toBe('Default message');
      expect(wrapped.details).toBe('string error');
    });

    it('should wrap null/undefined with default message', () => {
      const wrapped = wrapError(null, ErrorCategory.CONTAINER_CREATION_FAILED, 'Container failed');

      expect(wrapped.message).toBe('Container failed');
      expect(wrapped.details).toBe(null);
    });
  });

  describe('ConductorException', () => {
    it('should create exception with conductor error', () => {
      const conductorError = createError(ErrorCategory.WORKER_CONFIG_NOT_FOUND, 'Config missing');
      const exception = new ConductorException(conductorError);

      expect(exception).toBeInstanceOf(Error);
      expect(exception.name).toBe('ConductorException');
      expect(exception.message).toBe('Config missing');
      expect(exception.error).toBe(conductorError);
    });
  });

  describe('throwConductorError', () => {
    it('should throw ConductorException', () => {
      expect(() => {
        throwConductorError(ErrorCategory.WORKER_CONFIG_NOT_FOUND, 'Worker not found');
      }).toThrow(ConductorException);
    });

    it('should throw exception with correct error details', () => {
      try {
        throwConductorError(ErrorCategory.WORKER_EXECUTION_FAILED, 'Execution failed', {
          workerId: 'worker-456',
          workerType: 'developer',
        });
      } catch (e) {
        expect(e).toBeInstanceOf(ConductorException);
        const exception = e as ConductorException;
        expect(exception.error.category).toBe(ErrorCategory.WORKER_EXECUTION_FAILED);
        expect(exception.error.message).toBe('Execution failed');
        expect(exception.error.workerId).toBe('worker-456');
        expect(exception.error.workerType).toBe('developer');
      }
    });
  });
});
