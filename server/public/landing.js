document.querySelectorAll('form.signup').forEach((form) => {
  const msg = form.parentElement.querySelector('.msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    msg.className = 'msg';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Enter a valid email address.'; msg.classList.add('err'); return; }
    const btn = form.querySelector('button'); btn.disabled = true; msg.textContent = 'Saving…';
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, company: form.company.value, source: 'landing' }) });
      if (!res.ok) throw new Error(String(res.status));
      form.reset(); msg.textContent = "You're on the list. We'll email you when the phone app is ready."; msg.classList.add('ok');
    } catch (err) {
      msg.textContent = "Couldn't save that right now. Try again in a minute."; msg.classList.add('err');
    } finally { btn.disabled = false; }
  });
});
