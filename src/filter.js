const strip = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function filterImages(images, { category = 'All', query = '' } = {}) {
  const q = strip(query).trim();
  return images.filter((img) => {
    if (category !== 'All' && img.category !== category) return false;
    return !q || strip(img.title).includes(q) || strip(img.category).includes(q);
  });
}

/** [{ name: 'All', count }, ...] in first-seen order. */
export function categoryCounts(images) {
  const map = new Map();
  for (const img of images) map.set(img.category, (map.get(img.category) ?? 0) + 1);
  return [{ name: 'All', count: images.length }, ...[...map].map(([name, count]) => ({ name, count }))];
}
