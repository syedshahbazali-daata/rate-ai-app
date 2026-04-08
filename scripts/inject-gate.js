#!/usr/bin/env node
/**
 * Injects the site password gate into dist/index.html after expo export.
 * Run via: node scripts/inject-gate.js
 */
const fs = require('fs');
const path = require('path');

const distHtml = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(distHtml, 'utf8');

// Guard: skip if already injected
if (html.includes('pw-gate')) {
  console.log('⚠ Gate already present — skipping.');
  process.exit(0);
}

const GATE_STYLE = `
  <!-- ── Site Password Gate ──────────────────────────────────────────────── -->
  <style>
    #pw-gate {
      position: fixed; inset: 0; background: #fff;
      z-index: 2147483647; display: flex;
      align-items: center; justify-content: center;
    }
  </style>`;

const GATE_SCRIPT = `
  <script>
  (function () {
    var REAL_TITLE = 'Rate AI';
    var LS_KEY = 'ateam_access';
    var FS_URL = 'https://firestore.googleapis.com/v1/projects/gen-lang-client-0799600946/databases/ai-studio-934be5ac-fb1f-47e7-a89d-cbc72af93b11/documents/settings/site?key=__FIREBASE_API_KEY__';
    var FALLBACK_PW = 'rate123';

    function fetchPw(cb) {
      fetch(FS_URL)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          cb((d.fields && d.fields.password && d.fields.password.stringValue) || FALLBACK_PW);
        })
        .catch(function () { cb(FALLBACK_PW); });
    }

    function unlock() {
      var el = document.getElementById('pw-gate');
      if (el) el.remove();
      document.title = REAL_TITLE;
      var fav = document.getElementById('site-favicon');
      if (fav) fav.href = '/favicon.ico';
    }

    var cached = localStorage.getItem(LS_KEY);
    if (cached) {
      fetchPw(function (pw) {
        if (cached === pw) { unlock(); }
        else { localStorage.removeItem(LS_KEY); showGate(); }
      });
    } else {
      showGate();
    }

    function showGate() {
      document.addEventListener('DOMContentLoaded', function () {
        var gate = document.createElement('div');
        gate.id = 'pw-gate';
        gate.innerHTML =
          '<div style="width:100%;max-width:380px;padding:40px 32px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,\\'Segoe UI\\',sans-serif;">' +
          '<div style="width:52px;height:52px;background:#161a1d;border-radius:14px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>' +
          '<h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#161a1d;letter-spacing:0.5px;">PROTECTED ACCESS</h1>' +
          '<p style="margin:0 0 28px;font-size:14px;color:#6b7280;">Enter the password to continue.</p>' +
          '<input id="pw-inp" type="password" placeholder="Password" autocomplete="current-password" style="display:block;width:100%;padding:13px 16px;border:1.5px solid #e5e7eb;border-radius:8px;font-size:15px;box-sizing:border-box;outline:none;margin-bottom:10px;color:#111;background:#fafafa;" />' +
          '<div id="pw-err" style="color:#dc2626;font-size:13px;margin-bottom:10px;display:none;">Incorrect password. Please try again.</div>' +
          '<button id="pw-btn" style="width:100%;padding:13px;background:#161a1d;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.5px;">ACCESS SITE</button>' +
          '</div>';
        document.body.appendChild(gate);

        var inp = document.getElementById('pw-inp');
        var btn = document.getElementById('pw-btn');
        var err = document.getElementById('pw-err');

        function tryAuth() {
          var val = inp.value.trim();
          if (!val) return;
          btn.disabled = true;
          btn.textContent = 'Checking\u2026';
          err.style.display = 'none';
          fetchPw(function (pw) {
            if (val === pw) {
              localStorage.setItem(LS_KEY, pw);
              unlock();
            } else {
              err.style.display = 'block';
              inp.value = '';
              btn.disabled = false;
              btn.textContent = 'ACCESS SITE';
              inp.focus();
            }
          });
        }

        btn.addEventListener('click', tryAuth);
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryAuth(); });
        inp.addEventListener('focus', function () { inp.style.borderColor = '#161a1d'; });
        inp.addEventListener('blur', function () { inp.style.borderColor = '#e5e7eb'; });
        setTimeout(function () { inp.focus(); }, 100);
      });
    }
  })();
  </script>`;

// 1. Blank the title
html = html.replace('<title>Rate AI</title>', '<title></title>');

// 2. Replace favicon with blank 1x1 transparent PNG, add id so JS can restore it
const BLANK_FAVICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=';
html = html.replace(
  '<link rel="icon" href="/favicon.ico" />',
  `<link id="site-favicon" rel="icon" href="${BLANK_FAVICON}" />`
);

// 3. Inject gate style + script just before </head>
html = html.replace('</head>', GATE_STYLE + GATE_SCRIPT + '\n</head>');

// 4. Replace API key placeholder with env var
const apiKey = process.env.FIREBASE_API_KEY;
if (!apiKey) {
  console.error('✗ FIREBASE_API_KEY environment variable is not set.');
  process.exit(1);
}
html = html.replace('__FIREBASE_API_KEY__', apiKey);

fs.writeFileSync(distHtml, html, 'utf8');
console.log('✓ Password gate injected into dist/index.html');
