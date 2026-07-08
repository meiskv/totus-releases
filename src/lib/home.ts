// Client-side behaviour for the home page (index.astro).
//
// This lives in a .ts module rather than inline in the .astro <script> so it
// goes through Vite's TypeScript pipeline. Inline .astro client scripts are
// currently miscompiled by the oxc dev transform when they contain type
// annotations; a plain `import { initHome } from "../lib/home"` sidesteps that.
import { fetchLatestRelease, RELEASES_URL } from "./releases";

type Platform = { os: string; label: string; arch?: string };

function detectPlatform(): Platform | null {
  const ua = navigator.userAgent;
  if (/Win/i.test(ua)) return { os: "win", label: "Download for Windows" };
  if (/Mac/i.test(ua)) return { os: "mac", label: "Download for macOS", arch: "arm64" };
  if (/Linux/i.test(ua)) return { os: "linux", label: "Download for Linux" };
  return null;
}

function pickAsset(
  assets: { name: string; browser_download_url: string }[],
  platform: Platform,
): string | null {
  if (platform.os === "win") {
    return assets.find((a) => a.name.endsWith("-x64.exe"))?.browser_download_url ?? null;
  }
  if (platform.os === "mac") {
    const preferred = assets.find((a) => a.name.endsWith(`-${platform.arch}.dmg`));
    const fallback = assets.find((a) => a.name.endsWith(".dmg"));
    return (preferred ?? fallback)?.browser_download_url ?? null;
  }
  if (platform.os === "linux") {
    return assets.find((a) => a.name.endsWith(".AppImage"))?.browser_download_url ?? null;
  }
  return null;
}

async function wireDownload() {
  const btns = document.querySelectorAll<HTMLAnchorElement>(".js-download");
  const labels = document.querySelectorAll<HTMLElement>(".js-download-label");
  const platform = detectPlatform();

  if (platform) {
    document.documentElement.dataset.platform = platform.os;
    labels.forEach((l) => (l.textContent = platform.label));
  }

  try {
    const release = await fetchLatestRelease();
    const url = platform ? pickAsset(release.assets ?? [], platform) : null;
    btns.forEach((btn) => {
      if (url) {
        btn.href = url;
        btn.removeAttribute("target");
        btn.removeAttribute("rel");
      } else {
        btn.href = RELEASES_URL;
      }
    });
  } catch {
    btns.forEach((btn) => (btn.href = RELEASES_URL));
  }
}

function wireReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("reveal--in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--in");
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}

const BAR_H = 34;

function scaleDemo() {
  const box = document.querySelector<HTMLElement>(".demo-desktop");
  const frame = document.querySelector<HTMLIFrameElement>(".app-demo-frame");
  if (!box || !frame) return;
  const LOGICAL_W = 1280;
  const LOGICAL_H = 760;
  const scale = box.clientWidth / LOGICAL_W;
  frame.style.transform = `scale(${scale})`;
  box.style.height = `${LOGICAL_H * scale + BAR_H}px`;
  box.style.aspectRatio = "auto";
}

function wireDemo() {
  const w = document.getElementById("demo-wrap");
  const overlay = document.getElementById("demo-overlay");
  if (!w || !overlay) return;
  const wrap = w;
  const frame = wrap.querySelector<HTMLIFrameElement>("iframe");
  let scrollTimer: number | undefined;

  function deactivate() {
    clearTimeout(scrollTimer);
    wrap.classList.remove("demo--active");
  }

  overlay.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      window.scrollBy({ top: (e as WheelEvent).deltaY, behavior: "instant" });
    },
    { passive: false },
  );

  overlay.addEventListener("click", () => {
    wrap.classList.add("demo--active");
  });

  function attachIframeListeners(doc: Document) {
    doc.addEventListener("wheel", () => {
      if (!wrap.classList.contains("demo--active")) return;
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(deactivate, 1000);
    });
    doc.addEventListener("mousemove", () => {
      if (!wrap.classList.contains("demo--active")) return;
      clearTimeout(scrollTimer);
    });
  }

  if (frame) {
    frame.addEventListener("load", () => {
      try {
        if (frame.contentDocument) attachIframeListeners(frame.contentDocument);
      } catch {}
    });
    try {
      if (frame.contentDocument?.body) attachIframeListeners(frame.contentDocument);
    } catch {}
  }

  wrap.addEventListener("mouseleave", deactivate);
}

function wireFloatPill() {
  const pill = document.getElementById("float-pill");
  const sentinel = document.getElementById("pill-sentinel");
  const cta = document.getElementById("cta");
  if (!pill || !sentinel || !cta || !("IntersectionObserver" in window)) return;

  let pastDemo = false;
  let atCta = false;
  const sync = () => pill.classList.toggle("float-pill--show", pastDemo && !atCta);

  new IntersectionObserver(
    ([e]) => {
      pastDemo = !e.isIntersecting && e.boundingClientRect.top < 0;
      sync();
    },
    { threshold: 0 },
  ).observe(sentinel);

  new IntersectionObserver(
    ([e]) => {
      atCta = e.isIntersecting;
      sync();
    },
    { threshold: 0.15 },
  ).observe(cta);
}

export function initHome() {
  wireDownload();
  wireReveal();
  scaleDemo();
  wireDemo();
  wireFloatPill();
  window.addEventListener("resize", scaleDemo);
}
