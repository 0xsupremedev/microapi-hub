import { describe, it } from 'vitest';
import './e2e';

// This test simply runs the e2e script; it will exit the process with failure on errors.
// When run inside a full environment with services up, it validates verify→settle flow.
describe('e2e payment flow', () => {
  it('runs infra/e2e script to perform verify→settle', async () => {
    // No-op: import side-effect runs e2e
  });
});


