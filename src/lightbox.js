/** Pure lightbox state machine. `index` is a position in the currently visible list. */

export const initialLightbox = Object.freeze({ open: false, index: 0, total: 0 });

const wrap = (i, n) => ((i % n) + n) % n;

export function lightboxReducer(state, action) {
  switch (action.type) {
    case 'open': {
      const total = action.total ?? 0;
      if (total <= 0) return state;
      const index = Math.min(Math.max(action.index ?? 0, 0), total - 1);
      return { open: true, index, total };
    }
    case 'close':
      return state.open ? { ...state, open: false } : state;
    case 'next':
      return state.open && state.total > 0 ? { ...state, index: wrap(state.index + 1, state.total) } : state;
    case 'prev':
      return state.open && state.total > 0 ? { ...state, index: wrap(state.index - 1, state.total) } : state;
    case 'first':
      return state.open ? { ...state, index: 0 } : state;
    case 'last':
      return state.open ? { ...state, index: Math.max(state.total - 1, 0) } : state;
    default:
      return state;
  }
}

/** Maps a keyboard key to a lightbox action (or null). */
export function keyToAction(key) {
  switch (key) {
    case 'ArrowRight': return { type: 'next' };
    case 'ArrowLeft': return { type: 'prev' };
    case 'Home': return { type: 'first' };
    case 'End': return { type: 'last' };
    case 'Escape': return { type: 'close' };
    default: return null;
  }
}

/** Indexes worth preloading around the current one (wrapping, no duplicates). */
export function neighbours(index, total, radius = 1) {
  const out = new Set();
  for (let d = -radius; d <= radius; d++) if (d !== 0 && total > 0) out.add(wrap(index + d, total));
  out.delete(index);
  return [...out];
}

/** Horizontal swipe -> action. Ignores mostly-vertical or short gestures. */
export function swipeToAction(dx, dy, threshold = 50) {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return null;
  return { type: dx < 0 ? 'next' : 'prev' };
}
