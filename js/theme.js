// PROX PULSE — Theme toggle (dark/light)
(function () {
  const STORAGE_KEY = 'prox-theme';
  const html = document.documentElement;

  function getTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  }

  function applyTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem(STORAGE_KEY, t);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.textContent = t === 'dark' ? '☀' : '⬛';
  }

  // Apply on load before paint
  applyTheme(getTheme());

  window.toggleTheme = function () {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  };
})();
