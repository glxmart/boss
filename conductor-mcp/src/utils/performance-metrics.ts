/**
 * Performance metrics tracking (Phase 6)
 *
 * Logs worker performance metrics to .boss/performance-metrics.json
 * for analysis and optimization
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { PerformanceMetrics } from '../types.js';
import { logger } from './logger.js';

/**
 * Log performance metrics for a worker
 */
export async function logPerformanceMetrics(
  projectPath: string,
  metrics: PerformanceMetrics
): Promise<void> {
  try {
    const metricsDir = join(projectPath, '.boss');
    const metricsFile = join(metricsDir, 'performance-metrics.json');

    // Ensure .boss directory exists
    if (!existsSync(metricsDir)) {
      await mkdir(metricsDir, { recursive: true });
    }

    // Read existing metrics
    let allMetrics: PerformanceMetrics[] = [];
    if (existsSync(metricsFile)) {
      try {
        const content = await readFile(metricsFile, 'utf-8');
        allMetrics = JSON.parse(content);
      } catch (error) {
        logger.warn('Failed to read existing performance metrics, starting fresh', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Add new metrics
    allMetrics.push(metrics);

    // Write updated metrics
    await writeFile(metricsFile, JSON.stringify(allMetrics, null, 2));

    logger.info('Performance metrics logged', {
      workerId: metrics.workerId,
      workerType: metrics.workerType,
      totalTime: metrics.totalTime,
      success: metrics.success
    });
  } catch (error) {
    logger.error('Failed to log performance metrics', {
      workerId: metrics.workerId,
      error: error instanceof Error ? error.message : String(error)
    });
    // Don't throw - metrics logging should not break worker spawning
  }
}

/**
 * Get performance metrics summary for analysis
 */
export async function getPerformanceMetricsSummary(
  projectPath: string
): Promise<{
  totalWorkers: number;
  avgTotalTime: number;
  avgContainerStartTime: number;
  avgTaskExecutionTime: number;
  successRate: number;
  optimizationsUsed: {
    resume: number;
    parallel: number;
  };
}> {
  const metricsFile = join(projectPath, '.boss', 'performance-metrics.json');

  if (!existsSync(metricsFile)) {
    return {
      totalWorkers: 0,
      avgTotalTime: 0,
      avgContainerStartTime: 0,
      avgTaskExecutionTime: 0,
      successRate: 0,
      optimizationsUsed: {
        resume: 0,
        parallel: 0
      }
    };
  }

  try {
    const content = await readFile(metricsFile, 'utf-8');
    const allMetrics: PerformanceMetrics[] = JSON.parse(content);

    if (allMetrics.length === 0) {
      return {
        totalWorkers: 0,
        avgTotalTime: 0,
        avgContainerStartTime: 0,
        avgTaskExecutionTime: 0,
        successRate: 0,
        optimizationsUsed: {
          resume: 0,
          parallel: 0
        }
      };
    }

    const totalWorkers = allMetrics.length;
    const successfulWorkers = allMetrics.filter(m => m.success).length;
    const resumeCount = allMetrics.filter(m => m.usedResumeOptimization).length;
    const parallelCount = allMetrics.filter(m => m.wasPartOfParallelBatch).length;

    const avgTotalTime = allMetrics.reduce((sum, m) => sum + m.totalTime, 0) / totalWorkers;
    const avgContainerStartTime = allMetrics.reduce((sum, m) => sum + m.containerStartTime, 0) / totalWorkers;
    const avgTaskExecutionTime = allMetrics.reduce((sum, m) => sum + m.taskExecutionTime, 0) / totalWorkers;

    return {
      totalWorkers,
      avgTotalTime,
      avgContainerStartTime,
      avgTaskExecutionTime,
      successRate: (successfulWorkers / totalWorkers) * 100,
      optimizationsUsed: {
        resume: resumeCount,
        parallel: parallelCount
      }
    };
  } catch (error) {
    logger.error('Failed to get performance metrics summary', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
