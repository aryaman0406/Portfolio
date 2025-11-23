'use strict';

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

const headerEl = $('[data-header]');
const navToggle = $('[data-nav-toggle-btn]');
const navLinks = $$('[data-nav-link]');
const backTopBtn = $('[data-back-to-top]');

// Ensure accessible attributes exist
if(navToggle){ navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-controls', 'primary-navigation'); }

// NAV toggle (mobile)
if (navToggle && headerEl) {
  navToggle.addEventListener('click', () => {
    const isOpen = headerEl.classList.toggle('nav-active');
    navToggle.classList.toggle('active');
    try{ navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false'); }catch(e){}
    animateNavItems(isOpen);
  });
}

// collapse nav on link click (mobile)
navLinks.forEach(link => link.addEventListener('click', () => {
  if (headerEl && headerEl.classList.contains('nav-active')) {
    headerEl.classList.remove('nav-active');
    navToggle && navToggle.classList.remove('active');
  }
}));

// back-to-top and header active on scroll
window.addEventListener('scroll', () => {
  if (!headerEl || !backTopBtn) return;
  if (window.scrollY >= 100) {
    headerEl.classList.add('active');
    backTopBtn.classList.add('active');
  } else {
    headerEl.classList.remove('active');
    backTopBtn.classList.remove('active');
  }
});

// Back to top click handler
if(backTopBtn){
  backTopBtn.addEventListener('click', (e)=>{ e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); });
}

// --- Reveal on scroll (IntersectionObserver fallback) ---
try{
  const animated = $$('[data-animate], .animate, .portfolio-card, .timeline-item, .hero-card');
  if(animated.length){
    const obs = new IntersectionObserver((entries, o)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const el = entry.target;
          const type = el.dataset.animate || 'fade-up';
          if(type === 'fade-up') el.classList.add('fade-up');
          if(type === 'fade-in') el.classList.add('fade-in');
          const d = el.dataset.animateDelay || el.getAttribute('data-animate-delay');
          if(d) el.style.animationDelay = d;
          el.classList.add('in-view');
          o.unobserve(el);
        }
      });
    },{threshold:0.12});
    animated.forEach(a=>obs.observe(a));
  }
}catch(e){/* graceful fallback */}

// animate nav items helper
function animateNavItems(open){
  const items = Array.from(document.querySelectorAll('.navbar-list li'));
  items.forEach((li,i)=>{
    if(open){ li.style.animation = `navItemIn .36s ease ${i*70}ms both`; }
    else { li.style.animation = ''; }
  });
}

/* Theme toggle (light/dark) */
const themeToggleBtn = $('[data-theme-toggle]') || document.getElementById('theme-toggle');

function applyTheme(theme){
  if(theme === 'light'){
    document.documentElement.setAttribute('data-theme','light');
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    if(themeToggleBtn) themeToggleBtn.innerHTML = '🌞';
  } else {
    document.documentElement.setAttribute('data-theme','dark');
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    if(themeToggleBtn) themeToggleBtn.innerHTML = '🌙';
  }
}

(function initTheme(){
  try{
    const saved = localStorage.getItem('site-theme');
    if(saved) applyTheme(saved);
    else {
      // default to dark unless prefers-color-scheme: light
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  } catch(e){ applyTheme('dark'); }
})();

themeToggleBtn && themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || (document.body.classList.contains('dark') ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try{ localStorage.setItem('site-theme', next); }catch(e){}
});

/* Smooth internal links */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e){
    const href = this.getAttribute('href');
    if(!href || href === '#' || href === '#!') return;
    if(href.startsWith('#')){
      const el = document.querySelector(href);
      if(el){
        e.preventDefault();
        el.scrollIntoView({behavior:'smooth',block:'start'});
      }
    }
  });
});

// Make portfolio cards keyboard-accessible and respect external links
$$('.portfolio-card').forEach(card => {
  card.setAttribute('tabindex','0');
  card.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); } });
  card.addEventListener('click', function(e){
    const anchor = this.closest('a');
    if(anchor && (e.metaKey || e.ctrlKey || e.shiftKey)) return;
  });
});

/* 3D tilt interaction */
function prefersReducedMotion(){ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches }catch(e){ return false } }

function initTilt(){
  if(prefersReducedMotion()) return;
  if(('ontouchstart' in window) || navigator.maxTouchPoints > 0) return; // avoid on touch devices

  const tiltTargets = Array.from(document.querySelectorAll('.tilt-card'));
  tiltTargets.forEach(el => {
    let raf = null;
    const rect = () => el.getBoundingClientRect();
    const strength = parseFloat(el.dataset.tiltStrength) || 12; // degrees

    function onMove(e){
      const r = rect();
      const x = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      const rotY = x * strength * -1; // invert for natural tilt
      const rotX = y * strength;

      if(raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
        const layers = el.querySelectorAll('.depth-layer');
        layers.forEach((layer,idx)=>{
          const depth = (idx+1) * 6; // px
          const lx = x * depth * 8; const ly = y * depth * -8;
          layer.style.transform = `translate3d(${lx}px, ${ly}px, ${depth}px) rotateY(${rotY/6}deg)`;
        });
      });
    }

    function onLeave(){
      if(raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        el.style.transform = '';
        const layers = el.querySelectorAll('.depth-layer');
        layers.forEach(layer=>{ layer.style.transform = ''; });
      });
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('blur', onLeave);
  });
}

