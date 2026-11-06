/**
 * Calls `onVisible(element)` once, the first time an element nears the viewport.
 * Falls back to loading immediately when IntersectionObserver is unavailable.
 */
export function createLazyLoader(onVisible, { rootMargin = '200px', ObserverCtor = globalThis.IntersectionObserver } = {}) {
  if (typeof ObserverCtor !== 'function') {
    return { observe: (el) => onVisible(el), disconnect() {} };
  }
  const observer = new ObserverCtor((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        observer.unobserve(entry.target);
        onVisible(entry.target);
      }
    }
  }, { rootMargin });
  return { observe: (el) => observer.observe(el), disconnect: () => observer.disconnect() };
}
