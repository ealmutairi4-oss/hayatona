'use strict';

(function () {
  const $ = (id) => document.getElementById(id);
  const filtersForm = $('filters');
  let me = null;
  let stats = null;
  let activeTab = 'gender';
  let page = 1;
  let query = '';

  const fmt = (n, digits = 1) => (n === null || n === undefined ? '—'
    : Number(n).toLocaleString('en-US', { maximumFractionDigits: digits }));
  // عزل اتجاه الأرقام ذات الإشارة (LRI…PDI) حتى لا تنقلب الإشارة داخل النص العربي
  const ltr = (s) => `\u2066${s}\u2069`;
  const signed = (n) => (n === null || n === undefined ? '—' : ltr(`${n > 0 ? '+' : ''}${fmt(n)}`));
  const pts = (n) => ltr(`${n > 0 ? '+' : ''}${n}`);

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('is-visible'), 2600);
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
      const fill = el('div', { class: 'bar-fill' });
      fill.style.width = `${(i.count / max) * 100}%`;
      const row = el('div', { class: 'bar-row', title: `${i.label}: ${i.count} (${pct}%) — النقاط ${pts(i.points)}` },
        el('div', { class: 'bar-row__label' }, i.label, el('small', { text: `النقاط ${pts(i.points)}` })),
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
    const heads = activeTab === 'cross' ? ['الجنس', 'الفئة العمرية'] : [activeTab === 'gender' ? 'الجنس' : 'الفئة العمرية'];
    heads.push('العدد', 'متوسط النقاط', 'متوسط العمر الزمني', 'متوسط العمر التقديري', 'متوسط الفارق', 'أصغر / مساوٍ / أكبر');
    table.append(el('thead', {}, el('tr', {}, ...heads.map((h) => el('th', { text: h })))));
    const body = el('tbody');
    let rows;
    if (activeTab === 'gender') rows = stats.byGender.map((g) => [g.label, g]);
    else if (activeTab === 'age') rows = stats.byAgeGroup.map((g) => [g.label, g]);
    else rows = stats.byGenderAgeGroup.map((g) => [[g.genderLabel, g.ageGroup], g]);
    if (!rows.length) body.append(el('tr', {}, el('td', { class: 'empty', colspan: String(heads.length), text: 'لا توجد بيانات.' })));
    rows.forEach(([labels, a]) => {
      const labelCells = (Array.isArray(labels) ? labels : [labels]).map((l) => el('td', { text: l }));
      body.append(el('tr', {}, ...labelCells, ...aggCells(a)));
    });
    table.append(body);
  }

  async function loadStats() {
    const { ok, data } = await call(`/api/admin/stats?${filterParams()}`);
    if (!ok) { toast(data.error || 'تعذر تحميل الإحصاءات.'); return; }
    stats = data;
    const s = data.summary;
    $('k-count').textContent = s.count.toLocaleString('en-US');
    $('k-points').textContent = signed(s.avgPoints);
    $('k-bio').textContent = fmt(s.avgBioAge);
    $('k-age').textContent = s.count ? `متوسط العمر الزمني ${fmt(s.avgAge)}` : '';
    $('k-diff').textContent = signed(s.avgDiff);
    $('k-split').textContent = s.count ? `أصغر ${s.younger} · مساوٍ ${s.same} · أكبر ${s.older}` : '';
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
    if (!ok) { toast(data.error || 'تعذر تحميل السجلات.'); return; }
    if (!data.items.length) {
      body.append(el('tr', {}, el('td', { class: 'empty', colspan: '14', text: 'لا توجد سجلات.' })));
    }
    data.items.forEach((r) => {
      const del = el('button', { class: 'del-btn', type: 'button', text: 'حذف' });
      del.addEventListener('click', () => deleteRecord(r));
      const diffCls = r.age_diff > 0 ? 'n pos' : r.age_diff < 0 ? 'n neg' : 'n';
      body.append(el('tr', {},
        el('td', { class: 'n', text: String(r.id) }),
        el('td', { text: r.name }),
        el('td', { text: r.gender === 'male' ? 'ذكر' : 'أنثى' }),
        el('td', { class: 'n', text: String(r.age) }),
        el('td', { class: 'n', dir: 'ltr', text: r.phone }),
        el('td', { class: 'n', text: String(r.heart_rate) }),
        el('td', { text: `${r.hr_class} (${pts(r.hr_points)})` }),
        el('td', { class: 'n', text: `${fmt(r.pbf, 2)}%` }),
        el('td', { text: `${r.pbf_class} (${pts(r.pbf_points)})` }),
        el('td', { class: 'n', text: signed(r.total_points) }),
        el('td', { class: 'n', text: String(r.bio_age) }),
        el('td', { class: diffCls, text: signed(r.age_diff) }),
        el('td', { class: 'n', text: new Date(r.created_at).toLocaleString('ar-SA-u-nu-latn-ca-gregory', { dateStyle: 'short', timeStyle: 'short' }) }),
        el('td', {}, del)));
    });
    const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
    $('page-info').textContent = `صفحة ${data.page} من ${pages} · ${data.total} سجل`;
    $('prev-page').disabled = data.page <= 1;
    $('next-page').disabled = data.page >= pages;
  }

  async function deleteRecord(r) {
    if (!window.confirm(`حذف السجل رقم ${r.id} (${r.name}) نهائيًا؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    const { ok, data } = await call(`/api/admin/assessments/${r.id}`, { method: 'DELETE' });
    toast(ok ? 'تم حذف السجل.' : (data.error || 'تعذر الحذف.'));
    if (ok) { loadRecords(); loadStats(); }
  }

  async function loadRules() {
    const { ok, data } = await call('/api/admin/rules');
    if (!ok) return;
    // صياغة عربية مطابقة لجداول المواصفات
    const range = (r, unit) => {
      const lo = r.min_value === null ? null : `${r.min_value}${unit}`;
      const hi = r.max_value === null ? null : `${r.max_value}${unit}`;
      if (lo === null) return `أقل من ${hi}`;
      if (hi === null) return r.min_inclusive ? `${lo} فأكثر` : `أكثر من ${lo}`;
      return `من ${lo} إلى ${r.max_inclusive ? '' : 'أقل من '}${hi}`;
    };
    [['hr', 'rules-hr', 'نبض القلب بعد اختبار الخطوة', ''], ['pbf', 'rules-pbf', 'نسبة الدهون PBF', '%']].forEach(([test, id, caption, unit]) => {
      const t = $(id);
      t.innerHTML = '';
      t.append(el('caption', { text: caption }),
        el('thead', {}, el('tr', {}, el('th', { text: 'النطاق' }), el('th', { text: 'التصنيف' }), el('th', { text: 'النقاط' }))));
      const body = el('tbody');
      data.rules.filter((r) => r.test === test).forEach((r) => body.append(el('tr', {},
        el('td', { class: 'n', text: range(r, unit) }),
        el('td', { text: r.label }),
        el('td', { class: 'n', text: pts(r.points) }))));
      t.append(body);
    });
  }

  function updateExportLinks() {
    $('exp-stats').href = `/api/admin/export/stats.csv?${filterParams()}`;
    $('exp-records').href = `/api/admin/export/records.csv?${filterParams()}`;
    $('exp-pii').href = `/api/admin/export/records.csv?${filterParams({ pii: '1' })}`;
  }

  function refresh() {
    page = 1;
    updateExportLinks();
    loadStats();
    loadRecords();
  }

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
    if (!window.confirm('سيتضمن الملف الأسماء وأرقام التواصل (بيانات شخصية حساسة) وسيُسجَّل هذا الإجراء. هل تريد المتابعة؟')) e.preventDefault();
  });

  $('logout-btn').addEventListener('click', async () => {
    await BA.api('/api/admin/logout', { method: 'POST', body: '{}' });
    window.location.replace('/admin/login');
  });

  const fmtDate = (iso) => (iso
    ? new Date(iso).toLocaleString('ar-SA-u-nu-latn-ca-gregory', { dateStyle: 'short', timeStyle: 'short' })
    : '—');

  function showAlert(id, msg, ok) {
    const a = $(id);
    a.textContent = msg || '';
    a.classList.toggle('is-visible', Boolean(msg));
    a.classList.toggle('alert--ok', Boolean(ok));
  }

  // ───────── التنقل بين الأقسام ─────────
  const loaders = { users: () => loadUsers(), audit: () => loadAudit() };
  function showView(name) {
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.view !== name; });
    document.querySelectorAll('.view-btn').forEach((b) => {
      const on = b.dataset.view === name;
      b.classList.toggle('is-active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    const btn = document.querySelector(`.view-btn[data-view="${name}"]`);
    document.querySelector('.page-title').textContent = name === 'reports' ? 'التقارير والإحصاءات' : btn.textContent;
    if (loaders[name]) loaders[name]();
    window.scrollTo({ top: 0 });
  }
  document.querySelectorAll('.view-btn').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));

  // ───────── الحذف الجماعي ─────────
  $('purge-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const before = $('purge-before').value;
    if (!before) return;
    if (!window.confirm(`سيتم حذف جميع السجلات المنشأة قبل ${before} نهائيًا. هل تريد المتابعة؟`)) return;
    const { ok, data } = await call('/api/admin/assessments/purge', { method: 'POST', body: JSON.stringify({ before }) });
    const done = data.deleted ? `تم حذف ${data.deleted.toLocaleString('en-US')} من السجلات.` : 'لا توجد سجلات قبل هذا التاريخ.';
    toast(ok ? done : (data.error || 'تعذر الحذف.'));
    if (ok) { $('purge-form').reset(); loadRecords(); loadStats(); }
  });

  // ───────── الحسابات ─────────
  const ROLE_LABEL = { admin: 'مدير', analyst: 'محلل' };

  async function updateUser(u, changes, confirmMsg) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const { ok, data } = await call(`/api/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify(changes) });
    toast(ok ? 'تم حفظ التغيير.' : (data.error || 'تعذر حفظ التغيير.'));
    if (ok) loadUsers();
  }

  async function loadUsers() {
    const { ok, data } = await call('/api/admin/users');
    const body = $('users-body');
    body.innerHTML = '';
    if (!ok) { toast(data.error || 'تعذر تحميل الحسابات.'); return; }
    data.users.forEach((u) => {
      const self = u.id === me.id;
      const actions = el('div', { class: 'row-actions' });
      if (!self) {
        const roleBtn = el('button', { class: 'link-btn', type: 'button', text: u.role === 'admin' ? 'تحويل إلى محلل' : 'تحويل إلى مدير' });
        roleBtn.addEventListener('click', () => updateUser(u, { role: u.role === 'admin' ? 'analyst' : 'admin' },
          `تغيير صلاحية ${u.username} إلى «${u.role === 'admin' ? 'محلل' : 'مدير'}»؟`));
        const activeBtn = el('button', { class: 'link-btn', type: 'button', text: u.active ? 'تعطيل' : 'تفعيل' });
        activeBtn.addEventListener('click', () => updateUser(u, { active: !u.active },
          u.active ? `تعطيل الحساب ${u.username}؟ سيتم إنهاء جلساته فورًا.` : null));
        actions.append(roleBtn, activeBtn);
      }
      const pwBtn = el('button', { class: 'link-btn', type: 'button', text: 'إعادة تعيين كلمة المرور' });
      pwBtn.addEventListener('click', () => {
        const password = window.prompt(`كلمة مرور جديدة للحساب ${u.username} (12 حرفًا على الأقل):`);
        if (password) updateUser(u, { password });
      });
      actions.append(pwBtn);
      body.append(el('tr', {},
        el('td', { dir: 'ltr', text: u.username }),
        el('td', { text: u.display_name + (self ? ' (أنت)' : '') }),
        el('td', { text: ROLE_LABEL[u.role] }),
        el('td', {}, el('span', { class: `pill ${u.active ? 'pill--on' : 'pill--off'}`, text: u.active ? 'نشط' : 'معطّل' })),
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
    if (!ok) { showAlert('user-alert', data.error || 'تعذر إنشاء الحساب.'); return; }
    $('user-form').reset();
    toast('تم إنشاء الحساب.');
    loadUsers();
  });

  // ───────── سجل التدقيق ─────────
  const ACTION_LABEL = {
    login: 'تسجيل دخول',
    login_failed: 'محاولة دخول فاشلة',
    view_records: 'الاطلاع على السجلات',
    export_stats: 'تصدير تقرير إحصائي',
    export_records: 'تصدير سجلات بدون بيانات شخصية',
    export_records_pii: 'تصدير سجلات مع بيانات شخصية',
    delete_record: 'حذف سجل',
    purge_records: 'حذف جماعي للسجلات',
    retention_purge: 'حذف تلقائي (مدة الاحتفاظ)',
    create_user: 'إنشاء حساب',
    update_user: 'تعديل حساب',
    change_own_password: 'تغيير كلمة المرور',
  };
  const DETAIL_LABEL = {
    id: 'رقم', username: 'المستخدم', role: 'الدور', active: 'نشط', passwordReset: 'إعادة تعيين كلمة المرور',
    before: 'قبل تاريخ', deleted: 'المحذوف', count: 'العدد', page: 'الصفحة', q: 'بحث', cutoff: 'الحد', filter: 'المرشحات',
  };

  function describe(details) {
    if (!details) return '';
    let obj;
    try { obj = JSON.parse(details); } catch { return details; }
    return Object.entries(obj)
      .filter(([, v]) => v !== undefined && v !== null && !(typeof v === 'object' && !Object.keys(v).length))
      .map(([k, v]) => [k, k === 'role' ? (ROLE_LABEL[v] || v) : (typeof v === 'boolean' || k === 'active') ? (v ? 'نعم' : 'لا') : v])
      .map(([k, v]) => `${DETAIL_LABEL[k] || k}: ${typeof v === 'object' ? Object.entries(v).map(([a, b]) => `${a}=${b}`).join('، ') : v}`)
      .join(' · ');
  }

  async function loadAudit() {
    const { ok, data } = await call('/api/admin/audit');
    const body = $('audit-body');
    body.innerHTML = '';
    if (!ok) { toast(data.error || 'تعذر تحميل سجل التدقيق.'); return; }
    if (!data.items.length) body.append(el('tr', {}, el('td', { class: 'empty', colspan: '5', text: 'لا توجد إجراءات.' })));
    data.items.forEach((a) => body.append(el('tr', {},
      el('td', { class: 'n', text: fmtDate(a.created_at) }),
      el('td', { dir: 'ltr', text: a.username || '—' }),
      el('td', { text: ACTION_LABEL[a.action] || a.action }),
      el('td', { class: 'details', text: describe(a.details) }),
      el('td', { class: 'n', dir: 'ltr', text: a.ip || '—' }))));
  }

  // ───────── تغيير كلمة المرور ─────────
  $('pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showAlert('pw-alert', '');
    const currentPassword = $('pw-current').value;
    const newPassword = $('pw-new').value;
    if (newPassword !== $('pw-confirm').value) { showAlert('pw-alert', 'كلمتا المرور الجديدتان غير متطابقتين.'); return; }
    const { ok, data } = await call('/api/admin/me/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
    if (!ok) { showAlert('pw-alert', data.error || 'تعذر تغيير كلمة المرور.'); return; }
    $('pw-form').reset();
    showAlert('pw-alert', 'تم تغيير كلمة المرور بنجاح.', true);
  });

  // ───────── البدء ─────────
  (async () => {
    try {
      const { ok, data } = await call('/api/admin/me');
      if (!ok) return;
      me = data.admin;
      $('who').textContent = `${me.displayName} · ${me.role === 'admin' ? 'مدير (صلاحية كاملة)' : 'محلل (تقارير مجمعة فقط)'}`;
      document.querySelectorAll('.admin-only').forEach((n) => { n.hidden = me.role !== 'admin'; });
      $('app').hidden = false;
      updateExportLinks();
      loadStats();
      loadRecords();
      loadRules();
    } catch { /* تمت إعادة التوجيه */ }
  })();
})();
