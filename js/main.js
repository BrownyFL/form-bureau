/* ============================================================
   FORM Architecture Bureau — main.js
   ============================================================ */

'use strict';

/* ---------- CustomEase ---------- */
gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('expo', '.76,0,.24,1');
CustomEase.create('out', '.16,1,.3,1');

/* ============================================================
   GLOBALS
   ============================================================ */
const isMobile = () => window.matchMedia('(max-width: 900px)').matches || ('ontouchstart' in window);

let locoScroll = null;

/* ============================================================
   1. PRELOADER
   ============================================================ */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const counterEl = document.getElementById('counter');
  const bar = document.querySelector('.preloader__bar');

  let count = 0;
  const target = 100;
  const duration = 2200; // ms
  const step = duration / target;

  const tick = setInterval(() => {
    count++;
    counterEl.textContent = count;
    bar.style.width = count + '%';
    if (count >= target) {
      clearInterval(tick);
      hidePreloader();
    }
  }, step);

  function hidePreloader() {
    gsap.to(preloader, {
      opacity: 0,
      duration: .8,
      ease: 'expo',
      delay: .3,
      onComplete: () => {
        preloader.style.display = 'none';
        startPageAnimations();
      }
    });
  }
}

/* ============================================================
   2. LOCOMOTIVE SCROLL
   ============================================================ */
function initLocoScroll() {
  if (isMobile()) return;

  locoScroll = new LocomotiveScroll({
    el: document.querySelector('#scroll-container'),
    smooth: true,
    multiplier: 0.85,
    lerp: 0.08,
    smartphone: { smooth: false },
    tablet: { smooth: false }
  });

  // Sync with GSAP ScrollTrigger
  locoScroll.on('scroll', ScrollTrigger.update);

  ScrollTrigger.scrollerProxy('#scroll-container', {
    scrollTop(value) {
      return arguments.length
        ? locoScroll.scrollTo(value, { duration: 0, disableLerp: true })
        : locoScroll.scroll.instance.scroll.y;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    pinType: document.querySelector('#scroll-container').style.transform ? 'transform' : 'fixed'
  });

  ScrollTrigger.addEventListener('refresh', () => locoScroll.update());
  ScrollTrigger.refresh();
}

/* ============================================================
   3. CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  if (isMobile()) return;

  const cursor = document.getElementById('cursor');
  const circle = cursor.querySelector('.cursor__circle');
  const dot    = cursor.querySelector('.cursor__dot');

  let mouseX = 0, mouseY = 0;
  let circleX = 0, circleY = 0;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    gsap.to(dot, { x: mouseX, y: mouseY, duration: 0, ease: 'none' });
  });

  // Circle follows with lag
  gsap.ticker.add(() => {
    circleX += (mouseX - circleX) * 0.12;
    circleY += (mouseY - circleY) * 0.12;
    gsap.set(circle, { x: circleX, y: circleY });
  });

  // Hover states
  const hoverEls = document.querySelectorAll('a, button, .project-card, .service-card');
  hoverEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
  });

  const linkEls = document.querySelectorAll('.nav__link, .contact__social, .footer__links a');
  linkEls.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-link'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-link'));
  });
}

/* ============================================================
   4. HERO ANIMATION  (runs after preloader)
   ============================================================ */
function startPageAnimations() {
  const tl = gsap.timeline({ defaults: { ease: 'out' } });

  // Letters
  tl.to('.hero__title-inner', {
    y: 0, opacity: 1,
    duration: 1.2,
    stagger: .08,
  })
  // Sub
  .to('.hero__sub-inner', {
    y: 0, opacity: 1,
    duration: .9,
  }, '-=.6')
  // Stats
  .to('.hero__meta', {
    opacity: 1,
    duration: .8,
  }, '-=.4')
  // Scroll indicator
  .to('.hero__scroll-indicator', {
    opacity: 1,
    duration: .6,
  }, '-=.2');

  // Animate counter from 0 to 157
  gsap.to({ val: 0 }, {
    val: 157,
    duration: 2.5,
    ease: 'power2.out',
    delay: 1.4,
    onUpdate() {
      const el = document.getElementById('projectsCounter');
      if (el) el.textContent = Math.round(this.targets()[0].val);
    }
  });
}

/* ============================================================
   5. ABOUT — reveal lines on scroll
   ============================================================ */
function initAbout() {
  const scroller = locoScroll ? '#scroll-container' : window;
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.about',
      scroller,
      start: 'top 75%',
      end: 'bottom 50%',
      toggleActions: 'play none none none',
    }
  });

  tl.to('.about__line', {
    y: 0, opacity: 1,
    duration: .9,
    stagger: .15,
    ease: 'out',
  })
  .to('.about__text', {
    y: 0, opacity: 1,
    duration: .8,
    stagger: .1,
    ease: 'out',
  }, '-=.4')
  .to('.btn-outline', {
    y: 0, opacity: 1,
    duration: .7,
    ease: 'out',
  }, '-=.3');
}

