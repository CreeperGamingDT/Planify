const THEME_KEY = 'planify_theme';

function applyTheme(isDark) {
  document.body.classList.toggle('theme-dark', isDark);
}

function initThemeToggle() {
  const toggle = document.getElementById('darkModeToggle');
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = stored ? stored === 'dark' : prefersDark;

  applyTheme(isDark);

  if (toggle) {
    toggle.checked = isDark;
    toggle.addEventListener('change', () => {
      const next = toggle.checked;
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    });
  }
}

document.addEventListener('DOMContentLoaded', initThemeToggle);
