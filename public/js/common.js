'use strict';

/* أدوات مشتركة لصفحات الموقع */
(function () {
  // عرض اسم الجهة نصيًا إذا لم يتوفر ملف الشعار
  function logoFallback(img) {
    const span = document.createElement('span');
    span.className = 'logo-fallback';
    span.textContent = img.dataset.fallback || img.alt;
    img.replaceWith(span);
  }
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    if (img.complete && img.naturalWidth === 0) logoFallback(img);
    else img.addEventListener('error', () => logoFallback(img), { once: true });
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

    /** صيغة "سنة" الصحيحة بحسب العدد */
    years(n) {
      const a = Math.abs(n);
      if (a === 1) return 'سنة واحدة';
      if (a === 2) return 'سنتان';
      if (a >= 3 && a <= 10) return `${a} سنوات`;
      return `${a} سنة`;
    },

    formatNumber(n) {
      return Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
    },

    async api(url, options = {}) {
      const res = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
      });
      let data = null;
      try { data = await res.json(); } catch { /* ليست JSON */ }
      return { ok: res.ok, status: res.status, data: data || {} };
    },
  };
})();
