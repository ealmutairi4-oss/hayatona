'use strict';

(function () {
  const form = document.getElementById('login-form');
  const alertBox = document.getElementById('login-alert');
  const btn = document.getElementById('login-btn');

  document.addEventListener('langchange', () => alertBox.classList.remove('is-visible'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.remove('is-visible');
    const username = form.elements.username.value.trim();
    const password = form.elements.password.value;
    if (!username || !password) {
      alertBox.textContent = I18N.t('login.missing');
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
      alertBox.textContent = data.error || I18N.t('login.failed');
    } catch {
      alertBox.textContent = I18N.t('login.offline');
    }
    alertBox.classList.add('is-visible');
    form.elements.password.value = '';
    btn.disabled = false;
    btn.classList.remove('is-loading');
  });
})();
