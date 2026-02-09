'use strict';

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

const headerEl = $('[data-header]');
const navToggle = $('[data-nav-toggle-btn]');
const navLinks = $$('[data-nav-link]');
const backTopBtn = $('[data-back-to-top]');

// Ensure accessible attributes exist
if (navToggle) { navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-controls', 'primary-navigation'); }

// NAV toggle (mobile)
if (navToggle && headerEl) {
  navToggle.addEventListener('click', () => {
    const isOpen = headerEl.classList.toggle('nav-active');
    navToggle.classList.toggle('active');
    try { navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false'); } catch (e) { }
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
if (backTopBtn) {
  backTopBtn.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

// --- Reveal on scroll (IntersectionObserver fallback) ---
try {
  const animated = $$('[data-animate], .animate, .portfolio-card, .timeline-item, .hero-card');
  if (animated.length) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const type = el.dataset.animate || 'fade-up';
          if (type === 'fade-up') el.classList.add('fade-up');
          if (type === 'fade-in') el.classList.add('fade-in');
          const d = el.dataset.animateDelay || el.getAttribute('data-animate-delay');
          if (d) el.style.animationDelay = d;
          el.classList.add('in-view');
          o.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    animated.forEach(a => obs.observe(a));
  }
} catch (e) {/* graceful fallback */ }

// animate nav items helper
function animateNavItems(open) {
  const items = Array.from(document.querySelectorAll('.navbar-list li'));
  items.forEach((li, i) => {
    if (open) { li.style.animation = `navItemIn .36s ease ${i * 70}ms both`; }
    else { li.style.animation = ''; }
  });
}

// Theme feature removed - always dark
document.documentElement.setAttribute('data-theme', 'dark');
document.body.classList.add('dark');

/* Smooth internal links */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href === '#' || href === '#!') return;
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

// Make portfolio cards keyboard-accessible and respect external links
$$('.portfolio-card').forEach(card => {
  card.setAttribute('tabindex', '0');
  card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.click(); } });
  card.addEventListener('click', function (e) {
    const anchor = this.closest('a');
    if (anchor && (e.metaKey || e.ctrlKey || e.shiftKey)) return;
  });
});

/* 3D tilt interaction */
function prefersReducedMotion() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) { return false } }

function initTilt() {
  if (prefersReducedMotion()) return;
  if (('ontouchstart' in window) || navigator.maxTouchPoints > 0) return; // avoid on touch devices

  const tiltTargets = Array.from(document.querySelectorAll('.tilt-card'));
  tiltTargets.forEach(el => {
    let raf = null;
    const rect = () => el.getBoundingClientRect();
    const strength = parseFloat(el.dataset.tiltStrength) || 12; // degrees

    function onMove(e) {
      const r = rect();
      const x = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
      const y = (e.clientY - r.top) / r.height - 0.5;
      const rotY = x * strength * -1; // invert for natural tilt
      const rotX = y * strength;

      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
        const layers = el.querySelectorAll('.depth-layer');
        layers.forEach((layer, idx) => {
          const depth = (idx + 1) * 6; // px
          const lx = x * depth * 8; const ly = y * depth * -8;
          layer.style.transform = `translate3d(${lx}px, ${ly}px, ${depth}px) rotateY(${rotY / 6}deg)`;
        });
      });
    }

    function onLeave() {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = '';
        const layers = el.querySelectorAll('.depth-layer');
        layers.forEach(layer => { layer.style.transform = ''; });
      });
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    el.addEventListener('blur', onLeave);
  });
}

