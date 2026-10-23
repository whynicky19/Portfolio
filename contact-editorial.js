(() => {
  'use strict';
  const form = document.getElementById('contactForm');
  const submit = document.getElementById('cfSubmit');
  const label = document.getElementById('cfSubmitLabel');
  const feedback = document.getElementById('formFeedback');
  const title = document.getElementById('formFeedbackTitle');
  const copy = document.getElementById('formFeedbackCopy');
  const retry = document.getElementById('cfRetry');
  const fallback = document.getElementById('cfEmailFallback');
  const fields = ['cf-name','cf-email','cf-msg'].map(id => document.getElementById(id));
  let busy = false;
  let complete = false;
  function validate(field) {
    const value = field.value.trim();
    let error = '';
    if (!value) error = field.id === 'cf-name' ? 'Please enter your name.' : field.id === 'cf-email' ? 'Please enter your email address.' : 'Please write a message.';
    else if (field.id === 'cf-email') {
      field.value = value;
      if (field.validity.typeMismatch) error = 'Enter a valid email, like name@example.com.';
    }
    if (!error && field.validity.tooLong) error = 'Please shorten this field.';
    const message = document.getElementById(field.id + '-error');
    field.setAttribute('aria-invalid', String(Boolean(error)));
    message.textContent = error;
    message.hidden = !error;
    return !error;
  }
  fields.forEach(field => {
    field.addEventListener('blur', () => validate(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') validate(field);
    });
  });
  function mailto(data) {
    const subject = 'Portfolio contact from ' + data.get('name');
    const body = 'Name: ' + data.get('name') + '\nEmail: ' + data.get('email') + '\n\n' + data.get('message');
    return 'mailto:alimzhanart@icloud.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function state(name, heading, description, data) {
    feedback.hidden = false;
    feedback.dataset.state = name;
    title.textContent = heading;
    copy.textContent = description;
    retry.hidden = name !== 'error';
    fallback.hidden = name !== 'error';
    if (data) fallback.href = mailto(data);
    submit.disabled = name === 'sending' || name === 'success';
    form.setAttribute('aria-busy', String(name === 'sending'));
    label.textContent = name === 'sending' ? 'Sending…' : name === 'success' ? 'Sent' : 'Send message';
    feedback.tabIndex = -1;
    if (name !== 'sending') feedback.focus({preventScroll:true});
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || complete) return;
    const valid = fields.map(validate);
    if (valid.includes(false)) { fields[valid.indexOf(false)].focus(); return; }
    const data = new FormData(form);
    fields.forEach(field => data.set(field.name, field.value.trim()));
    if (String(data.get('_gotcha') || '').trim()) {
      state('error','The message was not sent.','Please use email or Telegram to get in touch.',data);
      return;
    }
    busy = true;
    state('sending','Sending your message…','Please keep this page open for a moment.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(form.action, {method:'POST',body:data,headers:{Accept:'application/json'},signal:controller.signal});
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok === false || result?.errors?.length) {
        state('error','The message was not sent.','Please try again, or open your email app with your message prepared.',data);
      } else {
        complete = true;
        form.dataset.complete = 'true';
        form.reset();
        state('success','Message sent.','Thank you for reaching out. I’ll get back to you as soon as I can.');
      }
    } catch {
      state('error','The message was not sent.','Check your connection and try again, or open your email app with your message prepared.',data);
    } finally {
      clearTimeout(timeout);
      busy = false;
    }
  });
  retry.addEventListener('click', () => form.requestSubmit());
  // Native required/type validation still works if this script is unavailable.
  form.noValidate = true;

  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  const hero = document.querySelector('.contact-hero');
  window.addEventListener('pagehide', () => hero?.classList.remove('contact-play'));
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !hero || motion.matches) return;
    hero.classList.remove('contact-play');
    void hero.offsetWidth;
    hero.classList.add('contact-play');
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (motion.matches || !entry.target.animate) return;
      const animation = entry.target.animate([{transform:'translateY(16px)'},{transform:'none'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
      animations.add(animation);
      animation.finished.catch(() => {}).finally(() => animations.delete(animation));
    }),{threshold:0,rootMargin:'0px 0px 80px 0px'});
    document.querySelectorAll('.contact-intro,.message-panel,.contact-direct-heading,.contact-channel').forEach(element => observer.observe(element));
  }
  motion.addEventListener('change', () => { if (motion.matches) animations.forEach(animation => animation.cancel()); });
})();
