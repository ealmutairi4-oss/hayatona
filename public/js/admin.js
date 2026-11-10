'use strict';

(function () {
  const $ = (id) => document.getElementById(id);
  const T = (k, v) => I18N.t(k, v);
  const filtersForm = $('filters');
  let me = null;
  let stats = null;
  let activeTab = 'gender';
  let activeView = 'reports';
  let page = 1;
  let query = '';

  const fmt = (n, digits = 1) => (n === null || n === undefined ? '—'
    : Number(n).toLocaleString('en-US', { maximumFractionDigits: digits }));
  // عزل اتجاه الأرقام ذات الإشارة (LRI…PDI) حتى لا تنقلب الإشارة داخل النص العربي
  const ltr = (s) => `⁦${s}⁩`;
  const signed = (n) => (n === null || n === undefined ? '—' : ltr(`${n > 0 ? '+' : ''}${fmt(n)}`));
  const pts = (n) => ltr(`${n > 0 ? '+' : ''}${n}`);
  const fmtDate = (iso) => (iso
    ? new Date(iso).toLocaleString(I18N.dateLocale(), { dateStyle: 'short', timeStyle: 'short' })
    : '—');

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('is-visible'), 2600);
  }

  function showAlert(id, msg, ok) {
    const a = $(id);
    a.textContent = msg || '';
    a.classList.toggle('is-visible', Boolean(msg));
    a.classList.toggle('alert--ok', Boolean(ok));
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    });
    children.forEach((c) => node.append(c));
    return node;
  }

  function filterParams(extra = {}) {
    const p = new URLSearchParams();
    new FormData(filtersForm).forEach((v, k) => { if (v) p.set(k, v); });
    Object.entries(extra).forEach(([k, v]) => { if (v !== '' && v !== undefined) p.set(k, v); });
    return p;
  }

  async function call(url, options) {
    const res = await BA.api(url, options);
    if (res.status === 401) { window.location.replace('/admin/login'); throw new Error('unauthorized'); }
    return res;
  }

  // ───────── الرسوم ─────────
  function renderBars(container, items, total) {
    container.innerHTML = '';
    const max = Math.max(1, ...items.map((i) => i.count));
    items.forEach((i) => {
      const pct = total ? Math.round((i.count / total) * 100) : 0;
      const pointsText = T('dist.points', { n: pts(i.points) });
      const fill = el('div', { class: 'bar-fill' });
      fill.style.width = `${(i.count / max) * 100}%`;
      const row = el('div', { class: 'bar-row', title: `${i.label}: ${i.count} (${pct}%) — ${pointsText}` },
        el('div', { class: 'bar-row__label' }, i.label, el('small', { text: pointsText })),
        el('div', { class: 'bar-track', 'aria-hidden': 'true' }, fill),
        el('div', { class: 'bar-row__value' }, el('b', { text: String(i.count) }), ` · ${pct}%`));
      container.append(row);
    });
  }

  function aggCells(a) {
    return [
      el('td', { class: 'n', text: String(a.count) }),
      el('td', { class: 'n', text: signed(a.avgPoints) }),
      el('td', { class: 'n', text: fmt(a.avgAge) }),
      el('td', { class: 'n', text: fmt(a.avgBioAge) }),
      el('td', { class: 'n', text: signed(a.avgDiff) }),
      el('td', { class: 'n', text: `${a.younger} / ${a.same} / ${a.older}` }),
    ];
  }

  function renderGroupTable() {
    const table = $('group-table');
    table.innerHTML = '';
    if (!stats) return;
    const heads = activeTab === 'cross'
      ? [T('col.gender'), T('col.ageGroup')]
      : [T(activeTab === 'gender' ? 'col.gender' : 'col.ageGroup')];
    heads.push(T('col.count'), T('col.avgPoints'), T('col.avgAge'), T('col.avgBio'), T('col.avgDiff'), T('col.split'));
    table.append(el('thead', {}, el('tr', {}, ...heads.map((h) => el('th', { text: h })))));
    const body = el('tbody');
    let rows;
    if (activeTab === 'gender') rows = stats.byGender.map((g) => [g.label, g]);
    else if (activeTab === 'age') rows = stats.byAgeGroup.map((g) => [g.label, g]);
    else rows = stats.byGenderAgeGroup.map((g) => [[g.genderLabel, g.ageGroup], g]);
    if (!rows.length) body.append(el('tr', {}, el('td', { class: 'empty', colspan: String(heads.length), text: T('tbl.empty') })));
    rows.forEach(([labels, a]) => {
      const labelCells = (Array.isArray(labels) ? labels : [labels]).map((l) => el('td', { text: l }));
      body.append(el('tr', {}, ...labelCells, ...aggCells(a)));
    });
    table.append(body);
  }

  async function loadStats() {
    const { ok, data } = await call(`/api/admin/stats?${filterParams()}`);
    if (!ok) { toast(data.error || T('stats.fail')); return; }
    stats = data;
    const s = data.summary;
    $('k-count').textContent = s.count.toLocaleString('en-US');
    $('k-points').textContent = signed(s.avgPoints);
    $('k-bio').textContent = fmt(s.avgBioAge);
    $('k-age').textContent = s.count ? T('kpi.avgAge', { n: fmt(s.avgAge) }) : '';
    $('k-diff').textContent = signed(s.avgDiff);
    $('k-split').textContent = s.count ? T('kpi.split', { a: s.younger, b: s.same, c: s.older }) : '';
    renderBars($('hr-dist'), data.hrDistribution, s.count);
    renderBars($('pbf-dist'), data.pbfDistribution, s.count);
    renderGroupTable();
  }

  // ───────── السجلات ─────────
  async function loadRecords() {
    if (!me || me.role !== 'admin') return;
    const { ok, data } = await call(`/api/admin/assessments?${filterParams({ page, q: query })}`);
    const body = $('records-body');
    body.innerHTML = '';
    if (!ok) { toast(data.error || T('rec.loadFail')); return; }
    if (!data.items.length) {
      body.append(el('tr', {}, el('td', { class: 'empty', colspan: '14', text: T('rec.empty') })));
    }
    data.items.forEach((r) => {
      const del = el('button', { class: 'del-btn', type: 'button', text: T('rec.delete') });
      del.addEventListener('click', () => deleteRecord(r));
      const diffCls = r.age_diff > 0 ? 'n pos' : r.age_diff < 0 ? 'n neg' : 'n';
      body.append(el('tr', {},
        el('td', { class: 'n', text: String(r.id) }),
        el('td', { text: r.name }),
        el('td', { text: T(r.gender === 'male' ? 'f.male' : 'f.female') }),
        el('td', { class: 'n', text: String(r.age) }),
        el('td', { class: 'n', dir: 'ltr', text: r.phone }),
        el('td', { class: 'n', text: String(r.heart_rate) }),
        el('td', { text: `${r.hr_class} (${pts(r.hr_points)})` }),
        el('td', { class: 'n', text: `${fmt(r.pbf, 2)}%` }),
        el('td', { text: `${r.pbf_class} (${pts(r.pbf_points)})` }),
        el('td', { class: 'n', text: signed(r.total_points) }),
        el('td', { class: 'n', text: String(r.bio_age) }),
        el('td', { class: diffCls, text: signed(r.age_diff) }),
        el('td', { class: 'n', text: fmtDate(r.created_at) }),
        el('td', {}, del)));
    });
    const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
    $('page-info').textContent = T('rec.page', { p: data.page, n: pages, t: data.total });
    $('prev-page').disabled = data.page <= 1;
    $('next-page').disabled = data.page >= pages;
  }

  async function deleteRecord(r) {
    if (!window.confirm(T('rec.deleteConfirm', { id: r.id, name: r.name }))) return;
    const { ok, data } = await call(`/api/admin/assessments/${r.id}`, { method: 'DELETE' });
    toast(ok ? T('rec.deleted') : (data.error || T('rec.deleteFail')));
    if (ok) { loadRecords(); loadStats(); }
  }

  // ───────── جداول التصنيف ─────────
  function rangeText(r, unit) {
    const lo = r.min_value === null ? null : `${r.min_value}${unit}`;
    const hi = r.max_value === null ? null : `${r.max_value}${unit}`;
    if (lo === null) return T('rules.lt', { v: hi });
    if (hi === null) return r.min_inclusive ? T('rules.gte', { v: lo }) : T('rules.gt', { v: lo });
    return T(r.max_inclusive ? 'rules.between' : 'rules.betweenLt', { a: lo, b: hi });
  }

  async function loadRules() {
    const { ok, data } = await call('/api/admin/rules');
    if (!ok) return;
    [['hr', 'rules-hr', 'rules.hr', ''], ['pbf', 'rules-pbf', 'rules.pbf', '%']].forEach(([test, id, captionKey, unit]) => {
      const tbl = $(id);
      tbl.innerHTML = '';
      tbl.append(el('caption', { text: T(captionKey) }),
        el('thead', {}, el('tr', {}, el('th', { text: T('rules.range') }), el('th', { text: T('rules.class') }), el('th', { text: T('rules.points') }))));
      const body = el('tbody');
      data.rules.filter((r) => r.test === test).forEach((r) => body.append(el('tr', {},
        el('td', { class: 'n', text: rangeText(r, unit) }),
        el('td', { text: r.label }),
        el('td', { class: 'n', text: pts(r.points) }))));
      tbl.append(body);
    });
  }

  function updateExportLinks() {
    const lang = { lang: I18N.lang };
    $('exp-stats').href = `/api/admin/export/stats.csv?${filterParams(lang)}`;
    $('exp-records').href = `/api/admin/export/records.csv?${filterParams(lang)}`;
    $('exp-pii').href = `/api/admin/export/records.csv?${filterParams({ ...lang, pii: '1' })}`;
  }

  function refresh() {
    page = 1;
    updateExportLinks();
    loadStats();
    loadRecords();
  }

  // ───────── التنقل بين الأقسام ─────────
  const loaders = { users: () => loadUsers(), audit: () => loadAudit() };
  const VIEW_TITLE = { reports: 'adm.reportsTitle', records: 'nav.records', users: 'nav.users', audit: 'nav.audit', account: 'nav.account' };

  function showView(name) {
    activeView = name;
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.view !== name; });
    document.querySelectorAll('.view-btn').forEach((b) => {
      const on = b.dataset.view === name;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('page-title').dataset.i18n = VIEW_TITLE[name];
    $('page-title').textContent = T(VIEW_TITLE[name]);
    if (loaders[name]) loaders[name]();
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll('.view-btn').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));

  // ───────── الحذف الجماعي ─────────
  $('purge-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const before = $('purge-before').value;
    if (!before) return;
    if (!window.confirm(T('purge.confirm', { date: before }))) return;
    const { ok, data } = await call('/api/admin/assessments/purge', { method: 'POST', body: JSON.stringify({ before }) });
    const done = data.deleted ? T('purge.done', { n: data.deleted.toLocaleString('en-US') }) : T('purge.none');
    toast(ok ? done : (data.error || T('rec.deleteFail')));
    if (ok) { $('purge-form').reset(); loadRecords(); loadStats(); }
  });

  // ───────── الحسابات ─────────
  const roleLabel = (r) => T(`role.${r}`);

  async function updateUser(u, changes, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const { ok, data } = await call(`/api/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
    toast(ok ? T('usr.saved') : (data.error || T('usr.saveFail')));
    if (ok) loadUsers();
  }

  async function loadUsers() {
    const { ok, data } = await call('/api/admin/users');
    const body = $('users-body');
    body.innerHTML = '';
    if (!ok) { toast(data.error || T('usr.loadFail')); return; }
    data.users.forEach((u) => {
      const self = u.id === me.id;
      const actions = el('div', { class: 'row-actions' });
      if (!self) {
        const nextRole = u.role === 'admin' ? 'analyst' : 'admin';
        const roleBtn = el('button', { class: 'link-btn', type: 'button', text: T(u.role === 'admin' ? 'usr.toAnalyst' : 'usr.toAdmin') });
        roleBtn.addEventListener('click', () => updateUser(u, { role: nextRole },
          T('usr.roleConfirm', { u: u.username, r: roleLabel(nextRole) })));
        const activeBtn = el('button', { class: 'link-btn', type: 'button', text: T(u.active ? 'usr.disable' : 'usr.enable') });
        activeBtn.addEventListener('click', () => updateUser(u, { active: !u.active },
          u.active ? T('usr.disableConfirm', { u: u.username }) : null));
        actions.append(roleBtn, activeBtn);
      }
      const pwBtn = el('button', { class: 'link-btn', type: 'button', text: T('usr.reset') });
      pwBtn.addEventListener('click', () => {
        const password = window.prompt(T('usr.resetPrompt', { u: u.username }));
        if (password) updateUser(u, { password });
      });
      actions.append(pwBtn);
      body.append(el('tr', {},
        el('td', { dir: 'ltr', text: u.username }),
        el('td', { text: u.display_name + (self ? T('usr.you') : '') }),
        el('td', { text: roleLabel(u.role) }),
        el('td', {}, el('span', { class: `pill ${u.active ? 'pill--on' : 'pill--off'}`, text: T(u.active ? 'usr.active' : 'usr.inactive') })),
        el('td', { class: 'n', text: fmtDate(u.last_login_at) }),
        el('td', {}, actions)));
    });
  }

  $('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert('user-alert', '');
    const payload = {
      username: $('u-username').value.trim(),
      displayName: $('u-name').value.trim(),
      role: $('u-role').value,
      password: $('u-password').value,
    };
    const { ok, data } = await call('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) });
    if (!ok) { showAlert('user-alert', data.error || T('usr.createFail')); return; }
    $('user-form').reset();
    toast(T('usr.created'));
    loadUsers();
  });

  // ───────── سجل التدقيق ─────────
  function describe(details) {
    if (!details) return '';
    let obj;
    try { obj = JSON.parse(details); } catch { return details; }
    return Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && !(typeof v === 'object' && !Object.keys(v).length))
      .map(([k, v]) => {
        let val = v;
        if (k === 'role') val = roleLabel(v);
        else if (typeof v === 'boolean' || k === 'active') val = T(v ? 'aud.yes' : 'aud.no');
        else if (typeof v === 'object') val = Object.entries(v).map(([a, b]) => `${a}=${b}`).join(', ');
        const label = T(`det.${k}`);
        return `${label === `det.${k}` ? k : label}: ${val}`;
      })
      .join(' · ');
  }

  async function loadAudit() {
    const { ok, data } = await call('/api/admin/audit');
    const body = $('audit-body');
    body.innerHTML = '';
    if (!ok) { toast(data.error || T('aud.loadFail')); return; }
    if (!data.items.length) body.append(el('tr', {}, el('td', { class: 'empty', colspan: '5', text: T('aud.empty') })));
    data.items.forEach((a) => {
      const action = T(`act.${a.action}`);
      body.append(el('tr', {},
        el('td', { class: 'n', text: fmtDate(a.created_at) }),
        el('td', { dir: 'ltr', text: a.username || '—' }),
        el('td', { text: action === `act.${a.action}` ? a.action : action }),
        el('td', { class: 'details', text: describe(a.details) }),
        el('td', { class: 'n', dir: 'ltr', text: a.ip || '—' })));
    });
  }

  // ───────── تغيير كلمة المرور ─────────
  $('pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert('pw-alert', '');
    const currentPassword = $('pw-current').value;
    const newPassword = $('pw-new').value;
    if (newPassword !== $('pw-confirm').value) { showAlert('pw-alert', T('pw.mismatch')); return; }
    const { ok, data } = await call('/api/admin/me/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
    if (!ok) { showAlert('pw-alert', data.error || T('pw.fail')); return; }
    $('pw-form').reset();
    showAlert('pw-alert', T('pw.done'), true);
  });

  // ───────── الأحداث ─────────
  filtersForm.addEventListener('submit', (e) => { e.preventDefault(); refresh(); });
  filtersForm.addEventListener('reset', () => setTimeout(refresh, 0));

  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
    activeTab = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('is-active', t === tab);
      t.setAttribute('aria-selected', String(t === tab));
    });
    renderGroupTable();
  }));

  $('search-form').addEventListener('submit', (e) => { e.preventDefault(); query = $('q').value.trim(); page = 1; loadRecords(); });
  $('q').addEventListener('search', () => { query = $('q').value.trim(); page = 1; loadRecords(); });
  $('prev-page').addEventListener('click', () => { page -= 1; loadRecords(); });
  $('next-page').addEventListener('click', () => { page += 1; loadRecords(); });

  $('exp-pii').addEventListener('click', (e) => {
    if (!window.confirm(T('exp.piiConfirm'))) e.preventDefault();
  });

  $('logout-btn').addEventListener('click', async () => {
    await BA.api('/api/admin/logout', { method: 'POST', body: '{}' });
    window.location.replace('/admin/login');
  });

  function setWho() {
    $('who').textContent = `${me.displayName} · ${T(me.role === 'admin' ? 'adm.roleAdmin' : 'adm.roleAnalyst')}`;
  }

  // تغيير اللغة: إعادة بناء المحتوى الديناميكي بالتسميات الجديدة
  document.addEventListener('langchange', () => {
    if (!me) return;
    setWho();
    ['user-alert', 'pw-alert'].forEach((id) => showAlert(id, ''));
    updateExportLinks();
    loadStats();
    loadRules();
    loadRecords();
    if (loaders[activeView]) loaders[activeView]();
  });

  // ───────── البدء ─────────
  (async () => {
    try {
      const { ok, data } = await call('/api/admin/me');
      if (!ok) return;
      me = data.admin;
      setWho();
      document.querySelectorAll('.admin-only').forEach((n) => { n.hidden = me.role !== 'admin'; });
      $('app').hidden = false;
      updateExportLinks();
      loadStats();
      loadRecords();
      loadRules();
    } catch { /* تمت إعادة التوجيه */ }
  })();
})();
