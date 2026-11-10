'use strict';

(function () {
  const stateEl = document.getElementById('state');
  const resultEl = document.getElementById('result');
  const $ = (id) => document.getElementById(id);

  function showState(title, text) {
    stateEl.innerHTML = '';
    const h = document.createElement('h2');
    h.textContent = title;
    const p = document.createElement('p');
    p.textContent = text;
    const a = document.createElement('a');
    a.className = 'btn';
    a.href = '/';
    a.textContent = 'العودة إلى صفحة الإدخال';
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
    if (d < 0) { text = `عمرك البيولوجي التقديري أصغر من عمرك الزمني بـ ${BA.years(d)}`; tone = 'good'; }
    else if (d > 0) { text = `عمرك البيولوجي التقديري أكبر من عمرك الزمني بـ ${BA.years(d)}`; tone = 'attention'; }
    else { text = 'عمرك البيولوجي التقديري مساوٍ لعمرك الزمني'; tone = 'neutral'; }
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
    document.title = `العمر البيولوجي — ${r.name}`;
  }

  $('print-btn').addEventListener('click', () => window.print());

  async function load() {
    const token = decodeURIComponent(window.location.hash.slice(1));
    if (!token) {
      showState('لا توجد نتيجة لعرضها', 'يرجى إدخال بياناتك ونتائج الاختبارات أولًا.');
      return;
    }
    try {
      const cached = sessionStorage.getItem(`ba-result:${token}`);
      if (cached) { render(JSON.parse(cached)); return; }
    } catch { /* المتابعة إلى الخادم */ }

    try {
      const { ok, data } = await BA.api(`/api/results/${encodeURIComponent(token)}`);
      if (ok && data.result) render(data.result);
      else showState('النتيجة غير متاحة', data.error || 'انتهت صلاحية رابط النتيجة أو أنه غير صحيح.');
    } catch {
      showState('تعذر تحميل النتيجة', 'تحقق من اتصالك بالإنترنت ثم أعد تحميل الصفحة.');
    }
  }
  load();
})();
