import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lightboxReducer, initialLightbox, keyToAction, neighbours, swipeToAction } from '../src/lightbox.js';

const open = (index, total) => lightboxReducer(initialLightbox, { type: 'open', index, total });

test('open clamps the index and ignores empty lists', () => {
  assert.deepEqual(open(2, 5), { open: true, index: 2, total: 5 });
  assert.equal(open(99, 5).index, 4);
  assert.equal(open(-3, 5).index, 0);
  assert.equal(open(0, 0), initialLightbox);
});

test('next and prev wrap around', () => {
  assert.equal(lightboxReducer(open(4, 5), { type: 'next' }).index, 0);
  assert.equal(lightboxReducer(open(0, 5), { type: 'prev' }).index, 4);
  assert.equal(lightboxReducer(open(1, 5), { type: 'next' }).index, 2);
});

test('navigation is ignored while closed', () => {
  for (const type of ['next', 'prev', 'first', 'last', 'close']) {
    assert.equal(lightboxReducer(initialLightbox, { type }), initialLightbox);
  }
});

test('first, last and close', () => {
  assert.equal(lightboxReducer(open(3, 8), { type: 'first' }).index, 0);
  assert.equal(lightboxReducer(open(3, 8), { type: 'last' }).index, 7);
  assert.equal(lightboxReducer(open(3, 8), { type: 'close' }).open, false);
});

test('keyToAction maps the supported keys only', () => {
  assert.deepEqual(keyToAction('ArrowRight'), { type: 'next' });
  assert.deepEqual(keyToAction('ArrowLeft'), { type: 'prev' });
  assert.deepEqual(keyToAction('Escape'), { type: 'close' });
  assert.deepEqual(keyToAction('Home'), { type: 'first' });
  assert.deepEqual(keyToAction('End'), { type: 'last' });
  assert.equal(keyToAction('a'), null);
});

test('neighbours wraps and never includes the current index', () => {
  assert.deepEqual(neighbours(0, 5).sort(), [1, 4]);
  assert.deepEqual(neighbours(2, 5), [1, 3]);
  assert.deepEqual(neighbours(0, 1), []);
  assert.deepEqual(neighbours(0, 2), [1]);
  assert.deepEqual(neighbours(0, 0), []);
});

test('swipeToAction needs a long, mostly horizontal gesture', () => {
  assert.deepEqual(swipeToAction(-120, 10), { type: 'next' });
  assert.deepEqual(swipeToAction(120, -10), { type: 'prev' });
  assert.equal(swipeToAction(20, 0), null);
  assert.equal(swipeToAction(80, 120), null);
});
