import { describe, it, expect } from 'vitest';
import { db } from './index';

describe('database', () => {
  it('should export db instance', () => {
    expect(db).toBeDefined();
  });
});
