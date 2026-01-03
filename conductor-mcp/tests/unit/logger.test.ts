import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogLevel, logger } from '../../src/utils/logger.js';

describe('logger', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.setLevel(LogLevel.DEBUG); // Reset to DEBUG for tests
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('setLevel', () => {
    it('should set log level', () => {
      logger.setLevel(LogLevel.WARN);
      logger.debug('debug message');
      logger.info('info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();

      logger.warn('warn message');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages when level is DEBUG', () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.debug('debug message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('debug');
      expect(logOutput.message).toBe('debug message');
      expect(logOutput.timestamp).toBeDefined();
    });

    it('should not log debug when level is INFO', () => {
      logger.setLevel(LogLevel.INFO);
      logger.debug('debug message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include context in debug logs', () => {
      logger.debug('debug with context', { workerId: 'worker-123', custom: 'value' });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.workerId).toBe('worker-123');
      expect(logOutput.custom).toBe('value');
    });
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('info message');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('info');
      expect(logOutput.message).toBe('info message');
    });

    it('should not log info when level is WARN', () => {
      logger.setLevel(LogLevel.WARN);
      logger.info('info message');

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should include context in info logs', () => {
      logger.info('info with context', { workerType: 'architect' });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.workerType).toBe('architect');
    });
  });

  describe('warn', () => {
    it('should log warn messages to stderr', () => {
      logger.warn('warning message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('warn');
      expect(logOutput.message).toBe('warning message');
    });

    it('should not log warn when level is ERROR', () => {
      logger.setLevel(LogLevel.ERROR);
      logger.warn('warning message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should include context in warn logs', () => {
      logger.warn('warning with context', { reason: 'timeout' });

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.reason).toBe('timeout');
    });
  });

  describe('error', () => {
    it('should log error messages to stderr', () => {
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('error');
      expect(logOutput.message).toBe('error message');
    });

    it('should always log error regardless of level', () => {
      logger.setLevel(LogLevel.ERROR);
      logger.error('error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should include context and details in error logs', () => {
      logger.error('error with details', {
        workerId: 'worker-789',
        errorCode: 500,
      });

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.workerId).toBe('worker-789');
      expect(logOutput.errorCode).toBe(500);
    });
  });

  describe('log level filtering', () => {
    it('should only log messages at or above set level', () => {
      logger.setLevel(LogLevel.WARN);

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // warn + error
    });
  });

  describe('structured logging', () => {
    it('should output valid JSON', () => {
      logger.info('test message', { key: 'value' });

      const output = consoleLogSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should include timestamp in ISO format', () => {
      logger.info('test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
