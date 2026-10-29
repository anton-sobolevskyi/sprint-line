/**
 * Hides the static `#sl-boot-loader` splash from `index.html`.
 * Safe to call multiple times (e.g. initializer + bootstrap error path).
 */
export function hideBootLoader(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const loader = document.getElementById('sl-boot-loader');
  if (!loader || loader.classList.contains('sl-boot-loader--hide')) {
    return;
  }

  loader.classList.add('sl-boot-loader--hide');
  loader.setAttribute('aria-busy', 'false');

  window.setTimeout(() => {
    loader.remove();
  }, 300);
}