/* Three.js 3D Background */
function init3DBackground() {
  const canvas = document.querySelector('#canvas-3d');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // 3D Grid
  const gridSize = 100;
  const gridDivisions = 50;
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x22d3ee, 0x1e293b);
  gridHelper.rotation.x = Math.PI / 2.5;
  gridHelper.position.y = -10;
  scene.add(gridHelper);

  // Particles
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 2000;
  const posArray = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 100;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x818cf8,
    transparent: true,
    opacity: 0.8
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Mouse interactivity
  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  });

  function animate() {
    requestAnimationFrame(animate);

    particlesMesh.rotation.y += 0.001;
    particlesMesh.rotation.x += 0.0005;

    // Smooth camera movement based on mouse
    camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
    camera.position.y += (mouseY * -10 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    gridHelper.rotation.z += 0.0002;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* Typewriter Effect */
function initTypewriter() {
  const elements = document.querySelectorAll('.typewriter');
  elements.forEach(el => {
    const words = JSON.parse(el.dataset.text);
    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typeSpeed = 150;

    function type() {
      const currentWord = words[wordIdx];
      if (isDeleting) {
        el.textContent = currentWord.substring(0, charIdx - 1);
        charIdx--;
        typeSpeed = 75;
      } else {
        el.textContent = currentWord.substring(0, charIdx + 1);
        charIdx++;
        typeSpeed = 150;
      }

      if (!isDeleting && charIdx === currentWord.length) {
        isDeleting = true;
        typeSpeed = 2000; // Pause at end
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        wordIdx = (wordIdx + 1) % words.length;
        typeSpeed = 500;
      }

      setTimeout(type, typeSpeed);
    }

    type();
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initTilt();
  init3DBackground();
  initTypewriter();
  initCustomCursor();
});

/* Terminal Preloader Logic */
function initPreloader() {
  const terminal = $('#preloader-terminal');
  const preloader = $('#preloader');
  if (!terminal || !preloader) return;

  const lines = [
    { text: 'loading_assets...', color: '#38bdf8' },
    { text: 'establishing_secure_connection... [OK]', color: '#27c93f' },
    { text: 'parsing_portfolio_data... [OK]', color: '#38bdf8' },
    { text: 'initializing_3d_engine... [OK]', color: '#818cf8' },
    { text: 'system_ready. launch(aryaman_garg)', color: '#f472b6' }
  ];

  let currentLine = 0;

  function addLine() {
    if (currentLine < lines.length) {
      const lineEl = document.createElement('div');
      lineEl.className = 'line';
      lineEl.innerHTML = `<span class="prompt">></span> <span style="color: ${lines[currentLine].color}">${lines[currentLine].text}</span>`;
      terminal.appendChild(lineEl);
      currentLine++;
      setTimeout(addLine, 200 + Math.random() * 300);
    } else {
      setTimeout(() => {
        preloader.classList.add('fade-out');
        document.body.classList.remove('loading');
        document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('in-view'));
      }, 600);
    }
  }

  document.body.classList.add('loading');
  setTimeout(addLine, 500);
}

/* Custom Cursor Logic */
function initCustomCursor() {
  const glow = document.querySelector('#cursor-glow');
  const outline = document.querySelector('#cursor-outline');
  if (!glow || !outline) return;

  window.addEventListener('mousemove', (e) => {
    const { clientX: x, clientY: y } = e;

    glow.style.left = `${x}px`;
    glow.style.top = `${y}px`;

    // Slight delay for the outline for a "fluid" feel
    setTimeout(() => {
      outline.style.left = `${x}px`;
      outline.style.top = `${y}px`;
    }, 50);
  });

  // Add active class on hoverable elements
  const hoverables = 'a, button, .portfolio-card, .skill-tag, .terminal-fab';
  document.querySelectorAll(hoverables).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
  });
}

