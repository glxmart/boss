// Backwards compatibility wrapper
// The `bootstrap` command is now an alias for `init`
import { initCommand } from './init.js';
import type { BootstrapOptions } from '../types/index.js';

/**
 * @deprecated Use `initCommand` instead. This is kept for backwards compatibility.
 */
export async function bootstrapCommand(options: BootstrapOptions): Promise<void> {
  return initCommand(options);
}
