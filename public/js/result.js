'use strict';

(function () {
  const stateEl = document.getElementById('state');
  const resultEl = document.getElementById('result');
  const $ = (id) => document.getElementById(id);
  const T = (k, v) => I18N.t(k, v);

  function showState(titleKey, textKey, serverText) {
    stateEl.hidden = false;
    resultEl.hidden = true;
    stateEl.innerHTML = '';
    const h = document.createElement('h2');
    h.textContent = T(titleKey);
    const p = document.createElement('p');
    p.textContent = serverText || T(textKey);
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = '/';
    a.textContent = T('res.back');
    a.style.marginTop = '24px';
    stateEl.append(h, p, a);
  }

  function setBadge(el, item) {
    el.textContent = item.label;
    el.className = `badge tone-${item.tone}`;
  }

  function list(el, items, cls) {
    el.innerHTML = '';
    items.forEach((it) => {
      const li = document.createElement('li');
      if (cls) li.className = cls;
      const div = document.createElement('div');
      const h = document.createElement('h3');
      h.textContent = it.title;
      const p = document.createElement('p');
      p.textContent = it.text;
      div.append(h, p);
      li.append(div);
      el.append(li);
    });
  }

  function render(r) {
    $('r-name').textContent = r.name;
    $('r-gender').textContent = `${r.genderLabel} · ${BA.years(r.age)}`;
    $('r-age').textContent = r.age;
    $('r-bio').textContent = r.bioAge;

    const d = r.ageDiff;
    $('r-diff').textContent = d > 0 ? `+${d}` : String(d);
    let text;
    let tone;
    if (d < 0) { text = T('res.younger', { years: BA.years(d) }); tone = 'good'; }
    else if (d > 0) { text = T('res.older', { years: BA.years(d) }); tone = 'attention'; }
    else { text = T('res.equal'); tone = 'neutral'; }
    $('r-diff-text').textContent = text;
    $('r-diff-banner').className = `diff-banner tone-${tone}`;

    $('r-hr').textContent = r.heartRate.value;
    setBadge($('r-hr-class'), r.heartRate);
    $('r-pbf').textContent = BA.formatNumber(r.pbf.value);
    setBadge($('r-pbf-class'), r.pbf);

    list($('r-recs-personal'), r.recommendations.personal, 'personal');
    list($('r-recs-general'), r.recommendations.general);

    stateEl.hidden = true;
    resultEl.hidden = false;
    document.title = `${T('app.title')} — ${r.name}`;
  }

  $('print-btn').addEventListener('click', () => window.print());

  const token = decodeURIComponent(window.location.hash.slice(1));
  const cacheKey = () => `ba-result:${I18N.lang}:${token}`;

  async function load() {
    if (!token) { showState('res.noneTitle', 'res.noneText'); return; }
    try {
      const cached = sessionStorage.getItem(cacheKey());
      if (cached) { render(JSON.parse(cached)); return; }
    } catch { /* المتابعة إلى الخادم */ }

    try {
      const { ok, data } = await BA.api(`/api/results/${encodeURIComponent(token)}`);
      if (ok && data.result) {
        try { sessionStorage.setItem(cacheKey(), JSON.stringify(data.result)); } catch { /* اختياري */ }
        render(data.result);
      } else {
        showState('res.missingTitle', 'res.missingText', data.error);
      }
    } catch {
      showState('res.failTitle', 'res.failText');
    }
  }

  // عند تغيير اللغة: إعادة تحميل النتيجة بالتصنيفات والتوصيات باللغة الجديدة
  document.addEventListener('langchange', load);
  load();
})();
