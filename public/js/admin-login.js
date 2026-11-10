'use strict';

(function () {
  const form = document.getElementById('login-form');
  const alertBox = document.getElementById('login-alert');
  const btn = document.getElementById('login-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.remove('is-visible');
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;
    if (!username || !password) {
      alertBox.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور.';
      alertBox.classList.add('is-visible');
      return;
    }
    btn.disabled = true;
    btn.classList.add('is-loading');
    try {
      const { ok, data } = await BA.api('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (ok) { window.location.replace('/admin'); return; }
      alertBox.textContent = data.error || 'تعذر تسجيل الدخول.';
    } catch {
      alertBox.textContent = 'تعذر الاتصال بالخادم.';
    }
    alertBox.classList.add('is-visible');
    form.elements.password.value = '';
    btn.disabled = false;
    btn.classList.remove('is-loading');
  });
})();
