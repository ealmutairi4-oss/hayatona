'use strict';

/* أدوات مشتركة لصفحات الموقع */
(function () {
  // عرض اسم الجهة نصيًا إذا لم يتوفر ملف الشعار
  function logoFallback(img) {
    const span = document.createElement('span');
    span.className = 'logo-fallback';
    span.textContent = img.alt || img.dataset.fallback;
    img.replaceWith(span);
  }
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) logoFallback(img);
    else img.addEventListener('error', () => logoFallback(img), { once: true });
  });

  // زر الترجمة (العربية ⇄ الإنجليزية) في الترويسة
  const ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
    + '<path d="M4 5h8M8 3v2M10.5 5c-.6 3.6-3 6.6-6.5 8"/><path d="M6 9c1.2 2 3 3.4 5 4"/>'
    + '<path d="M13 21l4-9 4 9M14.5 18h5"/></svg>';
  document.querySelectorAll('.header-end').forEach((slot) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-toggle';
    btn.innerHTML = `${ICON}<span class="long" data-i18n="lang.switch"></span><span class="short" data-i18n="lang.short"></span>`;
    btn.dataset.i18nAria = 'lang.aria';
    btn.addEventListener('click', () => I18N.toggle());
    slot.prepend(btn);
    I18N.apply(btn.parentNode);
  });

  window.BA = {
    /** تحويل الأرقام العربية-الهندية إلى لاتينية وتوحيد الفاصلة العشرية */
    normalizeDigits(value) {
      return String(value || '')
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
        .replace(/[٫,]/g, '.')
        .trim();
    },

    years: (n) => I18N.years(n),

    formatNumber(n) {
      return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
    },

    async api(url, options = {}) {
      const res = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
          Accept: 'application/json',
          'X-Lang': I18N.lang,
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...options.headers,
        },
      });
      let data = null;
      try { data = await res.json(); } catch { /* ليست JSON */ }
      return { ok: res.ok, status: res.status, data: data || {} };
    },
  };
})();
