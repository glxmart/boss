/**
 * Container configuration mapper
 * Transforms worker config to Container-Use format
 */

import { WorkerConfig, CreateEnvironmentParams, TemplateVariables } from '../types.js';

export function mapToContainerUseConfig(
  workerConfig: WorkerConfig,
  variables: TemplateVariables
): CreateEnvironmentParams {
  return {
    base_image: workerConfig.base_image,
    setup_commands: workerConfig.setup_commands,
    install_commands: workerConfig.install_commands,
    environment_variables: expandEnvironmentVariables(
      workerConfig.environment_variables,
      variables
    ),
    secrets: workerConfig.secrets,
    network: workerConfig.network
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
  return template.replace(/\$\{(\w+)\}/g, (match, varName) => {
    return variables[varName] ?? match;
  });
}

export function assembleTaskPrompt(workerPrompt: string, taskPrompt: string): string {
  return `${workerPrompt}\n\n## Current Task\n\n${taskPrompt}`;
}

export function escapePromptForShell(prompt: string): string {
  // Escape single quotes for shell
  return prompt.replace(/'/g, "'\\''");
}
