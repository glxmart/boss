import { logger } from '../utils/logger.js';
import { TEMPLATES } from '../utils/prompts.js';

export async function templatesCommand(): Promise<void> {
  logger.section('📋 Available Templates');

  for (const [key, template] of Object.entries(TEMPLATES)) {
    console.log(`\n${template.name} (${key})`);
    console.log(`  ${template.description}`);
    console.log(`  Stack: ${template.stack.join(', ')}`);
  }

  console.log('\n');
}
