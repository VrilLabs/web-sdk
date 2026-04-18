/*!
 * VRIL Web SDK v1.0.0 — CrystalWindow Engine
 * https://vril.li/sdk/v1/vril.js
 *
 * Usage:
 *   <link rel="stylesheet" href="/sdk/v1/vril.css">
 *   <script src="/sdk/v1/vril.js" defer></script>
 *   <script type="text/html" id="cwp-my-panel">
 *     <p>Panel content here.</p>
 *   </script>
 *   <button onclick="CrystalWindow.open('my-panel')">Open</button>
 *
 * Public API (window.CrystalWindow):
 *   .open(idOrOptions)   Open a panel by ID string or options object.
 *     Options: { id, title, badge, content, onOpen }
 *   .close()             Close the active panel.
 *   .isOpen()            Returns boolean — whether a panel is open.
 *   .currentPanel()      Returns the active panel ID or null.
 *   .register(id, desc)  Register a panel programmatically.
 *     desc: { html, title, badge }
 *
 * Events (dispatched on window):
 *   cw:open   — CustomEvent; detail: { id }
 *   cw:close  — CustomEvent
 *
 * Auto-bootstrap:
 *   If #cw-overlay and #crystalwindow are absent from the DOM, the SDK
 *   injects them on DOMContentLoaded. You may place them manually to control
 *   document order or customise ARIA labels.
 *
 * Template support:
 *   <script type="text/html" id="cwp-{panelId}"> ... </script>
 *   Panel HTML is read from .innerHTML of the matching template element.
 *
 * Compatibility tiers:
 *   TIER_1  CSS custom props + backdrop-filter + modern transitions (Chrome 76+, Safari 14+, FF 103+)
 *   TIER_2  CSS custom props + transitions, no backdrop-filter
 *   TIER_3  CSS transitions only, no custom props (IE11)
 *   TIER_4  JS class toggle only (IE9/10)
 *   All code is ES5-compatible.
 *
 * © 2026 VRIL LABS — MIT License
 */

