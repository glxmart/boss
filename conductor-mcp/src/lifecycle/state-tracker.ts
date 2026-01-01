/**
 * Worker state tracker
 * Tracks active workers in-memory
 */

import { WorkerState, WorkerType, WorkerStatus, ErrorCategory } from '../types.js';
import { throwConductorError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';

export class StateTracker {
  private workers: Map<string, WorkerState> = new Map();

  /**
   * Register a new worker
   */
  registerWorker(state: WorkerState): void {
    logger.info('Registering worker', {
      workerId: state.workerId,
      workerType: state.workerType
    });

    this.workers.set(state.workerId, state);
  }

  /**
   * Update worker status
   */
  updateWorkerStatus(workerId: string, updates: Partial<WorkerState>): void {
    const current = this.workers.get(workerId);

    if (!current) {
      throwConductorError(
        ErrorCategory.WORKER_NOT_FOUND,
        `Worker ${workerId} not found`,
        { workerId }
      );
    }

    const updated = { ...current, ...updates };
    this.workers.set(workerId, updated);

    logger.debug('Worker status updated', {
      workerId,
      status: updated.status
    });
  }

  /**
   * Get worker state
   */
  getWorker(workerId: string): WorkerState | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Get worker or throw error
   */
  getWorkerOrThrow(workerId: string): WorkerState {
    const worker = this.workers.get(workerId);

    if (!worker) {
      throwConductorError(
        ErrorCategory.WORKER_NOT_FOUND,
        `Worker ${workerId} not found`,
        { workerId }
      );
    }

    return worker;
  }

  /**
   * List all active workers
   */
  listActiveWorkers(): WorkerState[] {
    return Array.from(this.workers.values())
      .filter(w => w.status === 'running' || w.status === 'spawning');
  }

  /**
   * List all workers
   */
  listAllWorkers(): WorkerState[] {
    return Array.from(this.workers.values());
  }

  /**
   * Remove worker from tracking
   */
  removeWorker(workerId: string): void {
    const worker = this.workers.get(workerId);

    if (worker) {
      logger.info('Removing worker from tracking', {
        workerId,
        workerType: worker.workerType
      });
      this.workers.delete(workerId);
    }
  }

  /**
   * Check if worker exists
   */
  hasWorker(workerId: string): boolean {
    return this.workers.has(workerId);
  }

  /**
   * Get workers by type
   */
  getWorkersByType(workerType: WorkerType): WorkerState[] {
    return Array.from(this.workers.values())
      .filter(w => w.workerType === workerType);
  }

  /**
   * Get workers by status
   */
  getWorkersByStatus(status: WorkerStatus): WorkerState[] {
    return Array.from(this.workers.values())
      .filter(w => w.status === status);
  }

  /**
   * Clear all workers (for testing)
   */
  clear(): void {
    this.workers.clear();
  }
}

// Global singleton instance
export const stateTracker = new StateTracker();