/* ============================================================
   6. PROJECTS — horizontal scroll
   ============================================================ */
function initHorizontalScroll() {
  const list        = document.getElementById('projectsList');
  const section     = document.querySelector('.projects');
  const fillEl      = document.getElementById('projectsProgressFill');
  const currentEl   = document.getElementById('projectsCurrent');
  const prevBtn     = document.getElementById('projectsPrev');
  const nextBtn     = document.getElementById('projectsNext');
  if (!list || !section || isMobile()) return;

  const cards      = Array.from(document.querySelectorAll('.project-card'));
  const totalCards = cards.length;
  let currentProgress = 0;

  function setup() {
    const amount = list.scrollWidth - window.innerWidth;
    section.style.height = (amount + window.innerHeight) + 'px';
    return amount;
  }

  let scrollAmount = setup();

  /* Update progress bar + counter */
  function updateUI(progress) {
    currentProgress = progress;
    if (fillEl) fillEl.style.width = (progress * 100) + '%';
    if (currentEl) {
      const idx = Math.min(totalCards, Math.floor(progress * totalCards) + 1);
      currentEl.textContent = String(idx).padStart(2, '0');
    }
    if (prevBtn) prevBtn.disabled = progress <= 0;
    if (nextBtn) nextBtn.disabled = progress >= 1;
  }

  /* Scroll to a specific card index */
  function scrollToCard(index) {
    const clampedIdx    = Math.max(0, Math.min(totalCards - 1, index));
    const cardWidth     = cards[0]?.offsetWidth || 0;
    const targetX       = cardWidth * clampedIdx;
    const sectionTop    = section.offsetTop;
    const sectionScroll = section.offsetHeight - window.innerHeight;
    const targetY       = sectionTop + (targetX / scrollAmount) * sectionScroll;

    if (locoScroll) {
      locoScroll.scrollTo(Math.round(targetY), {
        duration: 900,
        easing: [0.76, 0, 0.24, 1],
      });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  }

  /* Prev / Next buttons */
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const currentCard = Math.round(currentProgress * (totalCards - 1));
      scrollToCard(currentCard - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const currentCard = Math.round(currentProgress * (totalCards - 1));
      scrollToCard(currentCard + 1);
    });
  }

  /* Disable prev on start */
  updateUI(0);

  if (locoScroll) {
    locoScroll.on('scroll', ({ scroll }) => {
      const sectionTop    = section.offsetTop;
      const sectionScroll = section.offsetHeight - window.innerHeight;
      const progress      = Math.max(0, Math.min(1, (scroll.y - sectionTop) / sectionScroll));
      gsap.set(list, { x: -scrollAmount * progress });
      updateUI(progress);
    });

    setTimeout(() => locoScroll.update(), 100);
  } else {
    gsap.to(list, {
      x: () => -scrollAmount,
      ease: 'none',
      scrollTrigger: {
        trigger: '.projects',
        start: 'top top',
        end: () => '+=' + scrollAmount,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: self => updateUI(self.progress),
      },
    });
  }

  window.addEventListener('resize', () => {
    scrollAmount = setup();
    if (locoScroll) locoScroll.update();
    else ScrollTrigger.refresh();
  });
}

/* ============================================================
   BACK TO TOP
   ============================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const threshold = window.innerHeight * 0.6;

  function toggle(scrollY) {
    if (scrollY > threshold) {
      btn.classList.add('is-visible');
    } else {
      btn.classList.remove('is-visible');
    }
  }

  if (locoScroll) {
    locoScroll.on('scroll', ({ scroll }) => toggle(scroll.y));
  } else {
    window.addEventListener('scroll', () => toggle(window.scrollY));
  }

  btn.addEventListener('click', () => {
    if (locoScroll) {
      locoScroll.scrollTo(0, { duration: 1000, easing: [0.76, 0, 0.24, 1] });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  /* Cursor hover state */
  btn.addEventListener('mouseenter', () => {
    document.getElementById('cursor')?.classList.add('is-hovering');
  });
  btn.addEventListener('mouseleave', () => {
    document.getElementById('cursor')?.classList.remove('is-hovering');
  });
}

