import { describe, it, expect, beforeEach } from 'vitest';
import { StateTracker } from '../../src/lifecycle/state-tracker.js';
import { WorkerState } from '../../src/types.js';

describe('StateTracker', () => {
  let tracker: StateTracker;

  beforeEach(() => {
    tracker = new StateTracker();
  });

  it('should register a worker', () => {
    const state: WorkerState = {
      workerId: 'env-123',
      workerType: 'architect',
      branch: 'container-use/env-123',
      targetBranch: 'main',
      status: 'running',
      startedAt: new Date().toISOString(),
      artifacts: [],
    };

    tracker.registerWorker(state);

    const retrieved = tracker.getWorker('env-123');
    expect(retrieved).toEqual(state);
  });

  it('should update worker status', () => {
    const state: WorkerState = {
      workerId: 'env-123',
      workerType: 'architect',
      branch: 'container-use/env-123',
      targetBranch: 'main',
      status: 'running',
      startedAt: new Date().toISOString(),
      artifacts: [],
    };

    tracker.registerWorker(state);
    tracker.updateWorkerStatus('env-123', { status: 'completed' });

    const retrieved = tracker.getWorker('env-123');
    expect(retrieved?.status).toBe('completed');
  });

  it('should list active workers', () => {
    const state1: WorkerState = {
      workerId: 'env-123',
      workerType: 'architect',
      branch: 'container-use/env-123',
      targetBranch: 'main',
      status: 'running',
      startedAt: new Date().toISOString(),
      artifacts: [],
    };

    const state2: WorkerState = {
      workerId: 'env-456',
      workerType: 'clarifier',
      branch: 'container-use/env-456',
      targetBranch: 'main',
      status: 'completed',
      startedAt: new Date().toISOString(),
      artifacts: [],
    };

    tracker.registerWorker(state1);
    tracker.registerWorker(state2);

    const active = tracker.listActiveWorkers();
    expect(active).toHaveLength(1);
    expect(active[0]?.workerId).toBe('env-123');
  });

  it('should remove a worker', () => {
    const state: WorkerState = {
      workerId: 'env-123',
      workerType: 'architect',
      branch: 'container-use/env-123',
      targetBranch: 'main',
      status: 'running',
      startedAt: new Date().toISOString(),
      artifacts: [],
    };

    tracker.registerWorker(state);
    tracker.removeWorker('env-123');

    const retrieved = tracker.getWorker('env-123');
    expect(retrieved).toBeUndefined();
  });
});
