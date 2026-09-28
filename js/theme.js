/* Light/dark toggle. The stored theme is applied by a small inline script in
   <head> so the page never paints the wrong theme first; this file only wires
   up the button. Every localStorage access is guarded — it throws in private
   windows and when site data is blocked. */
(function () {
  'use strict';

  var btn = document.getElementById('theme-toggle');
  if (!btn) { return; }

  function effectiveTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') { return attr; }
    try {
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches) ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function applyLabel(theme) {
    btn.textContent = theme === 'dark' ? 'DAY' : 'NIGHT';
  }

  applyLabel(effectiveTheme());

  /* While no explicit choice is stored the page follows the system theme, so
     the label has to follow it too — otherwise it goes stale when someone
     switches their OS appearance with the page already open. */
  try {
    var mq = window.matchMedia('(prefers-color-scheme:dark)');
    var onSchemeChange = function () {
      if (!document.documentElement.getAttribute('data-theme')) {
        applyLabel(effectiveTheme());
      }
    };
    if (mq.addEventListener) { mq.addEventListener('change', onSchemeChange); }
    else if (mq.addListener) { mq.addListener(onSchemeChange); }
  } catch (e) {}

  btn.addEventListener('click', function () {
    var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('seppi-theme', next); } catch (e) {}
    applyLabel(next);
  });
})();