/* ============================================================
   7. THREE.JS
   ============================================================ */
function initThree() {
  const canvas = document.getElementById('threeCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, .1, 100);
  camera.position.z = 5;

  /* Wireframe icosahedron */
  const geo  = new THREE.IcosahedronGeometry(2.2, 1);
  const mat  = new THREE.MeshBasicMaterial({
    color: 0xf0e6d3,
    wireframe: true,
    transparent: true,
    opacity: .35,
  });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  /* Inner sphere */
  const innerGeo = new THREE.IcosahedronGeometry(1.2, 0);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xf0e6d3,
    wireframe: true,
    transparent: true,
    opacity: .12,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  scene.add(inner);

  /* Resize */
  function resize() {
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* Mouse tracking */
  let targetX = 0, targetY = 0;
  window.addEventListener('mousemove', e => {
    targetX = (e.clientX / window.innerWidth  - .5) * 1.5;
    targetY = (e.clientY / window.innerHeight - .5) * 1.5;
  });

  /* Render loop */
  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    mesh.rotation.y  = t * .12 + targetX * .5;
    mesh.rotation.x  = t * .08 + targetY * .4;
    inner.rotation.y = -t * .18;
    inner.rotation.x =  t * .14;

    renderer.render(scene, camera);
  })();

  /* Reveal text on scroll */
  const scroller = locoScroll ? '#scroll-container' : window;
  gsap.to(['.three-section__pre', '.three-section__heading', '.three-section__text'], {
    y: 0, opacity: 1,
    duration: .9, stagger: .15, ease: 'out',
    scrollTrigger: {
      trigger: '.three-section',
      scroller,
      start: 'top 65%',
    }
  });
}

/* ============================================================
   8. SERVICES — staggered reveal
   ============================================================ */
function initServices() {
  const scroller = locoScroll ? '#scroll-container' : window;
  gsap.to('.service-card', {
    y: 0, opacity: 1,
    duration: .8,
    stagger: .12,
    ease: 'out',
    scrollTrigger: {
      trigger: '.services__grid',
      scroller,
      start: 'top 75%',
    }
  });
}

/* ============================================================
   9. CONTACT — magnetic heading
   ============================================================ */
function initContactMagnetic() {
  const heading = document.getElementById('contactHeading');
  if (!heading || isMobile()) return;

  const section = document.querySelector('.contact__heading-wrap');

  section.addEventListener('mousemove', e => {
    const rect = heading.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = (e.clientX - cx) * .22;
    const dy = (e.clientY - cy) * .22;
    gsap.to(heading, { x: dx, y: dy, duration: .4, ease: 'out' });
  });

  section.addEventListener('mouseleave', () => {
    gsap.to(heading, { x: 0, y: 0, duration: .6, ease: 'expo' });
  });
}

/* ============================================================
   10. MAGNETIC BUTTONS
   ============================================================ */
function initMagnetic() {
  if (isMobile()) return;

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) * .3;
      const dy = (e.clientY - cy) * .3;
      gsap.to(el, { x: dx, y: dy, duration: .35, ease: 'out' });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: .55, ease: 'expo' });
    });
  });
}

/* ============================================================
   11. NAV — fade in after preloader + scroll behaviour
   ============================================================ */
function initNav() {
  gsap.from('.nav', { opacity: 0, y: -20, duration: .8, ease: 'out', delay: 2.8 });

  // Smooth scroll for anchor links (both loco and native)
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (locoScroll) {
        locoScroll.scrollTo(target, { offset: -80, duration: 1200, easing: [.76,0,.24,1] });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ============================================================
   12. FOOTER reveal
   ============================================================ */
function initFooter() {
  const scroller = locoScroll ? '#scroll-container' : window;
  gsap.from('.footer__logo, .footer__copy, .footer__links, .footer__bottom', {
    y: 30, opacity: 0,
    stagger: .1, duration: .7, ease: 'out',
    scrollTrigger: {
      trigger: '.footer',
      scroller,
      start: 'top 85%',
    }
  });
}

/* ============================================================
   13. RESIZE
   ============================================================ */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    ScrollTrigger.refresh();
    if (locoScroll) locoScroll.update();
  }, 200);
});

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initLocoScroll();
  initCursor();
  initAbout();
  initHorizontalScroll();
  initThree();
  initServices();
  initContactMagnetic();
  initMagnetic();
  initNav();
  initFooter();
  initBackToTop();
});
