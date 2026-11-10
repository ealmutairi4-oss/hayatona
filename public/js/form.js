'use strict';

(function () {
  const form = document.getElementById('assessment-form');
  const alertBox = document.getElementById('form-alert');
  const submitBtn = document.getElementById('submit-btn');
  const FIELDS = ['name', 'gender', 'age', 'phone', 'heartRate', 'pbf'];

  function control(field) {
    return field === 'gender' ? document.getElementById('gender') : form.elements[field];
  }

  function setError(field, message) {
    const el = document.getElementById(`${field}-error`);
    const ctl = control(field);
    el.textContent = message || '';
    el.classList.toggle('is-visible', Boolean(message));
    ctl.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function readValues() {
    return {
      name: form.elements.name.value.replace(/\s+/g, ' ').trim(),
      gender: (form.querySelector('input[name="gender"]:checked') || {}).value || '',
      age: BA.normalizeDigits(form.elements.age.value),
      phone: BA.normalizeDigits(form.elements.phone.value).replace(/[\s\-()]/g, ''),
      heartRate: BA.normalizeDigits(form.elements.heartRate.value),
      pbf: BA.normalizeDigits(form.elements.pbf.value).replace(/%$/, ''),
    };
  }

  /** تحقق أولي في المتصفح لتحسين التجربة — التحقق النهائي والتصنيف يتمان في الخادم. */
  function validate(v) {
    const e = {};
    const T = I18N.t;
    if (!v.name) e.name = T('v.required');
    else if (v.name.length < 2) e.name = T('v.nameLength');

    if (!v.gender) e.gender = T('v.gender');

    if (!v.age) e.age = T('v.required');
    else if (!/^\d+$/.test(v.age)) e.age = T('v.ageNumber');
    else if (Number(v.age) < 18) e.age = T('v.ageMin');
    else if (Number(v.age) > 120) e.age = T('v.ageMax');

    if (!v.phone) e.phone = T('v.required');
    else if (!/^\+?\d{9,15}$/.test(v.phone)) e.phone = T('v.phone');

    if (!v.heartRate) e.heartRate = T('v.required');
    else if (!/^-?\d+$/.test(v.heartRate)) e.heartRate = T('v.hrNumber');
    else if (Number(v.heartRate) <= 0) e.heartRate = T('v.hrPositive');

    if (!v.pbf) e.pbf = T('v.required');
    else if (!/^-?(\d+(\.\d+)?|\.\d+)$/.test(v.pbf)) e.pbf = T('v.pbfNumber');
    else if (Number(v.pbf) < 0 || Number(v.pbf) > 100) e.pbf = T('v.pbfRange');
    return e;
  }

  function showErrors(errors) {
    FIELDS.forEach((f) => setError(f, errors[f]));
    const first = FIELDS.find((f) => errors[f]);
    if (first) {
      const ctl = first === 'gender' ? document.getElementById('gender-male') : control(first);
      ctl.focus({ preventScroll: true });
      ctl.closest('.field').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function showAlert(message) {
    alertBox.textContent = message || '';
    alertBox.classList.toggle('is-visible', Boolean(message));
  }

  // إزالة رسالة الخطأ عند التعديل
  FIELDS.forEach((f) => {
    const target = f === 'gender' ? document.getElementById('gender') : control(f);
    target.addEventListener(f === 'gender' ? 'change' : 'input', () => setError(f, ''));
  });

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.classList.toggle('is-loading', loading);
    submitBtn.querySelector('.btn-label').textContent = I18N.t(loading ? 'form.submitting' : 'form.submit');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showAlert('');
    const values = readValues();
    const errors = validate(values);
    if (Object.keys(errors).length) {
      showErrors(errors);
      return;
    }
    FIELDS.forEach((f) => setError(f, ''));

    setLoading(true);
    try {
      const { ok, status, data } = await BA.api('/api/assessments', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      if (ok && data.token) {
        try { sessionStorage.setItem(`ba-result:${I18N.lang}:${data.token}`, JSON.stringify(data.result)); } catch { /* اختياري */ }
        window.location.assign(`/result#${encodeURIComponent(data.token)}`);
        return;
      }
      if (status === 422 && data.fields) {
        showErrors(data.fields);
        showAlert(data.error);
      } else {
        showAlert(data.error || I18N.t('net.submit'));
      }
    } catch {
      showAlert(I18N.t('net.offline'));
    }
    setLoading(false);
  });

  // عند تغيير اللغة: إخفاء رسائل الخطأ السابقة (كانت باللغة الأخرى)
  document.addEventListener('langchange', () => { FIELDS.forEach((f) => setError(f, '')); showAlert(''); });

  // إعادة ضبط الزر عند الرجوع من صفحة النتيجة (ذاكرة التخزين المؤقت للتنقل في Safari)
  window.addEventListener('pageshow', () => setLoading(false));
})();
