import { logger } from '../utils/logger.js';
import { TEMPLATES, TEMPLATE_CATEGORIES } from '../utils/prompts.js';
import type { TemplateCategory } from '../types/index.js';

export function templatesCommand(): void {
  logger.section('📋 Available Templates');

  // Group templates by category
  for (const [categoryKey, category] of Object.entries(TEMPLATE_CATEGORIES)) {
    console.log(`\n━━━ ${category.name} ━━━`);
    console.log(`  ${category.description}\n`);

    for (const templateKey of category.templates) {
      const template = TEMPLATES[templateKey];
      if (template) {
        console.log(`  ${template.name} (${templateKey})`);
        console.log(`    ${template.description}`);
        console.log(`    Stack: ${template.stack.join(', ')}`);
        console.log(`    Source: ${template.externalCommand.split(' ')[0]}...`);
        console.log('');
      }
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('Usage: boss init --template <template-name>\n');
}
