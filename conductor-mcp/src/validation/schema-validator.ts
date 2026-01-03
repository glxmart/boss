/**
 * JSON Schema validation for worker metadata and outputs
 *
 * Validates:
 * - Worker metadata.json against the master schema
 * - Worker outputs against generated schemas
 */

import Ajv, { type ValidateFunction, type ErrorObject } from 'ajv';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import { throwConductorError } from '../utils/error-handler.js';
import { ErrorCategory } from '../types.js';

interface WorkerSchemaProperties {
  [key: string]: unknown;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the master worker metadata schema
const WORKER_METADATA_SCHEMA_PATH = join(
  __dirname,
  '..',
  '..',
  'schemas',
  'worker-metadata.schema.json'
);

// Ajv instance with strict mode for validation
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  verbose: true,
});

let workerMetadataValidator: ValidateFunction | null = null;

/**
 * Load and compile the master worker metadata schema
 */
async function loadWorkerMetadataSchema(): Promise<ValidateFunction> {
  if (workerMetadataValidator) {
    return workerMetadataValidator;
  }

  try {
    const schemaContent = await readFile(WORKER_METADATA_SCHEMA_PATH, 'utf-8');
    const schema = JSON.parse(schemaContent) as Record<string, unknown>;
    workerMetadataValidator = ajv.compile(schema);
    logger.debug('Worker metadata schema loaded and compiled');
    return workerMetadataValidator;
  } catch (error) {
    throwConductorError(
      ErrorCategory.WORKER_CONFIG_INVALID,
      'Failed to load worker metadata schema',
      { details: { error, path: WORKER_METADATA_SCHEMA_PATH } }
    );
  }
}

/**
 * Validate worker metadata.json against the master schema
 */
export async function validateWorkerMetadata(metadata: Record<string, unknown>): Promise<void> {
  const validator = await loadWorkerMetadataSchema();
  const workerType =
    typeof metadata === 'object' && metadata !== null && 'workerType' in metadata
      ? String(metadata.workerType)
      : 'unknown';

  const valid = validator(metadata);

  if (!valid) {
    const errors = formatValidationErrors(validator.errors || []);
    const errorSummary = errors.slice(0, 3).join('; '); // Show first 3 errors
    const moreErrors = errors.length > 3 ? ` (and ${errors.length - 3} more)` : '';

    throwConductorError(
      ErrorCategory.WORKER_CONFIG_INVALID,
      `Worker metadata validation failed for "${workerType}": ${errorSummary}${moreErrors}`,
      {
        workerType,
        details: {
          allErrors: errors,
          schemaPath: WORKER_METADATA_SCHEMA_PATH,
          metadata,
        },
      }
    );
  }

  logger.debug('Worker metadata validation passed', { workerType });
}

/**
 * Generate JSON schema for worker output based on metadata
 *
 * This creates a schema that validates the JSON output from a worker
 * based on the outputs defined in metadata.json
 */
export function generateWorkerOutputSchema(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const baseSchema: Record<string, unknown> = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    required: [
      'artifacts',
      'decisions',
      'issues',
      'recommendations',
      'tasksCompleted',
      'workComplete',
    ],
    properties: {
      artifacts: {
        type: 'array',
        description: 'Files created, updated, or deleted by this worker',
        items: {
          type: 'object',
          required: ['path', 'action', 'purpose'],
          properties: {
            path: { type: 'string' },
            action: { type: 'string', enum: ['created', 'updated', 'deleted'] },
            purpose: { type: 'string' },
          },
        },
      },
      decisions: {
        type: 'array',
        description: 'Key decisions made by this worker',
        items: {
          type: 'object',
          required: ['decision', 'rationale', 'impact', 'reversible'],
          properties: {
            decision: { type: 'string' },
            rationale: { type: 'string' },
            impact: { type: 'string', enum: ['high', 'medium', 'low'] },
            reversible: { type: 'boolean' },
          },
        },
      },
      issues: {
        type: 'array',
        description: 'Problems encountered during work',
        items: {
          type: 'object',
          required: ['severity', 'description', 'recommendation'],
          properties: {
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            description: { type: 'string' },
            recommendation: { type: 'string' },
          },
        },
      },
      recommendations: {
        type: 'array',
        description: 'Recommendations for BOSS on next steps',
        items: { type: 'string' },
      },
      tasksCompleted: {
        type: 'array',
        description: 'Description of tasks completed',
        items: { type: 'string' },
      },
      workComplete: {
        type: 'boolean',
        description: 'Whether the worker has completed its assigned work',
      },
      nextSteps: {
        type: 'array',
        description: 'Suggested next steps for the workflow',
        items: { type: 'string' },
      },
    },
  };

  // Add worker-specific properties based on constraints or outputs
  const workerSpecificProps = getWorkerSpecificProperties(metadata);
  if (workerSpecificProps && baseSchema.properties) {
    baseSchema.properties = {
      ...(baseSchema.properties as Record<string, unknown>),
      ...workerSpecificProps,
    };
  }

  return baseSchema;
}

