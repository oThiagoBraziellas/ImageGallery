import { generateSpecs, imageSrc } from './images.js';
import { filterImages, categoryCounts } from './filter.js';
import { lightboxReducer, initialLightbox, keyToAction, neighbours, swipeToAction } from './lightbox.js';
import { createLazyLoader } from './lazy.js';

const ALL = generateSpecs(60);
const $ = (s) => document.querySelector(s);
const grid = $('#grid');
const chips = $('#chips');
const search = $('#search');
const countEl = $('#count');
const box = $('#lightbox');
const boxImg = $('#lb-img');
const boxTitle = $('#lb-title');
const boxPos = $('#lb-pos');

let category = 'All';
let visible = ALL;
let lb = initialLightbox;
let opener = null;
const srcCache = new Map();

const getSrc = (spec) => {
  if (!srcCache.has(spec.id)) srcCache.set(spec.id, imageSrc(spec));
  return srcCache.get(spec.id);
};

const lazy = createLazyLoader((img) => {
  const spec = ALL[Number(img.dataset.index)];
  img.src = getSrc(spec);
  img.addEventListener('load', () => img.closest('.tile').classList.add('loaded'), { once: true });
});

function renderChips() {
  chips.replaceChildren(...categoryCounts(ALL).map(({ name, count }) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (name === category ? ' on' : '');
    b.textContent = `${name} (${count})`;
    b.setAttribute('aria-pressed', String(name === category));
    b.addEventListener('click', () => { category = name; update(); });
    return b;
  }));
}

function renderGrid() {
  lazy.disconnect();
  grid.replaceChildren(...visible.map((spec, i) => {
    const li = document.createElement('li');
    li.className = 'tile';
    li.style.gridRowEnd = spec.height > spec.width ? 'span 2' : 'span 1';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Open ${spec.title}`);
    const img = document.createElement('img');
    img.alt = spec.alt;
    img.width = spec.width;
    img.height = spec.height;
    img.dataset.index = String(spec.id - 1);
    img.decoding = 'async';
    const cap = document.createElement('span');
    cap.className = 'cap';
    cap.textContent = spec.title;
    btn.append(img, cap);
    btn.addEventListener('click', () => openLightbox(i, btn));
    li.append(btn);
    lazy.observe(img);
    return li;
  }));
}

function update() {
  visible = filterImages(ALL, { category, query: search.value });
  countEl.textContent = `${visible.length} image${visible.length === 1 ? '' : 's'}`;
  renderChips();
  renderGrid();
  $('#none').hidden = visible.length > 0;
}

function showLightbox() {
  const spec = visible[lb.index];
  boxImg.src = getSrc(spec);
  boxImg.alt = spec.alt;
  boxTitle.textContent = spec.title;
  boxPos.textContent = `${lb.index + 1} / ${lb.total}`;
  for (const n of neighbours(lb.index, lb.total)) getSrc(visible[n]);
}

function dispatch(action) {
  const wasOpen = lb.open;
  lb = lightboxReducer(lb, action);
  if (lb.open && !wasOpen) {
    box.hidden = false;
    document.body.classList.add('locked');
    $('#lb-close').focus();
  } else if (!lb.open && wasOpen) {
    box.hidden = true;
    document.body.classList.remove('locked');
    opener?.focus();
  }
  if (lb.open) showLightbox();
}

function openLightbox(index, trigger) {
  opener = trigger;
  dispatch({ type: 'open', index, total: visible.length });
}

document.addEventListener('keydown', (e) => {
  if (!lb.open) return;
  if (e.key === 'Tab') {
    const focusable = [...box.querySelectorAll('button')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    return;
  }
  const action = keyToAction(e.key);
  if (action) { e.preventDefault(); dispatch(action); }
});
$('#lb-next').addEventListener('click', () => dispatch({ type: 'next' }));
$('#lb-prev').addEventListener('click', () => dispatch({ type: 'prev' }));
$('#lb-close').addEventListener('click', () => dispatch({ type: 'close' }));
box.addEventListener('click', (e) => { if (e.target === box || e.target.classList.contains('stage')) dispatch({ type: 'close' }); });

let touchStart = null;
box.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; touchStart = { x: t.clientX, y: t.clientY }; }, { passive: true });
box.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const action = swipeToAction(t.clientX - touchStart.x, t.clientY - touchStart.y);
  touchStart = null;
  if (action) dispatch(action);
}, { passive: true });

let timer;
search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(update, 120); });

update();