// Initialize tilt on DOM ready
document.addEventListener('DOMContentLoaded', initTilt);

/* Accessible project modal with FLIP clone expansion */
const modal = $('#project-modal');
const modalTitle = $('#modal-title');
const modalDesc = $('#modal-desc');
const modalLink = $('#modal-link');
const modalCloseButtons = $$('[data-modal-close]');

let _lastFocused = null;

function openModal(){
  if(!modal) return;
  _lastFocused = document.activeElement;
  try{ if(typeof modal.showModal === 'function') modal.showModal(); else modal.style.display = 'block'; }catch(e){ modal.style.display = 'block'; }
  modal.setAttribute('aria-hidden','false');
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  const focusable = modal.querySelector('button, a, [tabindex]:not([tabindex="-1"])');
  (focusable || modal).focus();
  document.addEventListener('keydown', _handleModalKeydown);
}

function closeModal(){
  if(!modal) return;

  const origin = modal.dataset.originRect;
  const openCloneHTML = modal.dataset.openClone;
  if(origin && openCloneHTML){
    try{
      const originRect = JSON.parse(origin);
      const temp = document.createElement('div'); temp.innerHTML = openCloneHTML.trim();
      const revClone = temp.firstElementChild;
      if(revClone){
        revClone.classList.add('flip-clone');
        const modalRect = modal.getBoundingClientRect();
        revClone.style.position = 'fixed';
        revClone.style.left = modalRect.left + 'px';
        revClone.style.top = modalRect.top + 'px';
        revClone.style.width = modalRect.width + 'px';
        revClone.style.height = modalRect.height + 'px';
        revClone.style.margin = 0;
        revClone.style.transition = 'all 520ms cubic-bezier(.2,.9,.3,1)';
        document.body.appendChild(revClone);

        requestAnimationFrame(()=>{
          revClone.style.left = originRect.left + 'px';
          revClone.style.top = originRect.top + 'px';
          revClone.style.width = originRect.width + 'px';
          revClone.style.height = originRect.height + 'px';
          revClone.style.borderRadius = '12px';
          revClone.style.boxShadow = '0 12px 30px rgba(2,6,23,0.4)';
        });

        const cleanupReverse = ()=>{
          try{ revClone.remove(); }catch(e){}
          try{ delete modal.dataset.openClone; delete modal.dataset.originRect; }catch(e){}
          try{ if(typeof modal.close === 'function') modal.close(); else modal.style.display = 'none'; }catch(e){ modal.style.display = 'none'; }
          modal.setAttribute('aria-hidden','true');
          modal.classList.remove('open');
          document.body.classList.remove('modal-open');
          document.removeEventListener('keydown', _handleModalKeydown);
          try{ _lastFocused && _lastFocused.focus(); }catch(e){}
        };

        revClone.addEventListener('transitionend', cleanupReverse);
        setTimeout(cleanupReverse, 700);
        return;
      }
    }catch(err){}
  }

  try{ if(typeof modal.close === 'function') modal.close(); else modal.style.display = 'none'; }catch(e){ modal.style.display = 'none'; }
  modal.setAttribute('aria-hidden','true');
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  document.removeEventListener('keydown', _handleModalKeydown);
  try{ _lastFocused && _lastFocused.focus(); }catch(e){}
}

function _handleModalKeydown(e){
  if(e.key === 'Escape') return closeModal();
  if(e.key === 'Tab'){
    const focusable = Array.from(modal.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])')).filter(n=>!n.disabled && n.offsetParent !== null);
    if(focusable.length === 0) return;
    const first = focusable[0], last = focusable[focusable.length-1];
    if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  }
}

// Add FLIP open animation for .portfolio-card clicks
$$('.portfolio-card, .portfolio-card *').forEach(el => {
  // we attach on ancestor anchor clicks later in the clone creator
});

