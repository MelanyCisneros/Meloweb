type Tweaks = {
  bgTone: string;
  accentHue: number;
  wordmarkItalic: boolean;
  wordmarkWeight: number;
  grainOn: boolean;
  textureMode: "layered" | "grain" | "off";
  textureIntensity: number;
  lang: "en" | "es";
};

declare global {
  interface Window {
    TWEAKS: Tweaks;
  }
}

const html = document.documentElement;
const T = window.TWEAKS;

function applyTweaks() {
  html.setAttribute("data-bg", T.bgTone);
  html.setAttribute("data-grain", T.grainOn ? "on" : "off");
  html.setAttribute("data-lang", T.lang);
  html.setAttribute("data-texture", T.textureMode || "layered");
  html.style.setProperty("--accent-h", String(T.accentHue));
  html.style.setProperty("--wm-italic", T.wordmarkItalic ? "italic" : "normal");
  html.style.setProperty("--wm-weight", String(T.wordmarkWeight));
  html.style.setProperty("--tex-i", ((T.textureIntensity ?? 55) / 100).toFixed(3));
}
applyTweaks();

function pushEdit(obj: Record<string, unknown>) {
  try {
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: obj }, "*");
  } catch {}
}

// ---- Lang toggle ----
const langBtns = document.querySelectorAll<HTMLButtonElement>(".lang-btn[data-lang]");
function setLang(l: "en" | "es") {
  T.lang = l;
  html.setAttribute("data-lang", l);
  langBtns.forEach((b) => b.classList.toggle("active", b.dataset.lang === l));
  try { localStorage.setItem("lang", l); } catch {}
  pushEdit({ lang: l });
}
langBtns.forEach((b) =>
  b.addEventListener("click", () => setLang((b.dataset.lang as "en" | "es") ?? "en"))
);
setLang(T.lang);

// ---- Mobile menu ----
const menuToggle = document.getElementById("menu-toggle");
const mobileMenu = document.getElementById("mobile-menu");
function setMenuOpen(open: boolean) {
  document.body.classList.toggle("menu-open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
  mobileMenu?.setAttribute("aria-hidden", String(!open));
}
menuToggle?.addEventListener("click", () => {
  setMenuOpen(!document.body.classList.contains("menu-open"));
});
mobileMenu?.querySelectorAll<HTMLAnchorElement>("a").forEach((a) => {
  a.addEventListener("click", () => setMenuOpen(false));
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenuOpen(false);
});

// ---- Nav scroll-spy ----
const sections = ["about", "services", "portfolio", "bass", "contact"]
  .map((id) => document.getElementById(id))
  .filter((el): el is HTMLElement => el !== null);
const links = document.querySelectorAll<HTMLAnchorElement>("#nav-pills a");
const mobileLinks = document.querySelectorAll<HTMLAnchorElement>(".mobile-menu-inner a[href^='#']");
const allNavLinks = document.querySelectorAll<HTMLAnchorElement>(
  "#nav-pills a, .mobile-menu-inner a[href^='#'], .nav-wordmark[href^='#']"
);
const navWrap = document.querySelector<HTMLDivElement>(".nav-wrap");
const socialRail = document.querySelector<HTMLElement>(".social-rail");

let currentHashId = "";
let suppressSpyHash = false;

function onScroll() {
  const y = window.scrollY + window.innerHeight * 0.35;
  let active: string | null = null;
  for (const s of sections) {
    if (s.offsetTop <= y) active = s.id;
  }
  links.forEach((a) => a.classList.toggle("active", a.dataset.link === active));
  mobileLinks.forEach((a) => a.classList.toggle("active", a.dataset.link === active));
  if (!suppressSpyHash) {
    const nextId = active || "";
    if (nextId !== currentHashId) {
      currentHashId = nextId;
      const newUrl = nextId ? "#" + nextId : window.location.pathname + window.location.search;
      history.replaceState(null, "", newUrl);
    }
  }
  const scrolled = window.scrollY > 24;
  navWrap?.classList.toggle("scrolled", scrolled);
  socialRail?.classList.toggle("scrolled", scrolled);
  document.body.classList.toggle("rail-space", scrolled);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

allNavLinks.forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href") || "";
    if (!href.startsWith("#") || href.length < 2) return;
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const target = id === "hero" ? 0 : el.offsetTop - 20;
    suppressSpyHash = true;
    currentHashId = id;
    history.pushState(null, "", "#" + id);
    window.scrollTo({ top: target, behavior: "smooth" });
    window.setTimeout(() => {
      suppressSpyHash = false;
    }, 900);
  });
});

window.addEventListener("load", () => {
  const hash = window.location.hash.slice(1);
  if (hash) {
    const el = document.getElementById(hash);
    if (el) {
      currentHashId = hash;
      window.setTimeout(() => {
        window.scrollTo({ top: hash === "hero" ? 0 : el.offsetTop - 20, behavior: "smooth" });
      }, 50);
    }
  }
});