/* Portfolio & Interaction Logic */
document.addEventListener('DOMContentLoaded', () => {
  // Contact form
  const contactForm = document.querySelector('#contact-form');
  const formStatus = document.querySelector('#form-status');

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const submitBtn = this.querySelector('.btn-submit');
      const btnText = submitBtn.querySelector('.btn-text');
      const btnLoader = submitBtn.querySelector('.btn-loader');
      const formData = new FormData(this);

      // UI Loading state
      btnText.textContent = 'Sending...';
      btnLoader.classList.remove('visually-hidden');
      submitBtn.disabled = true;
      formStatus.textContent = '';
      formStatus.className = 'form-status';

      try {
        // Simulation of a backend request
        // To use real Formspree: uncomment below and replace YOUR_ID
        /*
        const response = await fetch('https://formspree.io/f/YOUR_ID', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error();
        */

        // For demo: artificial delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Success state
        btnText.textContent = 'Sent Successfully!';
        btnLoader.classList.add('visually-hidden');
        submitBtn.classList.add('btn-success');
        formStatus.textContent = "Thanks! I'll get back to you soon.";
        formStatus.classList.add('success');
        this.reset();

        setTimeout(() => {
          btnText.textContent = 'Send Message';
          submitBtn.classList.remove('btn-success');
          submitBtn.disabled = false;
        }, 5000);

      } catch (err) {
        // Error state
        btnText.textContent = 'Error!';
        btnLoader.classList.add('visually-hidden');
        formStatus.textContent = 'Something went wrong. Please try again.';
        formStatus.classList.add('error');
        submitBtn.disabled = false;
      }
    });
  }

  // Interactive Terminal Logic
  const terminalOverlay = $('#interactive-terminal');
  const terminalFab = $('#terminal-fab');
  const closeTerminal = $('#close-terminal');
  const terminalInput = $('#terminal-input');
  const terminalOutput = $('#terminal-output');

  if (terminalFab && terminalOverlay) {
    terminalFab.addEventListener('click', () => {
      terminalOverlay.classList.remove('hidden');
      terminalInput.focus();
    });

    closeTerminal.addEventListener('click', () => {
      terminalOverlay.classList.add('hidden');
    });

    // Close on escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') terminalOverlay.classList.add('hidden');
    });

    // Handle commands
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = terminalInput.value.trim().toLowerCase();
        terminalInput.value = '';
        executeCommand(cmd);
      }
    });
  }

  function executeCommand(cmd) {
    const line = document.createElement('div');
    line.className = 'line';
    line.innerHTML = `<span class="prompt">$</span> ${cmd}`;
    terminalOutput.appendChild(line);

    const response = document.createElement('div');
    response.className = 'line';

    const parts = cmd.split(' ');
    const baseCmd = parts[0];

    switch (baseCmd) {
      case 'help':
        response.innerHTML = `Available commands:<br>
          - <b>goto [section]</b>: Navigate to a section (home, skills, portfolio, contact)<br>
          - <b>whoami</b>: Display info about Aryaman<br>
          - <b>ls</b>: List portfolio sections<br>
          - <b>clear</b>: Clear terminal<br>
          - <b>exit</b>: Close terminal`;
        break;
      case 'goto':
        const target = parts[1];
        const el = document.querySelector(`#${target}`);
        if (el) {
          response.innerHTML = `Navigating to ${target}...`;
          terminalOverlay.classList.add('hidden');
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          response.innerHTML = `Section '${target}' not found. Try: home, skills, portfolio, contact`;
        }
        break;
      case 'whoami':
        response.innerHTML = `Aryaman Garg<br>B.Tech CSE Student @ VIT Bhopal<br>AI & Web Enthusiast.`;
        break;
      case 'ls':
        response.innerHTML = `home, education, experience, skills, portfolio, contact`;
        break;
      case 'clear':
      case 'cls':
        terminalOutput.innerHTML = '';
        return;
      case 'exit':
        terminalOverlay.classList.add('hidden');
        return;
      case '':
        return;
      default:
        response.innerHTML = `Command not found: ${baseCmd}. Type 'help' for assistance.`;
    }

    terminalOutput.appendChild(response);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  // CV Download
  const cvLink = $('#cv-download');
  if (cvLink) {
    cvLink.addEventListener('click', async (e) => {
      const resp = await fetch(cvLink.href, { method: 'HEAD' }).catch(() => ({ ok: true }));
      if (!resp.ok) {
        e.preventDefault();
        alert('Resume file not found in assets folder.');
      }
    });
  }

  // Accessibility & Misc
  $$('.portfolio-card, .btn, .navbar-link').forEach(el => {
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') el.click(); });
  });
});
