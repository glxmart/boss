import { describe, it, expect } from 'vitest';
import { main } from '../src/index.js';

describe('${config.name}', () => {
  it('should have a main function', () => {
    expect(main).toBeDefined();
    expect(typeof main).toBe('function');
  });
});