// ---- Custom cursor ----
(function initCursor() {
  if (matchMedia("(hover: none)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  document.body.append(glow, dot);
  let mx = innerWidth / 2,
    my = innerHeight / 2;
  let gx = mx,
    gy = my,
    dx = mx,
    dy = my;
  let lastSpark = 0,
    lastX = mx,
    lastY = my;
  addEventListener(
    "mousemove",
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      document.body.classList.add("cursor-ready");
      const now = performance.now();
      const dist = Math.hypot(mx - lastX, my - lastY);
      if (dist > 14 && now - lastSpark > 38) {
        lastSpark = now;
        lastX = mx;
        lastY = my;
        const s = document.createElement("div");
        s.className = "cursor-trail";
        s.style.left = mx + "px";
        s.style.top = my + "px";
        const jitter = (Math.random() - 0.5) * 10;
        s.style.transform = `translate3d(calc(-50% + ${jitter}px), calc(-50% + ${jitter}px), 0)`;
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 900);
      }
    },
    { passive: true }
  );
  addEventListener("mousedown", () => document.body.classList.add("cursor-press"));
  addEventListener("mouseup", () => document.body.classList.remove("cursor-press"));
  addEventListener("mouseleave", () => document.body.classList.remove("cursor-ready"));
  addEventListener("mouseenter", () => document.body.classList.add("cursor-ready"));
  const hoverSel =
    'a, button, .play-btn, .pill, .service, .work, .social, .lang-toggle button, input, textarea, [role="button"]';
  document.addEventListener("mouseover", (e) => {
    const tgt = e.target as HTMLElement | null;
    if (tgt?.closest?.(hoverSel)) document.body.classList.add("cursor-hover");
  });
  document.addEventListener("mouseout", (e) => {
    const tgt = e.target as HTMLElement | null;
    if (tgt?.closest?.(hoverSel)) document.body.classList.remove("cursor-hover");
  });
  function raf() {
    gx += (mx - gx) * 0.12;
    gy += (my - gy) * 0.12;
    dx += (mx - dx) * 0.35;
    dy += (my - dy) * 0.35;
    glow.style.transform = `translate3d(${gx}px, ${gy}px, 0) translate(-50%, -50%)`;
    dot.style.transform = `translate3d(${dx}px, ${dy}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(raf);
  }
  raf();
})();

// ---- Scroll reveal ----
const revealTargets: Element[] = [];
function markReveal(el: Element, delayIdx = 0) {
  if (el.classList.contains("reveal")) return;
  el.classList.add("reveal");
  const d = Math.min(4, delayIdx);
  if (d > 0) el.classList.add("d" + d);
  revealTargets.push(el);
}
document.querySelectorAll<HTMLElement>("section").forEach((sec) => {
  if (sec.id === "hero") return;
  const head = sec.querySelector(".section-head, .wordmark-sm, .bass-wordmark");
  if (head) markReveal(head, 0);
});
const blockGroups: string[] = [
  ".work",
  ".service",
  ".bass-grid > *",
  ".playlist-head",
  ".playlist-embed",
  ".live-head",
  ".live-videos .player-media",
  ".contact-grid > *",
  "#about .about-body",
  "#about .award",
];
blockGroups.forEach((sel) => {
  document.querySelectorAll<HTMLElement>(sel).forEach((el, i) => {
    markReveal(el, (i % 3) + 1);
  });
});
const MIN_OPACITY = 0.1;
const MAX_TRANSLATE = 36;

function updateReveal() {
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const start = vh;          // top of element at bottom of viewport
  const end = vh * 0.55;     // top of element at 55% of viewport = fully revealed
  for (const el of revealTargets) {
    const rect = (el as HTMLElement).getBoundingClientRect();
    const y = rect.top;
    let p = (start - y) / (start - end);
    if (p < 0) p = 0;
    else if (p > 1) p = 1;
    const eased = p * p * (3 - 2 * p); // smoothstep
    const op = MIN_OPACITY + (1 - MIN_OPACITY) * eased;
    const ty = (1 - eased) * MAX_TRANSLATE;
    const style = (el as HTMLElement).style;
    style.opacity = op.toFixed(3);
    style.transform = ty > 0.05 ? `translateY(${ty.toFixed(1)}px)` : "none";
  }
}

{
  let rafId = 0;
  const onScroll = () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateReveal();
      rafId = 0;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  updateReveal();
}

// ---- Cursor glow ----
if (window.matchMedia("(hover: hover)").matches) {
  const rootEl = document.documentElement;
  const body = document.body;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  function tick() {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    rootEl.style.setProperty("--cx", cx.toFixed(1) + "px");
    rootEl.style.setProperty("--cy", cy.toFixed(1) + "px");
    if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
    }
  }
  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!body.classList.contains("cursor-active")) body.classList.add("cursor-active");
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.addEventListener("mouseleave", () => body.classList.remove("cursor-active"));
}

// ---- Fake audio players ----
const timers: Record<string, number> = {};
document.querySelectorAll<HTMLElement>("[data-play]").forEach((el) => {
  const i = el.dataset.play!;
  const btn = el.querySelector<HTMLElement>(".play-btn")!;
  const bars = document.querySelectorAll<HTMLElement>(`[data-wave="${i}"] span`);
  const timeEl = document.querySelector<HTMLElement>(`[data-time-cur="${i}"]`);
  let pos = 0,
    playing = false;

  function render() {
    bars.forEach((b, j) => b.classList.toggle("on", j < pos));
    if (timeEl) {
      const total = bars.length;
      const cur = Math.round((pos / total) * 204);
      const m = Math.floor(cur / 60);
      const s = String(cur % 60).padStart(2, "0");
      timeEl.textContent = `${m}:${s}`;
    }
  }
  function toggle() {
    playing = !playing;
    btn.classList.toggle("playing", playing);
    btn.innerHTML = playing
      ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    if (playing) {
      timers[i] = window.setInterval(() => {
        pos++;
        if (pos >= bars.length) pos = 0;
        render();
      }, 80);
    } else {
      clearInterval(timers[i]);
    }
  }
  el.addEventListener("click", toggle);

  const wave = document.querySelector<HTMLElement>(`[data-wave="${i}"]`);
  wave?.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = wave.getBoundingClientRect();
    const pct = ((e as MouseEvent).clientX - rect.left) / rect.width;
    pos = Math.round(pct * bars.length);
    render();
  });
});

// ---- Tweaks panel ----
const tweaksPanel = document.getElementById("tweaks");
function openTweaks(open: boolean) {
  tweaksPanel?.classList.toggle("open", open);
}

document.querySelectorAll<HTMLElement>("#bg-swatches .sw").forEach((sw) => {
  sw.addEventListener("click", () => {
    T.bgTone = sw.dataset.bg!;
    applyTweaks();
    refreshTweaksUI();
    pushEdit({ bgTone: T.bgTone });
  });
});

const hue = document.getElementById("hue-slider") as HTMLInputElement;
const hueVal = document.getElementById("hue-val")!;
hue.value = String(T.accentHue);
hueVal.textContent = `(${T.accentHue}°)`;
hue.addEventListener("input", () => {
  T.accentHue = +hue.value;
  html.style.setProperty("--accent-h", String(T.accentHue));
  hueVal.textContent = `(${T.accentHue}°)`;
});
hue.addEventListener("change", () => pushEdit({ accentHue: T.accentHue }));

const it = document.getElementById("italic-toggle")!;
it.addEventListener("click", () => {
  T.wordmarkItalic = !T.wordmarkItalic;
  applyTweaks();
  refreshTweaksUI();
  pushEdit({ wordmarkItalic: T.wordmarkItalic });
});

const wt = document.getElementById("weight-slider") as HTMLInputElement;
wt.value = String(T.wordmarkWeight);
wt.addEventListener("input", () => {
  T.wordmarkWeight = +wt.value;
  html.style.setProperty("--wm-weight", String(T.wordmarkWeight));
});
wt.addEventListener("change", () => pushEdit({ wordmarkWeight: T.wordmarkWeight }));

const gt = document.getElementById("grain-toggle")!;
gt.addEventListener("click", () => {
  T.grainOn = !T.grainOn;
  applyTweaks();
  refreshTweaksUI();
  pushEdit({ grainOn: T.grainOn });
});

document.querySelectorAll<HTMLElement>("#tex-modes .sw").forEach((b) => {
  b.addEventListener("click", () => {
    T.textureMode = b.dataset.tex as Tweaks["textureMode"];
    applyTweaks();
    refreshTweaksUI();
    pushEdit({ textureMode: T.textureMode });
  });
});

const texSlider = document.getElementById("tex-slider") as HTMLInputElement;
const texVal = document.getElementById("tex-val")!;
texSlider.value = String(T.textureIntensity ?? 55);
texVal.textContent = `(${texSlider.value}%)`;
texSlider.addEventListener("input", () => {
  T.textureIntensity = +texSlider.value;
  html.style.setProperty("--tex-i", (T.textureIntensity / 100).toFixed(3));
  texVal.textContent = `(${T.textureIntensity}%)`;
});
texSlider.addEventListener("change", () => pushEdit({ textureIntensity: T.textureIntensity }));

function refreshTweaksUI() {
  document.querySelectorAll<HTMLElement>("#bg-swatches .sw").forEach((sw) => {
    sw.classList.toggle("active", sw.dataset.bg === T.bgTone);
  });
  document.querySelectorAll<HTMLElement>("#tex-modes .sw").forEach((b) => {
    b.classList.toggle("active", b.dataset.tex === (T.textureMode || "layered"));
  });
  it.classList.toggle("on", T.wordmarkItalic);
  gt.classList.toggle("on", T.grainOn);
}
refreshTweaksUI();

window.addEventListener("message", (e) => {
  const t = e.data && e.data.type;
  if (t === "__activate_edit_mode") openTweaks(true);
  else if (t === "__deactivate_edit_mode") openTweaks(false);
});
try {
  window.parent.postMessage({ type: "__edit_mode_available" }, "*");
} catch {}

export {};