/**
 * Extract worker-specific properties from metadata
 */
function getWorkerSpecificProperties(
  metadata: Record<string, unknown>
): WorkerSchemaProperties | null {
  const props: WorkerSchemaProperties = {};
  const workerType =
    'workerType' in metadata && typeof metadata.workerType === 'string'
      ? metadata.workerType
      : null;

  if (!workerType) {
    return null;
  }

  switch (workerType) {
    case 'architect':
      props.principlesEstablished = {
        type: 'array',
        description: 'Principles established in the constitution',
        items: { type: 'string' },
      };
      break;

    case 'clarifier':
      props.questionsAsked = {
        type: 'number',
        description: 'Number of questions asked',
      };
      props.ambiguitiesResolved = {
        type: 'number',
        description: 'Number of ambiguities resolved',
      };
      props.userPersonasIdentified = {
        type: 'number',
        description: 'Number of user personas identified',
      };
      props.workflowsDocumented = {
        type: 'number',
        description: 'Number of workflows documented',
      };
      break;

    case 'spec-writer':
      props.userStoriesWritten = {
        type: 'number',
        description: 'Number of user stories written',
      };
      props.acceptanceCriteriaDefined = {
        type: 'number',
        description: 'Number of acceptance criteria defined',
      };
      props.bddFormat = {
        type: 'boolean',
        description: 'Whether user stories are in BDD format',
      };
      break;

    case 'planner':
      props.tasksBrokenDown = {
        type: 'number',
        description: 'Number of tasks broken down',
      };
      props.parallelTasksIdentified = {
        type: 'number',
        description: 'Number of parallel tasks identified',
      };
      break;

    case 'reviewer':
      props.complianceChecksPerformed = {
        type: 'array',
        description: 'Compliance checks performed',
        items: { type: 'string' },
      };
      props.violations = {
        type: 'array',
        description: 'Constitution violations found',
        items: { type: 'object' },
      };
      props.approvalStatus = {
        type: 'string',
        enum: ['approved', 'rejected', 'retry'],
        description: 'Approval status of the plan',
      };
      props.retriesRemaining = {
        type: 'number',
        description: 'Number of retries remaining',
      };
      break;

    case 'developer-frontend':
    case 'developer-backend':
    case 'developer-fullstack':
      props.testsPassed = {
        type: 'boolean',
        description: 'Whether all tests passed',
      };
      props.coverageAchieved = {
        type: 'number',
        description: 'Test coverage percentage achieved',
      };
      if (workerType === 'developer-backend') {
        props.mutationScore = {
          type: 'number',
          description: 'Mutation testing score achieved',
        };
      }
      if (workerType === 'developer-frontend') {
        props.accessibilityAuditPassed = {
          type: 'boolean',
          description: 'Whether accessibility audit passed',
        };
      }
      if (workerType === 'developer-fullstack') {
        props.integrationTestsPassed = {
          type: 'boolean',
          description: 'Whether integration tests passed',
        };
      }
      break;

    case 'tester':
      props.testsCreated = {
        type: 'number',
        description: 'Number of tests created',
      };
      props.coverageAchieved = {
        type: 'number',
        description: 'Test coverage percentage achieved',
      };
      props.mutationScore = {
        type: 'number',
        description: 'Mutation testing score',
      };
      props.testPyramid = {
        type: 'object',
        description: 'Test pyramid breakdown',
        properties: {
          unit: { type: 'number' },
          integration: { type: 'number' },
          e2e: { type: 'number' },
        },
      };
      break;

    case 'code-reviewer':
      props.issuesFound = {
        type: 'number',
        description: 'Number of issues found',
      };
      props.issuesResolved = {
        type: 'number',
        description: 'Number of issues resolved',
      };
      props.approvalStatus = {
        type: 'string',
        enum: ['approved', 'changes-requested'],
        description: 'Code review approval status',
      };
      props.reviewCategories = {
        type: 'object',
        description: 'Review results by category',
        properties: {
          codeQuality: { type: 'string', enum: ['pass', 'fail'] },
          testQuality: { type: 'string', enum: ['pass', 'fail'] },
          architecture: { type: 'string', enum: ['pass', 'fail'] },
          performance: { type: 'string', enum: ['pass', 'fail'] },
          security: { type: 'string', enum: ['pass', 'fail'] },
        },
      };
      break;

    case 'consolidator':
      props.branchesMerged = {
        type: 'number',
        description: 'Number of worker branches merged',
      };
      props.integrationTestsPassed = {
        type: 'boolean',
        description: 'Whether integration tests passed',
      };
      props.documentationComplete = {
        type: 'boolean',
        description: 'Whether documentation is complete',
      };
      props.allArtifactsPresent = {
        type: 'boolean',
        description: 'Whether all required artifacts are present',
      };
      break;

    case 'security-engineer':
      props.vulnerabilities = {
        type: 'object',
        description: 'Vulnerabilities found',
        properties: {
          found: { type: 'number' },
          remediated: { type: 'number' },
          critical: { type: 'number' },
          high: { type: 'number' },
          medium: { type: 'number' },
          low: { type: 'number' },
        },
      };
      props.complianceChecks = {
        type: 'array',
        description: 'Compliance checks performed',
        items: { type: 'string' },
      };
      break;

    case 'devops-engineer':
      props.environments = {
        type: 'array',
        description: 'Environments configured',
        items: { type: 'string' },
      };
      props.cicdPipelineConfigured = {
        type: 'boolean',
        description: 'Whether CI/CD pipeline is configured',
      };
      props.infrastructureProvisioned = {
        type: 'boolean',
        description: 'Whether infrastructure is provisioned',
      };
      props.monitoringSetup = {
        type: 'boolean',
        description: 'Whether monitoring is set up',
      };
      break;

    case 'technical-writer':
      props.coverage = {
        type: 'string',
        description: 'Documentation coverage percentage',
      };
      props.examplesTested = {
        type: 'boolean',
        description: 'Whether code examples are tested',
      };
      break;

    case 'product-owner':
      props.priorities = {
        type: 'object',
        description: 'User story priority breakdown',
        properties: {
          P1: { type: 'number' },
          P2: { type: 'number' },
          P3: { type: 'number' },
        },
      };
      props.businessValueDelivered = {
        type: 'string',
        description: 'Business value delivered',
      };
      break;
  }

  return Object.keys(props).length > 0 ? props : null;
}

