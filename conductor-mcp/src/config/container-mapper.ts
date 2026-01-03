/**
 * Container configuration mapper
 * Transforms worker config to Container-Use format
 */

import { WorkerConfig, CreateEnvironmentParams, TemplateVariables } from '../types.js';

export function mapToContainerUseConfig(
  workerConfig: WorkerConfig,
  variables: TemplateVariables,
  environmentSource: string,
  title: string
): CreateEnvironmentParams {
  return {
    environment_source: environmentSource,
    title,
    base_image: workerConfig.base_image,
    setup_commands: workerConfig.setup_commands,
    install_commands: workerConfig.install_commands,
    environment_variables: expandEnvironmentVariables(
      workerConfig.environment_variables,
      variables
    ),
    secrets: resolveSecrets(workerConfig.secrets),
    network: workerConfig.network,
  };
}

export function expandEnvironmentVariables(
  envVars: Record<string, string>,
  variables: TemplateVariables
): Record<string, string> {
  const expanded: Record<string, string> = {};

  for (const [key, value] of Object.entries(envVars)) {
    expanded[key] = expandTemplate(value, variables);
  }

  return expanded;
}

export function expandTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\$\{(\w+)\}/g, (match, varName: string) => {
    return variables[varName as keyof TemplateVariables] ?? match;
  });
}

export function assembleTaskPrompt(workerPrompt: string, taskPrompt: string): string {
  return `${workerPrompt}\n\n## Current Task\n\n${taskPrompt}`;
}

export function escapePromptForShell(prompt: string): string {
  // Escape single quotes for shell
  return prompt.replace(/'/g, "'\\''");
}

/**
 * Resolve secrets from conductor's environment
 *
 * When conductor is started with `op run --env-file=.env -- npx @glxmart/conductor-mcp stdio`,
 * 1Password CLI resolves op:// references from .env and injects them as environment variables.
 *
 * This function adds CLAUDE_CODE_OAUTH_TOKEN from conductor's environment to worker secrets.
 */
export function resolveSecrets(secrets: string[]): string[] {
  const resolvedSecrets = [...secrets];

  // Add CLAUDE_CODE_OAUTH_TOKEN from conductor's environment if available
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    resolvedSecrets.push(`CLAUDE_CODE_OAUTH_TOKEN=${process.env.CLAUDE_CODE_OAUTH_TOKEN}`);
  }

  return resolvedSecrets;
}
