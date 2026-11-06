import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterImages, categoryCounts } from '../src/filter.js';
import { createLazyLoader } from '../src/lazy.js';
import { generateSpecs } from '../src/images.js';

const specs = generateSpecs(12);

test('filterImages by category, text and both', () => {
  assert.equal(filterImages(specs).length, 12);
  assert.equal(filterImages(specs, { category: 'Ocean' }).length, 2);
  assert.equal(filterImages(specs, { query: 'study 03' }).length, 1);
  assert.equal(filterImages(specs, { query: 'OCEAN' }).length, 2);
  assert.equal(filterImages(specs, { category: 'Ocean', query: 'forest' }).length, 0);
});

test('filterImages ignores accents and surrounding spaces', () => {
  const items = [{ title: 'Café morning', category: 'Geometry' }];
  assert.equal(filterImages(items, { query: '  cafe ' }).length, 1);
});

test('categoryCounts starts with All and keeps first-seen order', () => {
  const counts = categoryCounts(specs);
  assert.deepEqual(counts[0], { name: 'All', count: 12 });
  assert.equal(counts.length, 7);
  assert.equal(counts[1].name, 'Aurora');
  assert.ok(counts.slice(1).every((c) => c.count === 2));
});

class FakeObserver {
  static last;
  constructor(cb, options) { this.cb = cb; this.options = options; this.watched = new Set(); FakeObserver.last = this; }
  observe(el) { this.watched.add(el); }
  unobserve(el) { this.watched.delete(el); }
  disconnect() { this.watched.clear(); }
  fire(el, isIntersecting) { this.cb([{ target: el, isIntersecting }]); }
}

test('lazy loader fires once, only when intersecting, then stops observing', () => {
  const seen = [];
  const loader = createLazyLoader((el) => seen.push(el), { ObserverCtor: FakeObserver, rootMargin: '50px' });
  const el = { id: 'a' };
  loader.observe(el);
  assert.equal(FakeObserver.last.options.rootMargin, '50px');
  FakeObserver.last.fire(el, false);
  assert.deepEqual(seen, []);
  FakeObserver.last.fire(el, true);
  assert.deepEqual(seen, [el]);
  assert.equal(FakeObserver.last.watched.has(el), false);
});

test('lazy loader falls back to eager loading without IntersectionObserver', () => {
  const seen = [];
  const loader = createLazyLoader((el) => seen.push(el), { ObserverCtor: undefined });
  loader.observe('x');
  assert.deepEqual(seen, ['x']);
});