/**
 * Validate worker output JSON against generated schema
 */
export function validateWorkerOutput(
  metadata: Record<string, unknown>,
  output: Record<string, unknown>
): void {
  const schema = generateWorkerOutputSchema(metadata);
  const validator = ajv.compile(schema);
  const workerType =
    typeof metadata === 'object' && metadata !== null && 'workerType' in metadata
      ? String(metadata.workerType)
      : 'unknown';

  const valid = validator(output);

  if (!valid) {
    const errors = formatValidationErrors(validator.errors || []);
    const errorSummary = errors.slice(0, 3).join('; '); // Show first 3 errors
    const moreErrors = errors.length > 3 ? ` (and ${errors.length - 3} more)` : '';

    throwConductorError(
      ErrorCategory.WORKER_EXECUTION_FAILED,
      `Worker output validation failed for "${workerType}": ${errorSummary}${moreErrors}`,
      {
        workerType,
        details: {
          allErrors: errors,
          output,
        },
      }
    );
  }

  logger.debug('Worker output validation passed', { workerType });
}

/**
 * Format Ajv validation errors for better readability
 */
function formatValidationErrors(errors: ErrorObject[]): string[] {
  return errors.map((err) => {
    const path = err.instancePath || 'root';
    const message = err.message || 'validation failed';
    return `${path}: ${message}`;
  });
}
