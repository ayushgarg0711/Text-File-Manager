(function () {
  var KEY = 'fileforge_files_v2', OLD = 'fileforge_files_v1';
  var OPS = [['Create', '✦'], ['Read', '◎'], ['Update', '⟳'], ['Delete', '✕']];
  var files = {};
  var memoryOnly = false;
  var S = { op: 'Create', sel: '', action: 'Rename', msg: null, q: '', draft: { n: '', c: '' } };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function bytes(s) { return new TextEncoder().encode(s).length; }
  function fmt(n) { return n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB'; }
  function lines(s) { return s ? s.split('\n').length : 0; }
  function ago(t) {
    var s = Math.max(0, Math.floor((Date.now() - t) / 1000));
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    return Math.floor(s / 86400) + ' d ago';
  }
  function names() { return Object.keys(files).sort(function (a, b) { return a.localeCompare(b); }); }
  function ensureSel() { if (!files.hasOwnProperty(S.sel)) S.sel = names()[0] || ''; }
  function say(type, text) { S.msg = { type: type, text: text }; }
  function msgHtml(flush) {
    if (!S.msg) return '';
    var icon = { success: '✓', error: '✗', info: 'ℹ' }[S.msg.type];
    return '<div class="msg msg-' + S.msg.type + (flush ? ' flush' : '') + '" role="status"><span>' + icon + '</span><span>' + esc(S.msg.text) + '</span></div>';
  }
  function nameProblem(n) {
    if (!n) return 'Please enter a file name.';
    if (/[\/\\]/.test(n)) return 'File names cannot contain slashes.';
    if (n.length > 80) return 'File names can be at most 80 characters.';
    return '';
  }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(files)); } catch (e) { memoryOnly = true; } }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { files = JSON.parse(raw) || {}; return; }
      var old = localStorage.getItem(OLD);
      if (old) {
        var o = JSON.parse(old) || {};
        Object.keys(o).forEach(function (k) { files[k] = { c: o[k], t: Date.now() }; });
        save(); return;
      }
    } catch (e) { memoryOnly = true; }
    var now = Date.now();
    files = {
      'welcome.txt': { c: 'Welcome to Text File Manager.\nCreate, read, update and delete text files right here.\nFiles are saved in this browser.', t: now - 5 * 3600e3 },
      'shopping-list.txt': { c: 'rice\nlentils\nmustard oil\ntea', t: now - 26 * 3600e3 }
    };
    save();
  }

  /* ---------- hero stats, tabs, sidebar ---------- */
  function renderStats() {
    var list = names(), total = 0;
    list.forEach(function (n) { total += bytes(files[n].c); });
    $('stats').innerHTML = '<span class="stat"><b>' + list.length + '</b> file' + (list.length === 1 ? '' : 's') + '</span>' +
      '<span class="stat"><b>' + fmt(total) + '</b> stored</span>';
    $('count').textContent = list.length + ' total';
    var note = $('note');
    note.className = 'side-note' + (memoryOnly ? ' warn' : '');
    note.textContent = memoryOnly ? 'Browser storage is unavailable. Files will be lost when you leave this page.' : 'Saved in this browser.';
  }
  function renderTabs() {
    $('tabs').innerHTML = OPS.map(function (o) {
      return '<button class="tab" role="tab" id="tab-' + o[0] + '" aria-selected="' + (S.op === o[0]) + '" data-op="' + o[0] + '">' + o[1] + ' ' + o[0] + '</button>';
    }).join('');
    Array.prototype.forEach.call($('tabs').children, function (b) {
      b.addEventListener('click', function () { S.op = b.getAttribute('data-op'); S.msg = null; render(); });
    });
  }
  function renderList() {
    var q = S.q.trim().toLowerCase();
    var list = names().filter(function (n) { return !q || n.toLowerCase().indexOf(q) !== -1; });
    var el = $('list');
    if (!list.length) {
      el.innerHTML = '<li class="list-empty">' + (names().length ? 'No files match “' + esc(S.q.trim()) + '”.' : 'No files yet. Create your first one.') + '</li>';
      return;
    }
    el.innerHTML = list.map(function (n) {
      var on = n === S.sel;
      return '<li><button class="file' + (on ? ' on' : '') + '" data-name="' + esc(n) + '" aria-pressed="' + on + '">' +
        '<span class="f-name">' + esc(n) + '</span><span class="f-meta">' + fmt(bytes(files[n].c)) + ' · ' + ago(files[n].t) + '</span></button></li>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.file'), function (b) {
      b.addEventListener('click', function () {
        S.sel = b.getAttribute('data-name');
        if (S.op === 'Create') S.op = 'Read';
        S.msg = null; render();
      });
    });
  }

  /* ---------- panel ---------- */
  function target() {
    var f = files[S.sel];
    return '<div class="target"><span class="t-label">Selected file</span><span class="t-name">' + esc(S.sel) + '</span>' +
      '<span class="t-meta">' + fmt(bytes(f.c)) + ' · ' + lines(f.c) + ' line' + (lines(f.c) === 1 ? '' : 's') + ' · edited ' + ago(f.t) + '</span></div>';
  }
  function renderPanel() {
    ensureSel();
    var icon = OPS.filter(function (o) { return o[0] === S.op; })[0][1];
    var h = '<h2 class="panel-title"><span>' + icon + '</span> ' + S.op + ' File</h2>';

    if (S.op === 'Create') {
      h += '<div class="field"><label for="c-name">File name</label><input type="text" id="c-name" placeholder="e.g.  notes.txt" autocomplete="off" value="' + esc(S.draft.n) + '"></div>' +
        '<div class="field"><div class="field-row"><label for="c-content">File content</label><span class="counter" id="c-count"></span></div>' +
        '<textarea id="c-content" placeholder="Start writing…"></textarea></div>' +
        '<button class="btn" id="c-go">Create File</button>' + msgHtml();
    } else if (!S.sel) {
      h += '<div class="empty"><strong>No files yet</strong>Switch to Create and make your first file.</div>' + msgHtml();
    } else if (S.op === 'Read') {
      h += target();
      if (files[S.sel].c.trim()) {
        h += '<div class="viewer"><div class="viewer-bar"><span class="legend">Contents</span><button class="ghost" id="r-copy">Copy</button></div><pre class="file-content" id="r-out"></pre></div>';
      } else {
        h += '<div class="msg msg-info flush"><span>ℹ</span><span>This file is empty.</span></div>';
      }
      h += msgHtml();
    } else if (S.op === 'Update') {
      h += target() +
        '<div class="radios" role="radiogroup" aria-label="Update operation">' +
        ['Rename', 'Append content', 'Overwrite content'].map(function (a) {
          return '<label><input type="radio" name="u-action" value="' + a + '"' + (S.action === a ? ' checked' : '') + '> ' + a + '</label>';
        }).join('') + '</div>';
      if (S.action === 'Rename') {
        h += '<div class="field"><label for="u-new">New file name</label><input type="text" id="u-new" placeholder="e.g.  renamed.txt" autocomplete="off"></div><button class="btn" id="u-go">Rename File</button>';
      } else if (S.action === 'Append content') {
        h += '<div class="field"><label for="u-data">Content to append</label><textarea id="u-data" style="min-height:7rem"></textarea><span class="hint">Added on a new line at the end of the file.</span></div><button class="btn" id="u-go">Append</button>';
      } else {
        h += '<div class="field"><label for="u-data">New content (replaces everything)</label><textarea id="u-data"></textarea></div><button class="btn" id="u-go">Overwrite File</button>';
      }
      h += msgHtml();
    } else if (S.op === 'Delete') {
      h += target() +
        '<div class="msg msg-error flush"><span>⚠</span><span>This permanently deletes <b>' + esc(S.sel) + '</b>. This cannot be undone.</span></div>' +
        '<label class="check"><input type="checkbox" id="d-ok"> I understand — delete "' + esc(S.sel) + '"</label>' +
        '<button class="btn danger" id="d-go">Delete File</button>' + msgHtml();
    }
    $('panel').innerHTML = h;
    $('panel').setAttribute('aria-labelledby', 'tab-' + S.op);
    bind();
  }

  function bind() {
    if (S.op === 'Create') {
      var ta = $('c-content'), cnt = $('c-count');
      ta.value = S.draft.c;
      function upd() { cnt.textContent = ta.value.length + ' chars · ' + lines(ta.value) + ' lines'; }
      ta.addEventListener('input', upd); upd();
      $('c-go').addEventListener('click', function () {
        var n = $('c-name').value.trim(), p = nameProblem(n);
        S.draft = { n: $('c-name').value, c: ta.value };
        if (p) { say('error', p); return render(); }
        if (files.hasOwnProperty(n)) { say('error', "'" + n + "' already exists. Choose a different name."); return render(); }
        files[n] = { c: ta.value, t: Date.now() }; save(); S.sel = n; S.draft = { n: '', c: '' };
        say('success', "'" + n + "' created successfully!"); render();
      });
      return;
    }
    if (!S.sel) return;
    if (S.op === 'Read') {
      var out = $('r-out'); if (out) out.textContent = files[S.sel].c;
      var cp = $('r-copy');
      if (cp) cp.addEventListener('click', function () {
        function done(ok) {
          if (!ok) { var r = document.createRange(); r.selectNodeContents(out); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
          cp.textContent = ok ? 'Copied' : 'Selected, press Ctrl+C';
          setTimeout(function () { cp.textContent = 'Copy'; }, 1800);
        }
        try { navigator.clipboard.writeText(files[S.sel].c).then(function () { done(true); }, function () { done(false); }); }
        catch (e) { done(false); }
      });
    } else if (S.op === 'Update') {
      Array.prototype.forEach.call(document.querySelectorAll('input[name="u-action"]'), function (r) {
        r.addEventListener('change', function () { S.action = r.value; S.msg = null; renderPanel(); });
      });
      if (S.action === 'Overwrite content') $('u-data').value = files[S.sel].c;
      $('u-go').addEventListener('click', function () {
        if (S.action === 'Rename') {
          var n = $('u-new').value.trim(), p = nameProblem(n);
          if (p) { say('error', p === 'Please enter a file name.' ? 'Please enter a new name.' : p); return render(); }
          if (files.hasOwnProperty(n)) { say('error', "'" + n + "' already exists."); return render(); }
          files[n] = { c: files[S.sel].c, t: Date.now() }; delete files[S.sel]; S.sel = n; save();
          say('success', "Renamed to '" + n + "' successfully!");
        } else if (S.action === 'Append content') {
          var d = $('u-data').value;
          if (!d) { say('error', 'Nothing to append.'); return render(); }
          files[S.sel] = { c: files[S.sel].c + '\n' + d, t: Date.now() }; save(); say('success', 'Content appended successfully!');
        } else {
          files[S.sel] = { c: $('u-data').value, t: Date.now() }; save(); say('success', 'File overwritten successfully!');
        }
        render();
      });
    } else if (S.op === 'Delete') {
      $('d-go').addEventListener('click', function () {
        if (!$('d-ok').checked) { say('error', 'Please check the confirmation box first.'); return renderPanel(); }
        var n = S.sel; delete files[n]; save(); S.sel = '';
        say('info', "'" + n + "' deleted successfully!"); render();
      });
    }
  }

  function render() { ensureSel(); renderStats(); renderTabs(); renderPanel(); renderList(); }

  $('q').addEventListener('input', function (e) { S.q = e.target.value; renderList(); });
  load(); render();
})();
