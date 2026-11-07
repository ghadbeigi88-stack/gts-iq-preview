/* =========================================================
   Gts-IQ — Gateway Travel Success
   Front-end interactions (static mockup, no backend)
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WA = "https://wa.me/9647722228718";
  // touch screens: cheaper drawing (no blur filters, lighter smoothing while moving)
  const touch = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  // frame-rate independent easing: the same feel on 60 Hz and 120 Hz screens
  const follow = (k, dt) => 1 - Math.pow(1 - k, Math.min(64, dt || 16.7) / 16.7);
  // the mobile address bar shows/hides while swiping and fires "resize" with only the height
  // changed; the scenes are sized in svh, so on touch screens those events are ignored
  let forceResize = false;
  const onResize = fn => {
    let w0 = window.innerWidth;
    window.addEventListener("resize", () => {
      if (touch && !forceResize && window.innerWidth === w0) return;
      w0 = window.innerWidth;
      fn();
    });
  };
  const I18N = window.GTS_I18N || { en: {}, js: {} };
  const root = document.documentElement;

  /* ---------- Language (Arabic default / English) ---------- */
  // Arabic text is kept in the HTML; remember it so we can switch back.
  const original = new Map();
  $$("[data-i18n]").forEach(el => original.set(el, { html: el.innerHTML }));
  $$("[data-i18n-ph]").forEach(el => original.set(el, Object.assign(original.get(el) || {}, { ph: el.placeholder })));
  $$("[data-i18n-aria]").forEach(el => original.set(el, Object.assign(original.get(el) || {}, { aria: el.getAttribute("aria-label") })));
  $$("[data-i18n-alt]").forEach(el => original.set(el, Object.assign(original.get(el) || {}, { alt: el.alt })));
  $$("[data-i18n-content]").forEach(el => original.set(el, Object.assign(original.get(el) || {}, { content: el.content })));

  let lang = root.lang === "en" ? "en" : "ar";
  const T = () => I18N.js[lang];

  const applyLang = l => {
    lang = l;
    const en = l === "en", dict = I18N.en;
    root.lang = l;
    root.dir = en ? "ltr" : "rtl";
    $$("[data-i18n]").forEach(el => {
      const k = el.dataset.i18n;
      el.innerHTML = en && dict[k] != null ? dict[k] : original.get(el).html;
    });
    $$("[data-i18n-ph]").forEach(el => { const k = el.dataset.i18nPh; el.placeholder = en && dict[k] ? dict[k] : original.get(el).ph; });
    $$("[data-i18n-aria]").forEach(el => { const k = el.dataset.i18nAria; el.setAttribute("aria-label", en && dict[k] ? dict[k] : original.get(el).aria); });
    $$("[data-i18n-alt]").forEach(el => { const k = el.dataset.i18nAlt; el.alt = en && dict[k] ? dict[k] : original.get(el).alt; });
    $$("[data-i18n-content]").forEach(el => { const k = el.dataset.i18nContent; el.content = en && dict[k] ? dict[k] : original.get(el).content; });
    $$("[data-price]").forEach(el => { el.textContent = T().price(+el.dataset.price); });
    $$("[data-split]").forEach(splitWords);
    const activeTab = $(".planner-tabs .is-active");
    if (activeTab && $("#pWish")) $("#pWish").placeholder = T().ph[activeTab.dataset.tab];
    const modal = $("#plannerModal");
    if (modal && !modal.hidden) { modal.hidden = true; document.body.style.overflow = ""; }
    try { localStorage.setItem("gts-lang", l); } catch (e) { /* storage unavailable */ }
    document.dispatchEvent(new CustomEvent("gts:lang", { detail: l }));
  };

  /* ---------- Animation 1: hero headline word reveal ---------- */
  function splitWords(el) {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const span = document.createElement("span");
            span.className = "w";
            span.textContent = part;
            span.style.animationDelay = (0.25 + i++ * 0.09) + "s";
            frag.appendChild(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR" && !child.classList.contains("w")) {
          walk(child);
        }
      });
    };
    walk(el);
  }

  applyLang(lang);
  const langToggle = $("#langToggle");
  if (langToggle) langToggle.addEventListener("click", () => applyLang(lang === "ar" ? "en" : "ar"));

  /* ---------- Header state + mobile nav ---------- */
  const header = $(".site-header");
  // hides while scrolling down, comes back as soon as the visitor scrolls up
  let lastScrollY = window.scrollY;
  const onScroll = () => {
    if (!header) return;
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", header.classList.contains("site-header--solid") || y > 40);
    if (Math.abs(y - lastScrollY) < 6) return;
    const menuOpen = $("#mainNav") && $("#mainNav").classList.contains("is-open");
    header.classList.toggle("is-hidden", y > lastScrollY && y > 120 && !menuOpen);
    lastScrollY = y;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const navToggle = $("#navToggle");
  const nav = $("#mainNav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open);
    });
    const closeNav = () => { nav.classList.remove("is-open"); navToggle.setAttribute("aria-expanded", "false"); };
    $$("a", nav).forEach(a => a.addEventListener("click", closeNav));
    document.addEventListener("click", e => { if (nav.classList.contains("is-open") && !nav.contains(e.target) && !navToggle.contains(e.target)) closeNav(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- Views (single-file site: #about, #contact, #payment, #admin) ----------
     Every page lives in index.html as a <main data-view>. The header links switch the
     view and start it at the top — nothing scrolls. Links like #planner still work. */
  const views = $$("main[data-view]");
  const route = () => {
    const [name, q = ""] = decodeURIComponent(location.hash.slice(1)).split("?");
    return { name, params: new URLSearchParams(q) };
  };
  window.GTS_route = route;
  let view = null;
  const setTitle = () => {
    const v = views.find(x => x.dataset.view === view);
    if (v) document.title = lang === "en" && I18N.en[v.dataset.titleKey] ? I18N.en[v.dataset.titleKey] : v.dataset.title;
  };
  const showView = initial => {
    if (!views.length) return;
    const { name } = route();
    const next = views.some(v => v.dataset.view === name) ? name : "home";
    const anchor = next === "home" && name && name !== "home" ? document.getElementById(name) : null;
    if (next !== view) {
      view = next;
      views.forEach(v => { v.hidden = v.dataset.view !== next; });
      document.body.classList.toggle("page", next !== "home");
      views.forEach(v => document.body.classList.toggle("page--" + v.dataset.view, v.dataset.view === next && next !== "home"));
      if (header) header.classList.toggle("site-header--solid", next === "admin");
      $$(".main-nav a").forEach(a => {
        const on = (a.getAttribute("href") || "").slice(1) === next;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
      setTitle();
      // let the scroll scenes measure the newly visible layout
      forceResize = true;
      window.dispatchEvent(new Event("resize"));
      forceResize = false;
      if (!initial && !anchor) {
        window.scrollTo({ top: 0, behavior: "instant" });
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "instant" })); // stops a smooth scroll still in flight
      }
      onScroll();
    }
    if (anchor && !initial) requestAnimationFrame(() => anchor.scrollIntoView({ behavior: "instant" }));
    document.dispatchEvent(new CustomEvent("gts:view", { detail: next }));
  };
  showView(true);
  window.addEventListener("hashchange", () => showView(false));
  document.addEventListener("gts:lang", setTitle);

  /* ---------- Hero video ---------- */
  const video = $("#heroVideo");
  if (video && reduceMotion) video.pause();

  /* ---------- Scroll reveal (staggered) ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const siblings = $$(".reveal", e.target.parentElement);
        const idx = Math.max(0, siblings.indexOf(e.target));
        e.target.style.transitionDelay = Math.min(idx * 0.08, 0.5) + "s";
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("is-in"));
  }

  /* ---------- Scroll-driven frame scenes ----------
     Each video is pre-split into WebP frames and painted on a canvas.
     The scroll position is eased and neighbouring frames are cross-faded
     while moving, so playback stays smooth at any scroll speed; once the
     scroll settles a single sharp frame is shown. */
  const clamp = (v, a = 0, b = 1) => (v !== v ? a : Math.min(b, Math.max(a, v))); // NaN-safe (hidden views measure 0/0)
  const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
  const easeOut = x => 1 - Math.pow(1 - x, 3);


  function createScene({ canvas, frames, src, read, frameAt, onPaint, tint, glide = 0.14 }) {
    const ctx = canvas.getContext("2d");
    const imgs = new Array(frames);
    let target = 0, current = 0, raf = null, w = 0, h = 0;

    const nearestLoaded = i => {
      for (let d = 0; d < frames; d++) {
        if (imgs[i - d] && imgs[i - d].ready) return imgs[i - d];
        if (imgs[i + d] && imgs[i + d].ready) return imgs[i + d];
      }
      return null;
    };
    const drawCover = (img, alpha) => {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      const s = Math.max(w / iw, h / ih);
      const dw = iw * s, dh = ih * s;
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    const paint = settled => {
      if (w && h) {
        const f = clamp(frameAt(current)) * (frames - 1);
        const i = settled ? Math.round(f) : Math.floor(f), t = settled ? 0 : f - i;
        ctx.imageSmoothingQuality = settled || !touch ? "high" : "low";
        if (tint) { ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
        const a = nearestLoaded(i);
        if (a) drawCover(a, 1);
        // touch screens show one frame at a time (the sequence is dense enough, and it draws faster)
        const b = !touch && t > 0.01 && imgs[i + 1] && imgs[i + 1].ready ? imgs[i + 1] : null;
        if (b) drawCover(b, t);
        ctx.globalAlpha = 1;
        // white video background → page colour, inside the canvas (no costly CSS blend layer)
        if (tint) { ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "source-over"; }
      }
      if (onPaint) onPaint(current, target);
    };
    const resize = force => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!force && w === canvas.clientWidth && h === canvas.clientHeight) return; // nothing changed: keep the canvas
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      paint(true);
    };
    let last = 0;
    const loop = now => {
      const diff = target - current;
      const dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      current = reduceMotion ? target : current + diff * follow(glide, dt);
      if (Math.abs(diff) < 0.0004) current = target;
      paint(current === target);
      if (current !== target) raf = requestAnimationFrame(loop); else { raf = null; last = 0; }
    };
    const kick = () => {
      target = read();
      if (Math.abs(target - current) > 0.25) current = target; // a jump (link, restored position): don't replay the scene
      if (!raf) raf = requestAnimationFrame(loop);
    };

    // first frame immediately, then the rest in order
    const load = i => new Promise(res => {
      const img = new Image();
      img.decoding = "async";
      img.src = src(i);
      imgs[i] = img;
      // decoded off the main thread before first use, so a swipe never waits on a decode
      const done = () => { img.ready = !!img.naturalWidth; res(); };
      if (img.decode) img.decode().then(done, done);
      else img.onload = img.onerror = done;
    });
    // coarse-to-fine: every 16th frame first (the whole clip is usable quickly), then fill in
    const order = [], seen = new Set([0]);
    for (const step of [16, 8, 4, 2, 1]) {
      for (let i = 0; i < frames; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    }
    load(0).then(() => {
      resize();
      kick();
      let next = 0;
      const worker = async () => {
        while (next < order.length) {
          const i = order[next++];
          await load(i);
          if (Math.abs(i - clamp(frameAt(current)) * (frames - 1)) < 3) kick();
        }
      };
      for (let n = 0; n < 6; n++) worker();
    });

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", () => { resize(); kick(); });
    target = current = read();
    return { resize: () => resize(true), kick };
  }

  /* ---------- Animation 2a: flight through the window + stats ---------- */
  const flight = $("#flight");
  if (flight && $("#flightCanvas")) {
    const intro = $("#flightIntro");
    const fade = $("#flightFade");
    const outro = $("#flightOutro");
    const flightSticky = $(".flight-sticky", flight);
    const stats = $$("[data-fl-stat]", flight).map(el => ({
      el, num: $("[data-to]", el), to: +$("[data-to]", el).dataset.to, line: $(".fstat-line", el)
    }));
    // playback occupies most of the pinned scroll; the tail holds the last frame briefly
    const PLAY_END = 0.9;
    // each stat owns a slice of the playback
    const SLOTS = [[0.13, 0.33], [0.31, 0.51], [0.49, 0.69], [0.67, 0.87]];

    createScene({
      canvas: $("#flightCanvas"),
      frames: 81,
      src: i => `assets/frames/f_${String(i + 1).padStart(3, "0")}.webp`,
      read: () => {
        const r = flight.getBoundingClientRect();
        // the seam fade is strongest while the section is entering and gone once it is pinned
        if (fade) fade.style.opacity = smooth(0, 0.4, r.top / window.innerHeight);
        // stays at 0 (first frame) until the section fills the viewport
        return clamp(-r.top / (flight.offsetHeight - flightSticky.offsetHeight));
      },
      frameAt: p => p / PLAY_END,
      onPaint: p => {
        if (outro) outro.style.opacity = smooth(0.9, 0.995, p);
        // intro headline fades away as the flight starts
        if (intro) {
          const o = 1 - smooth(0.02, 0.12, p);
          intro.style.opacity = o;
          intro.style.transform = `translateY(${-(1 - o) * 60}px)`;
        }
        // stats glide in, count up with the scroll, then drift away
        const mobile = window.innerWidth < 760;
        stats.forEach((s, k) => {
          const [s0, s1] = SLOTS[k];
          const local = clamp((p - s0) / (s1 - s0));
          const inn = smooth(0, 0.28, local), out = 1 - smooth(0.78, 1, local);
          const vis = inn * out;
          const y = (1 - inn) * 70 - (1 - out) * 70;
          s.el.style.opacity = vis;
          s.el.style.filter = touch ? "" : `blur(${(1 - vis) * 12}px)`;
          s.el.style.transform = `${mobile ? "" : "translateY(-50%) "}translateY(${y}px) scale(${0.92 + vis * 0.08})`;
          s.num.textContent = Math.round(s.to * easeOut(smooth(0.06, 0.55, local))).toLocaleString("en");
          s.line.style.transform = `scaleX(${smooth(0.2, 0.6, local)})`;
        });
      }
    });
  }

  /* ---------- Animation 2b: the plane crosses ----------
     The plane is a single high-resolution sprite moved with sub-pixel transforms along
     the exact path measured from the source video (fast entry, slow middle, fast exit),
     so it stays razor-sharp and smooth at any scroll speed. The stage is pinned and
     starts in place as the window video fades into the page colour. */
  const sky = $("#sky");
  const skyStage = $("#skyStage");
  const skyFrame = $("#skyFrame");
  const skyPlane = $("#skyPlane");
  if (sky && skyStage && skyFrame && skyPlane) {
    // plane's left edge per moment of the video, as a fraction of the 16:9 frame width
    const PATH = [-0.743, -0.713, -0.683, -0.6533, -0.6267, -0.5964, -0.5660, -0.5356, -0.5049, -0.4742, -0.4434,
      -0.4125, -0.3813, -0.3498, -0.3179, -0.2858, -0.2535, -0.2210, -0.1883, -0.1552, -0.1220, -0.0888, -0.0574,
      -0.0315, -0.0117, 0.0028, 0.0164, 0.0291, 0.0421, 0.0547, 0.0670, 0.0790, 0.0907, 0.1022, 0.1135, 0.1247,
      0.1359, 0.1472, 0.1587, 0.1704, 0.1824, 0.1948, 0.2078, 0.2213, 0.2353, 0.2501, 0.2655, 0.2817, 0.2986,
      0.3160, 0.3342, 0.3529, 0.3724, 0.3924, 0.4128, 0.4337, 0.4549, 0.4766, 0.4985, 0.5208, 0.5431, 0.5659,
      0.5887, 0.6116, 0.6346, 0.6578, 0.6813, 0.7047, 0.7281, 0.7517, 0.7753, 0.7992, 0.8231, 0.8468, 0.8708,
      0.8942, 0.9168, 0.940, 0.963, 0.986, 1.01, 1.035];
    const pathAt = t => {
      const f = clamp(t) * (PATH.length - 1), i = Math.floor(f), k = f - i;
      return i >= PATH.length - 1 ? PATH[PATH.length - 1] : PATH[i] + (PATH[i + 1] - PATH[i]) * k;
    };
    const T_PLANE = [0.02, 0.98];
    let pinned = false, frameW = 0, target = 0, current = 0, raf = null, last = 0;

    const range = () => sky.offsetHeight - skyStage.offsetHeight;

    // virtual 16:9 frame: fills landscape screens like the video did; on portrait screens the
    // whole frame is fitted to the width, so the plane is seen complete
    const layout = () => {
      if (!pinned) { skyFrame.style.width = skyFrame.style.height = skyFrame.style.left = skyFrame.style.top = ""; frameW = skyFrame.clientWidth; return; }
      const w = skyStage.clientWidth, h = skyStage.clientHeight;
      const s = w < h ? w / 16 : Math.max(w / 16, h / 9);
      frameW = s * 16;
      Object.assign(skyFrame.style, { width: frameW + "px", height: s * 9 + "px", left: (w - frameW) / 2 + "px", top: (h - s * 9) / 2 + "px" });
    };
    const setMode = () => {
      pinned = !reduceMotion;
      sky.classList.toggle("sky--pinned", pinned);
      sky.classList.toggle("sky--static", !pinned);
      sky.classList.toggle("sky--fit", window.innerWidth < window.innerHeight);
      // overlaps the last screen of the window video, which has faded to the page colour by then
      sky.style.marginTop = pinned ? `-${skyStage.offsetHeight}px` : "";
      layout();
    };
    const read = () => {
      if (pinned) return clamp(-sky.getBoundingClientRect().top / range());
      const r = skyFrame.getBoundingClientRect(), vh = window.innerHeight;
      return clamp((vh - r.top) / (vh + r.height));
    };
    const paint = () => {
      const t = pinned ? (current - T_PLANE[0]) / (T_PLANE[1] - T_PLANE[0]) : current;
      skyPlane.style.transform = `translate3d(${(pathAt(t) * frameW).toFixed(2)}px, 0, 0)`;
      if (pinned) skyStage.style.opacity = target > 0 ? 1 : 0;
    };
    const loop = now => {
      const diff = target - current;
      current = reduceMotion ? target : current + diff * follow(0.12, last ? now - last : 0);
      last = now;
      if (Math.abs(diff) < 0.00005) current = target;
      paint();
      if (current !== target) raf = requestAnimationFrame(loop); else { raf = null; last = 0; }
    };
    const kick = () => {
      target = read();
      if (Math.abs(target - current) > 0.25) current = target; // a jump (link, restored position): don't replay the scene
      if (!raf) raf = requestAnimationFrame(loop);
    };

    setMode();
    target = current = read();
    paint();
    window.addEventListener("scroll", kick, { passive: true });
    onResize(() => { setMode(); kick(); });
    if (skyPlane.complete) paint(); else skyPlane.addEventListener("load", paint);
  }

  /* ---------- Animation 2c: 3D city tour → the trip planner appears in place ----------
     416 frames of the 3D map video (with in-betweens over the fast camera moves), scrubbed
     by the scroll at an even visual speed with a pause on Istanbul (PROG is built from the video's motion),
     and each city's name (English + Arabic) appears while the camera hovers over it.
     Pinned stage: fades in as the plane scene ends, plays, then fades while the next
     section appears in place. Portrait screens show the whole frame, fitted to the width. */
  const tour = $("#tour");
  const tourStage = $("#tourStage");
  const tourCanvas = $("#tourCanvas");
  const afterTour = $("#planner");
  if (tour && tourStage && tourCanvas && afterTour) {
    const FRAMES = 416;
    // scroll progress at every 4th frame (last value = final frame): even visual speed through
    // the camera moves, with enough dwell over each city
    const PROG = [0.0000, 0.0085, 0.0153, 0.0224, 0.0294, 0.0372, 0.0445, 0.0517, 0.0590, 0.0669, 0.0748, 0.0813,
      0.0884, 0.0958, 0.1049, 0.1129, 0.1216, 0.1295, 0.1374, 0.1452, 0.1531, 0.1609, 0.1688, 0.1766,
      0.1845, 0.1924, 0.2002, 0.2081, 0.2168, 0.2237, 0.2312, 0.2376, 0.2465, 0.2546, 0.2635, 0.2753,
      0.2850, 0.2965, 0.3048, 0.3120, 0.3201, 0.3279, 0.3349, 0.3442, 0.3524, 0.3602, 0.3681, 0.3759,
      0.3838, 0.3916, 0.3990, 0.4077, 0.4155, 0.4247, 0.4361, 0.4464, 0.4562, 0.4668, 0.4750, 0.4828,
      0.4910, 0.4976, 0.5045, 0.5332, 0.5646, 0.5961, 0.6235, 0.6390, 0.6545, 0.6700, 0.6854, 0.7009,
      0.7164, 0.7319, 0.7474, 0.7587, 0.7672, 0.7747, 0.7832, 0.7914, 0.7994, 0.8072, 0.8151, 0.8229,
      0.8298, 0.8398, 0.8495, 0.8597, 0.8720, 0.8813, 0.8899, 0.9004, 0.9073, 0.9135, 0.9208, 0.9297,
      0.9382, 0.9465, 0.9545, 0.9617, 0.9702, 0.9783, 0.9862, 0.9941, 1.0000];
    const frameAtProg = t => {
      t = clamp(t);
      let k = 0;
      while (k < PROG.length - 2 && PROG[k + 1] < t) k++;
      const f0 = Math.min(k * 4, FRAMES - 1), f1 = Math.min((k + 1) * 4, FRAMES - 1);
      const span = PROG[k + 1] - PROG[k] || 1;
      return (f0 + (f1 - f0) * clamp((t - PROG[k]) / span)) / (FRAMES - 1);
    };

    // sequential hand-offs: the outgoing part is gone before the incoming one appears
    const IN = [0, 0.05];       // tour fades in
    const PLAY = [0.05, 0.92];  // the tour plays
    const OUT = [0.92, 1];      // tour fades out (first half), the next section fades in (second half)
    const titles = $$(".tour-title", tour).map(el => ({ el, a: +el.dataset.in, b: +el.dataset.out }));
    const size = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) > 1300 ? "l" : "s";
    let pinned = false, nextOwned = false;

    const range = () => tour.offsetHeight - tourStage.offsetHeight;
    const frameOf = p => (pinned ? frameAtProg((p - PLAY[0]) / (PLAY[1] - PLAY[0])) : frameAtProg(p));

    const setMode = () => {
      pinned = !reduceMotion;
      tour.classList.toggle("tour--pinned", pinned);
      tour.classList.toggle("tour--static", !pinned);
      tour.classList.toggle("tour--fit", pinned && window.innerWidth < window.innerHeight);
      // overlap the plane scene's last screen and the next section's first screen
      const h = pinned ? tourStage.offsetHeight : 0;
      tour.style.marginTop = pinned ? `-${h}px` : "";
      afterTour.style.marginTop = pinned ? `-${h}px` : "";
      if (!pinned) {
        tourStage.style.opacity = "";
        afterTour.style.opacity = afterTour.style.transform = afterTour.style.pointerEvents = "";
      }
    };
    setMode();

    const scene = createScene({
      canvas: tourCanvas,
      frames: FRAMES,
      src: i => `assets/tour/${size}/t_${String(i + 1).padStart(3, "0")}.webp`,
      tint: "#F8F4EF",
      glide: 0.09,
      read: () => {
        if (pinned) return clamp(-tour.getBoundingClientRect().top / range());
        const r = tourCanvas.getBoundingClientRect(), vh = window.innerHeight;
        return clamp((vh - r.top) / (vh + r.height));
      },
      frameAt: frameOf,
      onPaint: (p, real) => {
        // city names: in while the camera hovers over the city, out as it flies on
        const f = frameOf(p) * (FRAMES - 1);
        // titles only show while the stage is fully visible
        const gate = pinned ? smooth(IN[1] - 0.005, IN[1] + 0.02, p) * (1 - smooth(OUT[0] - 0.02, OUT[0], p)) : 1;
        titles.forEach(t => {
          const inn = smooth(t.a, t.a + 8, f), out = 1 - smooth(t.b - 8, t.b, f);
          const vis = inn * out * gate;
          t.el.style.opacity = vis;
          t.el.style.transform = `translateY(${((1 - inn) * 26 - (1 - out) * 26).toFixed(1)}px)`;
          t.el.style.filter = vis < 1 && !touch ? `blur(${((1 - vis) * 8).toFixed(1)}px)` : "";
        });
        if (!pinned) return;

        // stage: fades in at the start, out at the end
        tourStage.style.opacity = smooth(IN[0], IN[1], p) * (1 - smooth(OUT[0], 0.955, p));

        // next section: held at the top of the screen while fading in
        const appear = smooth(0.95, OUT[1], p);
        if (real > OUT[0] && !(real >= 1 && p >= 1)) {
          nextOwned = true;
          afterTour.style.opacity = appear;
          afterTour.style.transform = `translateY(${(-(1 - real) * range() + (1 - appear) * 50).toFixed(1)}px)`;
          afterTour.style.pointerEvents = appear < 0.5 ? "none" : "";
        } else if (real >= 1) {
          if (nextOwned) { afterTour.style.opacity = afterTour.style.transform = afterTour.style.pointerEvents = ""; nextOwned = false; }
        } else {
          nextOwned = true;
          afterTour.style.opacity = 0; afterTour.style.transform = ""; afterTour.style.pointerEvents = "none";
        }
      }
    });

    onResize(() => { setMode(); scene.resize(); scene.kick(); });
  }

  /* ---------- Destination filter ---------- */
  $$(".filter-chips .chip").forEach(chip => chip.addEventListener("click", () => {
    $$(".filter-chips .chip").forEach(c => c.classList.toggle("is-active", c === chip));
    const f = chip.dataset.filter;
    $$(".dest-card").forEach(card => {
      const show = f === "all" || card.dataset.cat.split(" ").includes(f);
      card.classList.toggle("is-hidden", !show);
    });
  }));

  /* ---------- Animation 3: 3D tilt on destination cards ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    $$(".dest-card").forEach(card => {
      card.addEventListener("pointermove", e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- Animation 3: the journey route ----------
     A plane flies from Baghdad to "your destination" along the route as you scroll.
     The route passes a numbered station above each of the four steps; when the plane
     reaches a station it lights up and its step comes into focus. Motion is eased. */
  const track = $("#journeyTrack");
  const line = $("#journeyLine");
  const draw = $("#journeyDraw");
  const glow = $("#journeyGlow");
  const plane = $("#journeyPlane");
  if (track && line && draw && plane) {
    const icon = $(".journey-plane-icon", plane);
    const svg = $(".journey-path", track);
    const nodes = $$(".jr-node", track);
    const steps = $$(".steps .step", track);
    const from = $("#jrFrom"), to = $("#jrTo");
    const total = line.getTotalLength();
    // stations sit above the step columns (route coordinates, RTL order)
    const STATIONS = [[875, 72], [625, 152], [375, 72], [125, 152]];
    const nodeAt = STATIONS.map(([x, y]) => {
      let best = 0, bd = Infinity;
      for (let l = 0; l <= total; l += 1.5) {
        const pt = line.getPointAtLength(l), d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
        if (d < bd) { bd = d; best = l; }
      }
      return best / total;
    });
    const startPt = line.getPointAtLength(0), endPt = line.getPointAtLength(total);
    let target = 0, current = 0, raf = null, live = false;

    const X = (x, w) => (root.dir === "ltr" ? 1000 - x : x) * (w / 1000);

    const layout = () => {
      live = getComputedStyle(svg).display !== "none";
      track.classList.toggle("is-live", live);
      if (!live) return;
      const w = track.clientWidth;
      nodes.forEach((n, i) => { n.style.transform = `translate(${X(STATIONS[i][0], w)}px, ${STATIONS[i][1]}px)`; });
      if (from) from.style.transform = `translate(${X(startPt.x, w)}px, ${startPt.y}px) translate(-50%, -50%)`;
      if (to) to.style.transform = `translate(${X(endPt.x, w)}px, ${endPt.y}px) translate(-50%, -50%)`;
    };

    const paint = () => {
      if (!live) return;
      const p = current, w = track.clientWidth;
      const off = String(1 - p);
      draw.style.strokeDashoffset = off;
      if (glow) glow.style.strokeDashoffset = off;

      const l = total * p;
      const pt = line.getPointAtLength(l);
      const ahead = line.getPointAtLength(Math.min(total, l + 2));
      const behind = line.getPointAtLength(Math.max(0, l - 2));
      const ltr = root.dir === "ltr";
      const dx = (ahead.x - behind.x) * (ltr ? -1 : 1) * (w / 1000);
      const angle = Math.atan2(ahead.y - behind.y, dx) * 180 / Math.PI + 90;
      plane.style.transform = `translate(${X(pt.x, w).toFixed(2)}px, ${pt.y.toFixed(2)}px)`;
      icon.style.transform = `rotate(${angle.toFixed(1)}deg)`;

      nodeAt.forEach((at, i) => {
        const on = p >= at - 0.004;
        nodes[i].classList.toggle("is-active", on);
        if (steps[i]) steps[i].classList.toggle("is-active", on);
      });
      if (to) to.classList.toggle("is-reached", p >= 0.995);
    };

    const read = () => {
      const r = track.getBoundingClientRect(), vh = window.innerHeight;
      // starts as the route enters the lower part of the screen, lands as it reaches the upper third
      return clamp((vh * 0.82 - r.top) / (vh * 0.55));
    };
    let last = 0;
    const loop = now => {
      const diff = target - current;
      current = reduceMotion ? target : current + diff * follow(0.14, last ? now - last : 0);
      last = now;
      if (Math.abs(diff) < 0.0005) current = target;
      paint();
      if (current !== target) raf = requestAnimationFrame(loop); else { raf = null; last = 0; }
    };
    const kick = () => { target = read(); if (!raf) raf = requestAnimationFrame(loop); };

    layout();
    target = current = read();
    paint();
    window.addEventListener("scroll", kick, { passive: true });
    onResize(() => { layout(); kick(); paint(); });
    document.addEventListener("gts:lang", () => { layout(); paint(); });
  }

  /* ---------- Testimonials: cards slide in one after another with the scroll ----------
     From the reading-start side: right in Arabic, left in English. Cards on the same
     row are staggered; each card is tied to the scroll (and eased), so scrolling back
     slides it out again. */
  const tCards = $$(".t-card");
  if (tCards.length) {
    let target = [], current = [], raf = null;

    const read = () => {
      const vh = window.innerHeight;
      // layout positions (offsetTop) — unaffected by the cards' own slide/rotate transforms
      const base = tCards[0].offsetTop;
      const rowTop = tCards[0].parentElement.getBoundingClientRect().top;
      // cards sharing the first row are dealt farthest-first: the card with the longest way to go
      // (the far end of the row) lands first, so no card ever has to cross another one.
      // DOM order runs from the entry side, so the farthest card is the last one in the row.
      const inRow = tCards.filter(c => c.offsetTop === base).length;
      return tCards.map((card, i) => {
        const top = rowTop + card.offsetTop - base;
        // stacked cards (mobile) simply use their own position
        const order = card.offsetTop === base ? inRow - 1 - i : 0;
        const begin = vh * 0.95 - order * vh * 0.13;
        return clamp((begin - top) / (vh * 0.32));
      });
    };

    const paint = () => {
      const dir = root.dir === "ltr" ? -1 : 1; // -1: from the left, 1: from the right
      tCards.forEach((card, i) => {
        const e = easeOut(current[i]);
        if (e >= 1) { card.style.transform = card.style.opacity = ""; return; }
        card.style.opacity = Math.min(1, e * 1.4);
        card.style.transform = `translate3d(${(dir * (1 - e) * 65).toFixed(2)}vw, 0, 0) rotate(${(dir * (1 - e) * 5).toFixed(2)}deg)`;
      });
    };

    let last = 0;
    const loop = now => {
      let moving = false;
      const k = follow(0.14, last ? now - last : 0);
      last = now;
      current = current.map((c, i) => {
        const d = target[i] - c;
        if (reduceMotion || Math.abs(d) < 0.0008) return target[i];
        moving = true;
        return c + d * k;
      });
      paint();
      if (moving) raf = requestAnimationFrame(loop); else { raf = null; last = 0; }
    };
    const kick = () => { target = read(); if (!raf) raf = requestAnimationFrame(loop); };

    target = read(); current = target.slice();
    paint();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    document.addEventListener("gts:lang", paint);
  }

  /* ---------- AI trip planner (demo — front-end only) ---------- */
  const DEST = {
    istanbul: { img: "assets/img/istanbul.jpg", base: 145,
      ar: { name: "إسطنبول", days: ["الوصول واستقبال خاص من المطار، جولة مسائية في تقسيم", "آيا صوفيا والجامع الأزرق والسوق المسقوف", "رحلة بحرية خاصة في البوسفور مع عشاء", "يوم حر للتسوق في مولات إسطنبول", "رحلة إلى جزيرة الأميرات أو سبانجا", "جلسة تصوير وتوديع ونقل إلى المطار"] },
      en: { name: "Istanbul", days: ["Arrival with private airport pickup, evening stroll in Taksim", "Hagia Sophia, the Blue Mosque and the Grand Bazaar", "Private Bosphorus cruise with dinner", "Free day for shopping in Istanbul’s malls", "Day trip to the Princes’ Islands or Sapanca", "Photo session, farewell and airport transfer"] } },
    dubai: { img: "assets/img/dubai.jpg", base: 150,
      ar: { name: "دبي", days: ["الوصول ونقل خاص إلى الفندق", "برج خليفة ونافورة دبي مول", "سفاري الصحراء مع عشاء بدوي", "يوم عائلي في المنتزهات المائية", "دبي مارينا ورحلة يخت", "تسوق حر ونقل إلى المطار"] },
      en: { name: "Dubai", days: ["Arrival and private transfer to your hotel", "Burj Khalifa and the Dubai Mall fountain", "Desert safari with a Bedouin dinner", "Family day at the water parks", "Dubai Marina and a yacht cruise", "Free shopping time and airport transfer"] } },
    maldives: { img: "assets/img/maldives.jpg", base: 390,
      ar: { name: "جزر المالديف", days: ["الوصول وانتقال بالطائرة المائية إلى المنتجع", "يوم استرخاء في الفيلا فوق الماء", "غطس مع السلاحف والشعاب المرجانية", "عشاء خاص على الشاطئ عند الغروب", "سبا ورحلة دلافين", "نقل إلى المطار"] },
      en: { name: "the Maldives", days: ["Arrival and seaplane transfer to the resort", "A relaxing day in your overwater villa", "Snorkeling with turtles and coral reefs", "Private sunset dinner on the beach", "Spa time and a dolphin cruise", "Airport transfer"] } },
    bali: { img: "assets/img/bali.jpg", base: 155,
      ar: { name: "بالي", days: ["الوصول إلى أوبود ونقل خاص", "معبد أولون دانو ومدرجات الأرز", "شلالات وجولة أرجوحة بالي", "يوم في شواطئ نوسا دوا", "رحلة إلى جزيرة نوسا بينيدا", "تسوق ونقل إلى المطار"] },
      en: { name: "Bali", days: ["Arrival in Ubud with private transfer", "Ulun Danu temple and the rice terraces", "Waterfalls and the Bali swing", "A day on the beaches of Nusa Dua", "Day trip to Nusa Penida island", "Shopping and airport transfer"] } },
    paris: { img: "assets/img/paris.jpg", base: 265,
      ar: { name: "باريس", days: ["الوصول ونقل خاص إلى الفندق", "برج إيفل ورحلة نهر السين", "متحف اللوفر والشانزليزيه", "يوم في ديزني لاند باريس", "قصر فرساي", "تسوق في لافاييت ونقل إلى المطار"] },
      en: { name: "Paris", days: ["Arrival and private transfer to your hotel", "Eiffel Tower and a Seine river cruise", "The Louvre and the Champs-Élysées", "A day at Disneyland Paris", "The Palace of Versailles", "Shopping at Galeries Lafayette and airport transfer"] } },
    swiss: { img: "assets/img/alps.jpg", base: 300,
      ar: { name: "سويسرا", days: ["الوصول إلى زيورخ وانتقال إلى إنترلاكن", "قمة يونغفراو — سقف أوروبا", "بحيرة بريينز وقرية إيزلتفالد", "قطار بانورامي إلى زيرمات وجبل ماترهورن", "لوسيرن وجبل تيتليس", "عودة إلى زيورخ ونقل إلى المطار"] },
      en: { name: "Switzerland", days: ["Arrival in Zurich and transfer to Interlaken", "Jungfraujoch — the Top of Europe", "Lake Brienz and Iseltwald village", "Panoramic train to Zermatt and the Matterhorn", "Lucerne and Mount Titlis", "Return to Zurich and airport transfer"] } },
    kl: { img: "assets/img/kl.jpg", base: 140,
      ar: { name: "كوالالمبور", days: ["الوصول ونقل خاص إلى الفندق", "برجا بتروناس وحديقة KLCC", "مرتفعات جنتنج والتلفريك", "كهوف باتو ومدينة بوتراجايا", "طيران داخلي إلى لنكاوي — جولة الجزر", "نقل إلى المطار"] },
      en: { name: "Kuala Lumpur", days: ["Arrival and private transfer to your hotel", "Petronas Towers and KLCC Park", "Genting Highlands and the cable car", "Batu Caves and Putrajaya", "Domestic flight to Langkawi — island hopping", "Airport transfer"] } }
  };
  const WHO_MULT = { couple: 2, family: 4, solo: 1, friends: 4 };
  // package bases are per-night USD costs; prices are shown in Iraqi dinars
  // (Baghdad market rate, late Oct 2026: ~167,900 IQD per $100)
  const USD_IQD = 1680;
  const clean = s => s.replace(/[<>&"]/g, "");

  const pDate = $("#pDate");
  if (pDate) {
    const d = new Date(); d.setDate(d.getDate() + 14);
    pDate.min = new Date().toISOString().slice(0, 10);
    pDate.value = d.toISOString().slice(0, 10);
  }

  $$(".planner-tabs button").forEach(tab => tab.addEventListener("click", () => {
    $$(".planner-tabs button").forEach(t => t.classList.toggle("is-active", t === tab));
    const wish = $("#pWish");
    if (wish) wish.placeholder = T().ph[tab.dataset.tab];
  }));

  const form = $("#plannerForm");
  const result = $("#plannerResult");
  const modal = $("#plannerModal");
  if (form && result && modal) {
    const closeModal = () => { modal.hidden = true; document.body.style.overflow = ""; };
    $("#plannerClose").addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

    form.addEventListener("submit", e => {
      e.preventDefault();
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      const key = $("#pDest").value, nights = +$("#pNights").value, who = $("#pWho").value;
      const wish = $("#pWish").value.trim();
      const t = T(), d = DEST[key], dl = d[lang];
      result.innerHTML = `<div class="ai-thinking"><i></i><i></i><i></i> ${t.thinking(dl.name)}</div>`;
      setTimeout(() => {
        const days = dl.days.slice(0, Math.min(6, nights));
        const price = Math.round(d.base * nights * WHO_MULT[who] * USD_IQD / 5000) * 5000;
        const dateTxt = new Date($("#pDate").value).toLocaleDateString(t.locale, { day: "numeric", month: "long" });
        result.innerHTML = `
          <div class="itinerary">
            <div class="itinerary-media" style="background-image:url('${d.img}')"><span><svg><use href="#i-spark"/></svg> ${t.aiBadge}</span></div>
            <div>
              <h3>${t.tripTitle(dl.name, nights)}</h3>
              <p class="sub">${t.tripSub(t.who[who], dateTxt)}${wish ? t.tripWish(clean(wish)) : ""}</p>
              <ol>${days.map((txt, i) => `<li><b>${t.day(i + 1)}</b><span>${txt}</span></li>`).join("")}</ol>
              <div class="row">
                <p class="price"><small>${t.estimate}</small> <span>${t.price(price)}</span></p>
                <div style="display:flex;gap:10px;flex-wrap:wrap">
                  <a class="btn btn-ghost btn-sm" style="color:var(--ink);border-color:var(--line)" href="${WA}" target="_blank" rel="noopener">${t.advisor}</a>
                  <a class="btn btn-primary btn-sm" href="#payment?pkg=${key}&amount=${price}">${t.bookTrip}</a>
                </div>
              </div>
            </div>
          </div>`;
      }, 1500);
    });
  }

  /* ---------- AI chatbot (demo — rule-based, ready to connect to an AI API) ---------- */
  const fab = $("#chatFab"), chat = $("#chat"), body = $("#chatBody"), chatForm = $("#chatForm"), chatText = $("#chatText");
  if (fab && chat) {
    const INTENTS = {
      ar: [
        { k: ["عائل", "اطفال", "عائلة"], a: "رائع! للعائلات ننصح بـ <b>إسطنبول</b> و<b>دبي</b> و<b>كوالالمبور</b> — فنادق عائلية، أنشطة للأطفال، ونقل خاص طوال الرحلة.\nكم عدد أفراد العائلة، ومتى تفكرون بالسفر؟" },
        { k: ["عسل", "زواج", "عرسان", "رومانس"], a: "مبارك مقدماً! 💍 أجمل وجهات شهر العسل لدينا: <b>جزر المالديف</b> (فيلا فوق الماء)، <b>بالي</b>، و<b>باريس</b>.\nنضيف لمسات خاصة مثل عشاء على الشاطئ وتزيين الغرفة." },
        { k: ["دفع", "ادفع", "زين", "كاش", "ماستر", "بطاقة", "كي كارد", "مصرف", "تحويل", "باركد"], a: "يمكنك الدفع عبر <b>زين كاش</b> أو <b>ماستر كارد / كي كارد</b> أو التحويل إلى حساباتنا في <b>مصرف NBI</b> و<b>مصرف TBI</b>.\nبعد الدفع ارفع صورة الإيصال في <a href=\"#payment\">صفحة الدفع</a>، وستظهر حالة الحجز «تم التأكيد» بعد مراجعة الإدارة." },
        { k: ["فيزا", "تاشير", "شنغن"], a: "نتابع ملفات التأشيرات (شنغن، بريطانيا، آسيا وغيرها) خطوة بخطوة.\nأخبرني بالوجهة وعدد المسافرين وسأوضح لك المستمسكات المطلوبة." },
        { k: ["سعر", "كم", "تكلف", "اسعار", "ميزاني"], a: "الأسعار تبدأ من حوالي <b>1,260,000 د.ع</b> لدبي و<b>1,495,000 د.ع</b> لإسطنبول للشخص، وتختلف حسب الفندق والموسم.\nجرّب <a href=\"#planner\">مخطط الرحلات الذكي</a> للحصول على تقدير فوري." },
        { k: ["طيران", "تذكر", "تذاكر"], a: "نحجز تذاكر الطيران من بغداد وأربيل والبصرة والنجف إلى معظم الوجهات. ما وجهتك والتاريخ التقريبي؟" },
        { k: ["فندق", "فنادق", "اقامة"], a: "نختار لك الإقامة حسب ذوقك: فنادق 4 و5 نجوم، شقق فندقية، أو فلل خاصة. ما الوجهة التي تفكر بها؟" },
        { k: ["عنوان", "مكتب", "وين", "اين", "موقع"], a: "📍 مكتب المبيعات: بغداد – حي المنصور، شارع 14 رمضان.\nأهلاً بك في أي وقت!" },
        { k: ["رقم", "اتصال", "هاتف", "واتس", "تواصل"], a: "📞 0772 222 8718\n📞 0782 222 8718\nأو راسلنا مباشرة على <a href=\"" + WA + "\" target=\"_blank\" rel=\"noopener\">واتساب</a>." },
        { k: ["تركيا", "اسطنبول", "طرابزون"], a: "تركيا من أكثر وجهاتنا طلباً 🇹🇷 باقة إسطنبول 6 ليالٍ تبدأ من 1,495,000 د.ع مع فندق 5 نجوم وجولات خاصة. هل تودّ إضافة طرابزون أو كابادوكيا؟" },
        { k: ["مرحبا", "سلام", "هلو", "هلا", "اهلا"], a: "أهلاً وسهلاً بك في Gts-IQ 👋 كيف أقدر أساعدك اليوم؟" },
        { k: ["شكرا", "ممنون", "تسلم"], a: "العفو! سعداء بخدمتك دائماً ✈️ #مزيج_سفر_ناجح" }
      ],
      en: [
        { k: ["family", "kids", "children"], a: "Great choice! For families we recommend <b>Istanbul</b>, <b>Dubai</b> and <b>Kuala Lumpur</b> — family-friendly hotels, activities for the kids and private transfers throughout.\nHow many of you are traveling, and when?" },
        { k: ["honeymoon", "wedding", "romantic", "couple"], a: "Congratulations in advance! 💍 Our favorite honeymoon destinations are <b>the Maldives</b> (overwater villa), <b>Bali</b> and <b>Paris</b>.\nWe add special touches like a private beach dinner and room decoration." },
        { k: ["pay", "zain", "cash", "master", "card", "bank", "transfer", "iban", "qr"], a: "You can pay with <b>ZainCash</b>, <b>MasterCard / Ki Card</b> or a transfer to our accounts at <b>NBI Bank</b> and <b>TBI Bank</b>.\nAfter paying, upload your receipt on the <a href=\"#payment\">payment page</a> and your booking will show as “Confirmed” once our team reviews it." },
        { k: ["visa", "schengen"], a: "We handle visa files (Schengen, UK, Asia and more) step by step.\nTell me the destination and number of travelers and I’ll list the documents you need." },
        { k: ["price", "cost", "how much", "budget", "cheap"], a: "Prices start at around <b>IQD 1,260,000</b> for Dubai and <b>IQD 1,495,000</b> for Istanbul per person, depending on the hotel and season.\nTry the <a href=\"#planner\">AI trip planner</a> for an instant estimate." },
        { k: ["flight", "ticket", "fly"], a: "We book flights from Baghdad, Erbil, Basra and Najaf to most destinations. Where would you like to go, and roughly when?" },
        { k: ["hotel", "stay", "resort", "villa"], a: "We match your stay to your taste: 4- and 5-star hotels, serviced apartments or private villas. Which destination do you have in mind?" },
        { k: ["address", "office", "where", "location"], a: "📍 Sales office: 14 Ramadan Street, Al-Mansour, Baghdad.\nYou’re welcome any time!" },
        { k: ["phone", "number", "call", "whatsapp", "contact"], a: "📞 +964 772 222 8718\n📞 +964 782 222 8718\nOr message us directly on <a href=\"" + WA + "\" target=\"_blank\" rel=\"noopener\">WhatsApp</a>." },
        { k: ["turkey", "türkiye", "istanbul", "trabzon"], a: "Türkiye is one of our most requested destinations 🇹🇷 Our 6-night Istanbul package starts from IQD 1,495,000 with a 5-star hotel and private tours. Would you like to add Trabzon or Cappadocia?" },
        { k: ["hello", "hi", "hey", "salam"], a: "Hello and welcome to Gts-IQ 👋 How can I help you today?" },
        { k: ["thank", "thanks"], a: "You’re welcome! Always happy to help ✈️" }
      ]
    };
    const FALLBACK = {
      ar: "سؤال جميل! سأحوّلك إلى أحد مستشاري السفر لدينا للحصول على إجابة دقيقة.\nتواصل معنا على <a href=\"" + WA + "\" target=\"_blank\" rel=\"noopener\">واتساب</a> أو اختر أحد الاقتراحات بالأسفل.",
      en: "Good question! Let me connect you with one of our travel advisors for an accurate answer.\nMessage us on <a href=\"" + WA + "\" target=\"_blank\" rel=\"noopener\">WhatsApp</a> or pick one of the suggestions below."
    };

    const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const norm = s => s.toLowerCase().replace(/[أإآ]/g, "ا");
    const addMsg = (html, who) => {
      const m = document.createElement("div");
      m.className = "msg msg--" + who;
      m.innerHTML = html;
      m.dir = "auto";
      body.appendChild(m);
      body.scrollTop = body.scrollHeight;
      return m;
    };
    const reply = text => {
      // answer in the language the visitor typed in
      const l = /[؀-ۿ]/.test(text) ? "ar" : "en";
      const t = norm(text);
      const hit = INTENTS[l].find(i => i.k.some(k => t.includes(norm(k))));
      const typing = addMsg("<i></i><i></i><i></i>", "bot");
      typing.classList.add("msg--typing");
      setTimeout(() => { typing.remove(); addMsg(hit ? hit.a : FALLBACK[l], "bot"); }, 700 + Math.random() * 600);
    };
    const send = text => {
      if (!text.trim()) return;
      addMsg(esc(text), "user");
      reply(text);
    };

    let greeted = false;
    const hint = $("#chatHint");
    const hideHint = () => { if (hint) hint.hidden = true; try { sessionStorage.setItem("gts-hint", "1"); } catch (e) { /* ignore */ } };
    const toggleChat = () => {
      const open = chat.hidden;
      chat.hidden = !open;
      fab.setAttribute("aria-expanded", open);
      hideHint();
      if (open && !greeted) { greeted = true; addMsg(T().greeting, "bot"); }
      if (open) setTimeout(() => chatText.focus(), 200);
    };
    fab.addEventListener("click", toggleChat);
    // a short greeting next to the launcher, once per visit
    if (hint) {
      let seen = false;
      try { seen = sessionStorage.getItem("gts-hint") === "1"; } catch (e) { /* ignore */ }
      if (!seen) setTimeout(() => { if (chat.hidden && !greeted) hint.hidden = false; }, 5000);
      hint.addEventListener("click", e => { if (e.target.closest("#chatHintClose")) hideHint(); else toggleChat(); });
    }
    chatForm.addEventListener("submit", e => { e.preventDefault(); send(chatText.value); chatText.value = ""; });
    $$("#chatQuick button").forEach(b => b.addEventListener("click", () => send(b.textContent)));
  }

  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
})();
