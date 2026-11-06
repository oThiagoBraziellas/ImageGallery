import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRandom, createImageSpec, generateSpecs, renderSvg, toDataUri, imageSrc, CATEGORIES } from '../src/images.js';

test('createRandom is deterministic and in [0, 1)', () => {
  const a = createRandom(42);
  const b = createRandom(42);
  const seq = Array.from({ length: 5 }, () => a());
  assert.deepEqual(seq, Array.from({ length: 5 }, () => b()));
  assert.ok(seq.every((n) => n >= 0 && n < 1));
  assert.notDeepEqual(seq, Array.from({ length: 5 }, createRandom(43)));
});

test('generateSpecs produces unique ids, cycling categories', () => {
  const specs = generateSpecs(12);
  assert.equal(new Set(specs.map((s) => s.id)).size, 12);
  assert.deepEqual(specs.slice(0, 6).map((s) => s.category), CATEGORIES);
  assert.equal(specs[6].category, CATEGORIES[0]);
  assert.deepEqual(generateSpecs(3), generateSpecs(3));
});

test('specs carry accessible text and sane dimensions', () => {
  const s = createImageSpec(0);
  assert.match(s.alt, /aurora/i);
  assert.match(s.title, /01$/);
  assert.ok(s.width >= 600 && s.height >= 600);
});

test('renderSvg builds a well-formed, deterministic SVG for every category', () => {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const spec = createImageSpec(i);
    const svg = renderSvg(spec);
    assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(svg.endsWith('</svg>'));
    assert.equal(svg, renderSvg(spec));
    assert.ok(!svg.includes('NaN'), `NaN found in ${spec.category}`);
  }
  assert.notEqual(renderSvg(createImageSpec(0)), renderSvg(createImageSpec(6)));
});

test('toDataUri/imageSrc produce an encoded SVG data URI with no raw angle brackets', () => {
  const uri = imageSrc(createImageSpec(2));
  assert.ok(uri.startsWith('data:image/svg+xml;charset=utf-8,'));
  assert.ok(!uri.includes('<'));
  assert.equal(decodeURIComponent(toDataUri('<svg/>').split(',')[1]), '<svg/>');
});
