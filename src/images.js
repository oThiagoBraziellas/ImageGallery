/** Deterministic, offline image generation: every picture is an SVG encoded as a data URI. */

export const CATEGORIES = ['Aurora', 'Dunes', 'Forest', 'Ocean', 'Peaks', 'Geometry'];

/** Small seeded PRNG (mulberry32): same seed, same sequence. */
export function createRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZES = [[800, 600], [600, 800], [800, 800], [900, 600]];

const PALETTES = {
  Aurora: [200, 280],
  Dunes: [20, 45],
  Forest: [110, 160],
  Ocean: [185, 225],
  Peaks: [215, 250],
  Geometry: [320, 360],
};

/** Metadata for the nth image. Cheap: no SVG is built here. */
export function createImageSpec(index, baseSeed = 2026) {
  const rand = createRandom(baseSeed + index * 7919);
  const category = CATEGORIES[index % CATEGORIES.length];
  const [w, h] = SIZES[Math.floor(rand() * SIZES.length)];
  return {
    id: index + 1,
    seed: baseSeed + index * 104729,
    category,
    width: w,
    height: h,
    title: `${category} study ${String(index + 1).padStart(2, '0')}`,
    alt: `Abstract ${category.toLowerCase()} illustration number ${index + 1}`,
  };
}

export function generateSpecs(count, baseSeed = 2026) {
  return Array.from({ length: count }, (_, i) => createImageSpec(i, baseSeed));
}

const hsl = (h, s, l) => `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;

function scene(category, rand, w, h, hueA, hueB) {
  const parts = [];
  const pick = (lo, hi) => lo + rand() * (hi - lo);
  switch (category) {
    case 'Aurora':
      for (let i = 0; i < 4; i++) {
        const y = pick(0.2, 0.6) * h;
        const hue = pick(hueA, hueB);
        parts.push(`<path d="M0 ${y} C ${w * 0.3} ${y - pick(40, 160)}, ${w * 0.6} ${y + pick(40, 160)}, ${w} ${y - 30} L ${w} ${y + 120} C ${w * 0.6} ${y + 200}, ${w * 0.3} ${y + 60}, 0 ${y + 140} Z" fill="${hsl(hue, 80, 60)}" opacity="${pick(0.25, 0.5).toFixed(2)}"/>`);
      }
      for (let i = 0; i < 30; i++) parts.push(`<circle cx="${pick(0, w).toFixed(0)}" cy="${pick(0, h * 0.5).toFixed(0)}" r="${pick(0.8, 2.2).toFixed(1)}" fill="#fff" opacity="0.8"/>`);
      break;
    case 'Dunes':
      parts.push(`<circle cx="${pick(0.2, 0.8) * w}" cy="${pick(0.15, 0.3) * h}" r="${pick(40, 70)}" fill="${hsl(hueA - 5, 90, 80)}"/>`);
      for (let i = 0; i < 4; i++) {
        const y = h * (0.5 + i * 0.13);
        parts.push(`<path d="M0 ${y} Q ${w * pick(0.2, 0.4)} ${y - pick(40, 110)} ${w * 0.6} ${y} T ${w} ${y - 10} V ${h} H 0 Z" fill="${hsl(pick(hueA, hueB), 70, 62 - i * 11)}"/>`);
      }
      break;
    case 'Forest':
      for (let layer = 0; layer < 3; layer++) {
        for (let i = 0; i < 9; i++) {
          const x = pick(-20, w + 20);
          const base = h * (0.65 + layer * 0.12);
          const th = pick(120, 220) * (1 + layer * 0.15);
          const tw = th * 0.45;
          parts.push(`<path d="M${x} ${base - th} L${x + tw / 2} ${base} L${x - tw / 2} ${base} Z" fill="${hsl(pick(hueA, hueB), 45, 38 - layer * 10)}"/>`);
        }
      }
      break;
    case 'Ocean':
      for (let i = 0; i < 6; i++) {
        const y = h * (0.35 + i * 0.11);
        const amp = pick(10, 28);
        parts.push(`<path d="M0 ${y} q ${w / 8} ${-amp} ${w / 4} 0 t ${w / 4} 0 t ${w / 4} 0 t ${w / 4} 0 V ${h} H0 Z" fill="${hsl(pick(hueA, hueB), 70, 55 - i * 7)}" opacity="0.9"/>`);
      }
      parts.push(`<circle cx="${pick(0.2, 0.8) * w}" cy="${h * 0.2}" r="34" fill="${hsl(45, 95, 82)}"/>`);
      break;
    case 'Peaks':
      for (let layer = 0; layer < 3; layer++) {
        let d = `M0 ${h}`;
        const base = h * (0.45 + layer * 0.15);
        for (let x = 0; x <= w; x += w / 6) d += ` L${x.toFixed(0)} ${(base - pick(20, 160) + layer * 20).toFixed(0)}`;
        d += ` L${w} ${h} Z`;
        parts.push(`<path d="${d}" fill="${hsl(pick(hueA, hueB), 35, 50 - layer * 14)}"/>`);
      }
      break;
    default:
      for (let i = 0; i < 14; i++) {
        const size = pick(60, 220);
        const x = pick(0, w), y = pick(0, h);
        const fill = hsl(pick(hueA, hueB + 20), 75, pick(45, 70));
        const op = pick(0.45, 0.85).toFixed(2);
        if (i % 3 === 0) parts.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(size / 2).toFixed(0)}" fill="${fill}" opacity="${op}"/>`);
        else if (i % 3 === 1) parts.push(`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${size.toFixed(0)}" height="${size.toFixed(0)}" fill="${fill}" opacity="${op}" transform="rotate(${pick(0, 90).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`);
        else parts.push(`<path d="M${x.toFixed(0)} ${y.toFixed(0)} l${size.toFixed(0)} 0 l${(-size / 2).toFixed(0)} ${(-size * 0.86).toFixed(0)} z" fill="${fill}" opacity="${op}"/>`);
      }
  }
  return parts.join('');
}

export function renderSvg(spec) {
  const rand = createRandom(spec.seed);
  const [hueA, hueB] = PALETTES[spec.category] ?? [200, 260];
  const { width: w, height: h } = spec;
  const top = hsl(hueA, 55, spec.category === 'Aurora' ? 10 : 70);
  const bottom = hsl(hueB, 60, spec.category === 'Aurora' ? 22 : 45);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`,
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>`,
    `<rect width="${w}" height="${h}" fill="url(#g)"/>`,
    scene(spec.category, rand, w, h, hueA, hueB),
    `</svg>`,
  ].join('');
}

export function toDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function imageSrc(spec) {
  return toDataUri(renderSvg(spec));
}
