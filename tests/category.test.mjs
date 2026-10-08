import { test } from 'node:test';
import assert from 'node:assert/strict';
import categories from '../shared/category.cjs';
test('primary event purpose outranks incidental music', () => {
  assert.equal(categories.guessCategory("Blue Santa’s Dam 5 Miler and 5K", 'Sign in at the DJ booth'), 'sports');
  assert.equal(categories.guessCategory('San Marcos Flea Market', 'Live music, vendors and food trucks'), 'markets');
  assert.equal(categories.guessCategory('Summer Concert', 'Food and market vendors'), 'music');
  assert.equal(categories.guessCategory('Community Benefit', 'Gather with neighbors'), 'community');
  assert.equal(categories.guessCategory('Abandoned Places', 'Community gathering'), 'community');
});