(function (w, d) {
  'use strict';

  /* ── IDEMPOTENCY ──────────────────────────────────────────────── */
  if (w.CrystalWindow && w.CrystalWindow._vrilSdkVersion) return;

  /* ── FEATURE DETECTION ────────────────────────────────────────── */
  var CSS_PROPS = w.CSS && w.CSS.supports && w.CSS.supports('color', 'var(--t)');
  var RAF = w.requestAnimationFrame || w.mozRequestAnimationFrame ||
            w.webkitRequestAnimationFrame || w.msRequestAnimationFrame ||
            function (cb) { return w.setTimeout(cb, 16); };
  var TOUCH = ('ontouchstart' in w) || (w.navigator && w.navigator.maxTouchPoints > 0);

  /* ── STATE ────────────────────────────────────────────────────── */
  var panels       = {};
  var activePanel  = null;
  var lastFocus    = null;
  var touchStartY  = 0;
  var touchStartTime = 0;
  var isDragging   = false;

  /* ── DOM REFS (resolved lazily or after bootstrap) ────────────── */
  var $cw, $overlay, $inner, $body, $title, $badgeTxt, $close, $handle;

  function resolveDOM() {
    $cw       = d.getElementById('crystalwindow');
    $overlay  = d.getElementById('cw-overlay');
    $inner    = d.getElementById('cw-inner');
    $body     = d.getElementById('cw-body');
    $title    = d.getElementById('cw-title');
    $badgeTxt = d.getElementById('cw-badge-txt');
    $close    = d.getElementById('cw-close');
    $handle   = d.getElementById('cw-handle');
  }

  /* ── AUTO-BOOTSTRAP DOM ───────────────────────────────────────── */
  function injectDOM() {
    var existingCW = d.getElementById('crystalwindow');
    var existingOverlay = d.getElementById('cw-overlay');

    /* Inject #crystalwindow if absent */
    if (!existingCW) {
      var cw = d.createElement('div');
      cw.id = 'crystalwindow';
      cw.setAttribute('role', 'dialog');
      cw.setAttribute('aria-modal', 'true');
      cw.setAttribute('aria-labelledby', 'cw-title');
      cw.setAttribute('aria-describedby', 'cw-desc');
      cw.setAttribute('tabindex', '-1');
      cw.style.top = 'var(--cw-nav-h)';

      cw.innerHTML =
        '<div class="cw-glass">' +
          '<div class="cw-handle" id="cw-handle" role="button" tabindex="0" aria-label="Drag up or click to close">' +
            '<div class="cw-handle-bar"></div>' +
          '</div>' +
          '<div class="cw-inner" id="cw-inner">' +
            '<div class="cw-header">' +
              '<div class="cw-title-row">' +
                '<div class="cw-badge" aria-live="polite">' +
                  '<span class="cw-badge-dot" aria-hidden="true"></span>' +
                  '<span id="cw-badge-txt">CrystalWindow</span>' +
                '</div>' +
                '<h2 class="cw-title" id="cw-title">CrystalWindow</h2>' +
              '</div>' +
              '<button class="cw-close" id="cw-close" aria-label="Close panel" type="button">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">' +
                  '<line x1="18" y1="6" x2="6" y2="18"/>' +
                  '<line x1="6" y1="6" x2="18" y2="18"/>' +
                '</svg>' +
              '</button>' +
            '</div>' +
            '<div class="cw-body" id="cw-body" role="region" aria-label="Panel content">' +
              '<p id="cw-desc" class="sr-only">Interactive panel. Press Escape or the close button to dismiss.</p>' +
            '</div>' +
          '</div>' +
          '<div class="cw-reflect" aria-hidden="true"></div>' +
        '</div>';

      d.body.insertBefore(cw, d.body.firstChild);
      existingCW = cw;
    }

    /* Inject #cw-overlay if absent (insert before #crystalwindow) */
    if (!existingOverlay) {
      var overlay = d.createElement('div');
      overlay.id = 'cw-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      d.body.insertBefore(overlay, existingCW);
    }
  }

  /* ── PANEL CONTENT RESOLUTION ─────────────────────────────────── */
  /* Priority: registered html > cwp template html
     Metadata : registered title/badge > cwp data-title/data-badge > id */
  function getContent(id) {
    var reg = panels[id] || {};
    var tpl = d.getElementById('cwp-' + id);

    var html  = reg.html || (tpl ? tpl.innerHTML : null);
    var title = reg.title || (tpl && tpl.getAttribute('data-title')) || null;
    var badge = reg.badge || (tpl && tpl.getAttribute('data-badge')) || null;

    if (!html && !title && !badge) return null;

    return { html: html || '', title: title, badge: badge };
  }

  /* ── FOCUS TRAP ────────────────────────────────────────────────── */
  var FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function trapFocus(e) {
    if (!$cw || !$cw.classList.contains('open')) return;
    var els = $cw.querySelectorAll(FOCUSABLE);
    if (!els.length) return;
    var first = els[0];
    var last  = els[els.length - 1];
    if (e.shiftKey) {
      if (d.activeElement === first) { last.focus(); e.preventDefault(); }
    } else {
      if (d.activeElement === last)  { first.focus(); e.preventDefault(); }
    }
  }

  /* ── ANNOUNCE TO SCREEN READERS ────────────────────────────────── */
  function announce(msg) {
    var live = d.getElementById('cw-live-region');
    if (!live) {
      live = d.createElement('div');
      live.id = 'cw-live-region';
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      live.className = 'sr-only';
      d.body.appendChild(live);
    }
    live.textContent = msg;
  }

  /* ── OPEN ──────────────────────────────────────────────────────── */
  function open(idOrOptions) {
    if (!$cw) resolveDOM();

    var opts    = (typeof idOrOptions === 'string') ? { id: idOrOptions } : idOrOptions;
    var id      = opts.id || 'unknown';
    var title   = opts.title || id;
    var badge   = opts.badge || 'Panel';
    var content = opts.content;

    if (!content) {
      var p = getContent(id);
      if (p) {
        content = p.html;
        if (!opts.title && p.title) title = p.title;
        if (!opts.badge && p.badge) badge = p.badge;
      } else {
        content = '<p style="color:var(--tx-m,#7a8aa8);font-size:var(--text-sm,1rem);padding:2rem 0">Panel \'' + id + '\' not registered.</p>';
      }
    }

    if ($title)    $title.textContent    = title;
    if ($badgeTxt) $badgeTxt.textContent = badge;
    if ($body)     $body.innerHTML       = content;
    if ($inner)    $inner.scrollTop      = 0;

    lastFocus = d.activeElement;

    if ($overlay) {
      $overlay.removeAttribute('aria-hidden');
      $overlay.classList.add('active');
    }

    if ($cw) {
      $cw.classList.remove('closing');
      var _ = $cw.offsetHeight; /* force reflow so CSS transition fires */
      $cw.classList.add('open');
      $cw.removeAttribute('aria-hidden');
      $cw.setAttribute('aria-label', title);
      RAF(function () { if ($cw) $cw.focus(); });
    }

    activePanel = id;

    var scrollY = w.scrollY || w.pageYOffset || 0;
    d.body.style.position  = 'fixed';
    d.body.style.top       = '-' + scrollY + 'px';
    d.body.style.left      = '0';
    d.body.style.right     = '0';
    d.body.style.overflowY = 'scroll';

    try {
      w.dispatchEvent(new CustomEvent('cw:open', { detail: { id: id } }));
    } catch (err) {
      var evt = d.createEvent('CustomEvent');
      evt.initCustomEvent('cw:open', true, true, { id: id });
      w.dispatchEvent(evt);
    }

    announce(title + ' panel opened');

    if (typeof opts.onOpen === 'function') opts.onOpen();
  }

  /* ── CLOSE ─────────────────────────────────────────────────────── */
  function close() {
    if (!$cw) return;

    var closingId = activePanel;

    if ($overlay) {
      $overlay.classList.remove('active');
      $overlay.setAttribute('aria-hidden', 'true');
    }

    /* Detect prefers-reduced-motion: skip animation delay entirely */
    var reducedMotion = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function finishClose() {
      if (!$cw) return;
      $cw.classList.remove('open', 'closing');
      $cw.setAttribute('aria-hidden', 'true');

      var scrollY = parseInt(d.body.style.top || '0', 10) * -1;
      d.body.style.position  = '';
      d.body.style.top       = '';
      d.body.style.left      = '';
      d.body.style.right     = '';
      d.body.style.overflowY = '';
      w.scrollTo(0, scrollY);

      if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
      activePanel = null;
      announce('Panel closed');

      try {
        w.dispatchEvent(new CustomEvent('cw:close', { detail: { id: closingId } }));
      } catch (err) {
        var evt = d.createEvent('CustomEvent');
        evt.initCustomEvent('cw:close', true, true, { id: closingId });
        w.dispatchEvent(evt);
      }
    }

    if (reducedMotion) {
      $cw.classList.remove('open');
      finishClose();
    } else {
      $cw.classList.add('closing');

      var duration = CSS_PROPS
        ? parseInt(getComputedStyle(d.documentElement).getPropertyValue('--t-slow') || '400', 10)
        : 400;

      w.setTimeout(finishClose, duration + 50);
    }
  }

  /* ── TOUCH SWIPE TO CLOSE ──────────────────────────────────────── */
  function initTouch() {
    if (!$handle || !TOUCH) return;

    $handle.addEventListener('touchstart', function (e) {
      touchStartY    = e.touches[0].clientY;
      touchStartTime = Date.now();
      isDragging     = true;
    }, { passive: true });

    $handle.addEventListener('touchmove', function (e) {
      if (!isDragging || !$cw) return;
      var dy = e.touches[0].clientY - touchStartY;
      if (dy < 0) return;
      var clamped = Math.min(dy, 200);
      $cw.style.transform  = 'translateY(-' + clamped + 'px)';
      $cw.style.opacity    = String(1 - clamped / 300);
      $cw.style.transition = 'none';
    }, { passive: true });

    $handle.addEventListener('touchend', function (e) {
      isDragging = false;
      if (!$cw) return;
      $cw.style.transform  = '';
      $cw.style.opacity    = '';
      $cw.style.transition = '';
      var dy       = e.changedTouches[0].clientY - touchStartY;
      var dt       = Date.now() - touchStartTime;
      var velocity = dy / Math.max(dt, 1);
      if (dy > 120 || velocity > 0.5) close();
    }, { passive: true });
  }

  /* ── KEYBOARD EVENTS ────────────────────────────────────────────── */
  d.addEventListener('keydown', function (e) {
    var key = e.key || e.keyCode;
    if ((key === 'Escape' || key === 27) && activePanel) { e.preventDefault(); close(); }
    if ((key === 'Tab'    || key === 9)  && activePanel) { trapFocus(e); }
  });

  /* ── OVERLAY CLICK ──────────────────────────────────────────────── */
  function initOverlayClick() {
    if (!$overlay) return;
    $overlay.addEventListener('click', function (e) {
      if (e.target === $overlay) close();
    });
  }

  /* ── CLOSE BUTTON ───────────────────────────────────────────────── */
  function initCloseBtn() {
    if (!$close) return;
    $close.addEventListener('click', close);
  }

  /* ── HANDLE KEYBOARD ────────────────────────────────────────────── */
  function initHandleKeyboard() {
    if (!$handle) return;
    $handle.addEventListener('keydown', function (e) {
      var key = e.key || e.keyCode;
      if (key === 'Enter' || key === 13 || key === ' ' || key === 32) {
        e.preventDefault();
        close();
      }
    });
    $handle.addEventListener('click', function () { close(); });
  }

  /* ── PUBLIC API ─────────────────────────────────────────────────── */
  w.CrystalWindow = {
    _vrilSdkVersion: '1.0.0',
    open:         open,
    close:        close,
    isOpen:       function () { return activePanel !== null; },
    currentPanel: function () { return activePanel; },
    register:     function (id, descriptor) { panels[id] = descriptor; }
  };

  /* ── BOOT ───────────────────────────────────────────────────────── */
  function boot() {
    injectDOM();
    resolveDOM();
    initOverlayClick();
    initCloseBtn();
    initHandleKeyboard();
    initTouch();
  }

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

}(window, document));