$$('.portfolio-card').forEach(card => {
  card.addEventListener('click', function(e){
    const anchor = this.closest('a');
    if(anchor && (e.metaKey || e.ctrlKey || e.shiftKey)) return;

    e.preventDefault();

    const href = anchor ? anchor.getAttribute('href') : null;
    const isExternal = href && /^https?:\/\//i.test(href) && !href.includes(location.hostname);
    const rect = this.getBoundingClientRect();

    // Clone and expand
    const clone = this.cloneNode(true);
    clone.classList.add('flip-clone');
    clone.removeAttribute('tabindex');
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.margin = 0;
    clone.style.transition = 'all 520ms cubic-bezier(.2,.9,.3,1)';
    document.body.appendChild(clone);
    clone.getBoundingClientRect();

    requestAnimationFrame(() => {
      clone.style.left = '4vw';
      clone.style.top = '4vh';
      clone.style.width = '92vw';
      clone.style.height = '92vh';
      clone.style.borderRadius = '12px';
      clone.style.boxShadow = '0 40px 90px rgba(2,6,23,0.6)';
    });

    const cleanupAndOpen = () => {
      if(href && href !== '#' && href !== '' && href !== null){
        setTimeout(() => {
          if(isExternal){
            if(anchor && anchor.target === '_blank') window.open(href, '_blank');
            else window.location.href = href;
          } else {
            const titleEl = this.querySelector('.card-title');
            const subtitleEl = this.querySelector('.card-subtitle');
            const title = titleEl ? titleEl.textContent.trim() : (subtitleEl? subtitleEl.textContent.trim(): 'Project');
            if(modalTitle) modalTitle.textContent = title;
            if(modalDesc) modalDesc.textContent = 'A deeper look at ' + title + '. This demo modal can contain project details, tech stack and screenshots.';
            if(modalLink) modalLink.href = href && href !== '#' ? href : '#';
            openModal();
          }
          try{ modal.dataset.openClone = clone.outerHTML; modal.dataset.originRect = JSON.stringify(rect); }catch(e){}
          try{ clone.remove(); }catch(e){}
        }, 120);
      } else {
        const titleEl = this.querySelector('.card-title');
        const subtitleEl = this.querySelector('.card-subtitle');
        const title = titleEl ? titleEl.textContent.trim() : (subtitleEl? subtitleEl.textContent.trim(): 'Project');
        if(modalTitle) modalTitle.textContent = title;
        if(modalDesc) modalDesc.textContent = 'A deeper look at ' + title + '. This demo modal can contain project details, tech stack and screenshots.';
        if(modalLink) modalLink.href = '#';
        try{ modal.dataset.openClone = clone.outerHTML; modal.dataset.originRect = JSON.stringify(rect); }catch(e){}
        openModal();
        try{ clone.remove(); }catch(e){}
      }
    };

    const onTransitionEnd = (ev) => {
      if(ev.target === clone){
        clone.removeEventListener('transitionend', onTransitionEnd);
        cleanupAndOpen();
      }
    };

    clone.addEventListener('transitionend', onTransitionEnd);

    setTimeout(() => {
      if(document.body.contains(clone)){
        try{ clone.removeEventListener('transitionend', onTransitionEnd); }catch(e){}
        cleanupAndOpen();
      }
    }, 800);
  });
});

modalCloseButtons.forEach(btn => btn.addEventListener('click', closeModal));
if(modal) modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

/* Contact form (mailto) */
const contactForm = document.querySelector('.contact-form');
if(contactForm){
  contactForm.addEventListener('submit', function(e){
    e.preventDefault();
    const submit = this.querySelector('.btn-submit');
    const name = (this.querySelector('input[name="name"]')||{}).value || '';
    const email = (this.querySelector('input[name="email"]')||{}).value || '';
    const message = (this.querySelector('textarea[name="message"]')||{}).value || '';
    if(!name || !email || !message){
      alert('Please fill in your name, email and message before sending.');
      return;
    }
    if(submit) submit.textContent = 'Opening email...';
    const to = 'aryamangarg2005@gmail.com';
    const subject = encodeURIComponent('Portfolio Contact from ' + name);
    const body = encodeURIComponent(message + '\n\n--\nContact: ' + name + ' <' + email + '>');
    const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
    try{
      window.location.href = mailto;
    }catch(err){
      window.open(mailto,'_blank');
    }
    setTimeout(()=>{ if(submit) submit.textContent = 'Submit Message'; this.reset(); }, 1200);
  });
}

/* CV download HEAD check */
const cvLink = $('#cv-download');
if(cvLink){
  cvLink.addEventListener('click', async function(e){
    try{
      const resp = await fetch(this.getAttribute('href'), { method: 'HEAD' });
      if(!resp.ok){
        e.preventDefault();
        alert('Resume file not found at "./assets/resume.pdf".\n\nPlease copy your PDF into the site folder at `assets/resume.pdf` (filename: resume.pdf). If you want, I can add it for you — upload the PDF to the repo or place it in the `assets` folder.');
      }
    }catch(err){
      // network or file:// — ignore and allow the browser to try.
    }
  });
}

/* Print resume */
const printBtn = $('#print-resume');
if(printBtn){
  printBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    try{ window.print(); }catch(err){ console.warn('Print not available', err); }
  });
}

/* Small accessibility: keyboard focus ring for interactive cards */
$$('.portfolio-card, .btn, .navbar-link').forEach(el=>{
  el.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') el.click(); });
});
