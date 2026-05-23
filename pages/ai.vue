<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

// Root wrapper ref — we query `.vf-frame` within this component only,
// which mirrors the original document.querySelectorAll while staying
// scoped to this component's DOM.
const root = ref(null)
let observer = null

onMounted(() => {
  const el = root.value
  if (!el) return

  // Defensive: ensure every video is muted before play so the browser
  // doesn't block autoplay. (Static `muted` works, but binding it via JS
  // guarantees the property is set regardless of Vue version quirks.)
  el.querySelectorAll('video').forEach((v) => {
    v.muted = true
    const p = v.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  })

  // Form the viewfinder brackets as each video scrolls into view.
  const frames = el.querySelectorAll('.vf-frame')
  if (!frames.length) return

  if (!('IntersectionObserver' in window)) {
    frames.forEach((f) => f.classList.add('in-view'))
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Reset so the brackets re-form each time the video re-enters view.
        entry.target.classList.toggle('in-view', entry.isIntersecting)
      })
    },
    {
      // Shrink the active region to a band around the vertical center, so the
      // brackets only begin forming once the video has scrolled near mid-page.
      rootMargin: '-38% 0px -38% 0px',
      threshold: 0,
    }
  )

  frames.forEach((f) => observer.observe(f))
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <div ref="root" class="ai-page">
    <!-- ============ HERO: full-screen autoplay video ============ -->
    <section class="hero">
      <video
        src="https://ps260.gosimian.com/assets/videos/AI_WEBPAGE_MONTAGE_011.mp4"
        autoplay
        muted
        loop
        playsinline
      ></video>

      <img
        class="hero-title"
        src="https://ps260.gosimian.com/assets/images/AI_Page_MainTitle_01_00000.png"
        alt=""
      />

      <div class="scroll-prompt">
        <span>Scroll</span>
        <span class="line"></span>
      </div>
    </section>

    <!-- ============ RIGHT-JUSTIFIED TITLE BANNER ============ -->
    <div class="title-banner">
      <img
        class="ai-title-banner-img"
        src="https://ps260.gosimian.com/assets/images/AI_Page_MainTitle_02_00000.png"
        alt=""
      />
    </div>

    <!-- ============ PARAGRAPH 1 (full-width) ============ -->
    <section class="text-block">
      <p class="garamond-text">
        At PS260, Artificial Intelligence is already integrated into our daily workflow. From bidding, concepting, previz, and tracking to VFX enhancement and localization, we use AI as a tool, not a substitute for taste, judgment, or craft. It helps us move faster, work smarter, and stay focused on the story, all while saving time and money behind the camera.
      </p>
      <br />
      <p class="garamond-text">The tools are changing. Our standards are not.</p>
    </section>

    <!-- ============ ROW 1: Video 1 (left) + Paragraph 2 (right) ============ -->
    <section class="row">
      <div class="vf-frame">
        <video
          src="https://ps260.gosimian.com/assets/videos/Izakaya_Compare_01.mp4"
          autoplay
          muted
          loop
          playsinline
        ></video>
        <span class="vf-corner tl"></span>
        <span class="vf-corner tr"></span>
        <span class="vf-corner bl"></span>
        <span class="vf-corner br"></span>
      </div>
      <div>
        <img class="ai-row-head" src="https://ps260.gosimian.com/assets/images/AI_Page_MainTitle_03_00000.png" alt="" />
        <p class="garamond-text">
          AI doesn’t have to look like AI. Editors, vfx artists, and motion graphics artists at PS260 alter, refine, and remix every frame of generated content. From conception to delivery, from storyboards, prompt language, and reference images to grade, grain, and finishing touches, we ensure that the original idea remains intact, intentional, and uncompromised.
        </p>
      </div>
    </section>

    <!-- ============ FULL-WIDTH VIDEO (between Row 1 and Row 2) ============ -->
    <video
      class="full-video"
      src="https://ps260.gosimian.com/assets/videos/Storyboard.mp4"
      autoplay
      muted
      loop
      playsinline
    ></video>

    <!-- ============ ROW 2: Paragraph 3 (left) + Video 2 (right) ============ -->
    <section class="row reverse">
      <div class="vf-frame">
        <video
          src="https://ps260.gosimian.com/assets/videos/BehindTheScenes.mp4"
          autoplay
          muted
          loop
          playsinline
        ></video>
        <span class="vf-corner tl"></span>
        <span class="vf-corner tr"></span>
        <span class="vf-corner bl"></span>
        <span class="vf-corner br"></span>
      </div>
      <div>
        <img class="ai-row-head" src="https://ps260.gosimian.com/assets/images/AI_Page_MainTitle_04_00000.png" alt="" />
        <p class="garamond-text">
          From streamlining research and shot listing to storyboard exploration, we utilize these tools to refine our workflow before any camera rolls. By automating schedule generation and repetitive tasks, AI serves as an essential production assistant. It empowers our teams to work with greater speed and precision, protecting the space needed to focus on the real story.
        </p>
      </div>
    </section>

    <!-- ============ ROW 3: Paragraph 4 (centered) ============ -->
    <section class="text-block centered-block">
      <img class="centered-head" src="https://ps260.gosimian.com/assets/images/AI_Page_MainTitle_05_00000.png" alt="" />
      <p class="garamond-text">
        New technology can’t replace the human touch. PS260’s principles remain deeply rooted within feeling, emotion, and craft. We tell stories that move people.
        As technology evolves, the tools evolve, and we aren’t waiting for the future to arrive. We’re building in it.
      </p>
    </section>
  </div>
</template>

<!--
  GLOBAL styles (not scoped): the box-sizing reset and font import affect the
  whole document. The html/body block from the original page has been removed,
  so the page background, base font-size, and overflow handling are now
  inherited from your app's own global styles — set them there if needed
  (e.g. `background: #000; color: #fff;` to keep the full-black layout).

  Preferred: instead of @import below, add this to public/index.html <head>
  for better load performance:
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Space+Mono&display=swap" rel="stylesheet" />
-->
<style>
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Space+Mono&display=swap');

*, *::before, *::after { box-sizing: border-box; }
</style>

<style scoped>
/* Apply to each text paragraph that should use the serif typeface */
.garamond-text {
  font-family: 'EB Garamond', Georgia, serif;
}

/* ---------- HERO ---------- */
.hero {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.hero video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

/* Subtle vignette so the scroll prompt stays legible over any footage */
.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%);
  pointer-events: none;
}

.scroll-prompt {
  position: absolute;
  bottom: calc(2.5rem + 80px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  animation: float 2.4s ease-in-out infinite;
}

.scroll-prompt .line {
  width: 1px;
  height: 36px;
  background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 100%);
}

@keyframes float {
  0%, 100% { transform: translate(-50%, 0); opacity: 0.85; }
  50%      { transform: translate(-50%, 8px); opacity: 1; }
}

/* ---------- CENTERED HERO TITLE (over video) ---------- */
.hero-title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  max-width: 80%;
  max-height: 60%;
  width: auto;
  height: auto;
  pointer-events: none;
}

/* ---------- RIGHT-JUSTIFIED TITLE BANNER (between hero and paragraph 1) ---------- */
.title-banner {
  display: flex;
  justify-content: flex-end;
  padding: 3rem 2rem 0;
  max-width: 1280px;
  margin: 0 auto;
}

.ai-title-banner-img {
  max-width: 50%;
  height: auto;
  display: block;
}

/* ---------- FULL-WIDTH VIDEO (between rows) ---------- */
.full-video {
  width: 100%;
  display: block;
  max-height: 80vh;
  object-fit: cover;
  background: #000;
}

/* ---------- STANDALONE PARAGRAPH (Paragraph 1) ---------- */
.text-block {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem 8rem;
}

.text-block p {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.75;
  color: #fff;
}

/* ---------- CENTERED BLOCK (Paragraph 4, video removed) ---------- */
/* The block itself stays centered as a 640px column (.text-block),
   but its contents are left-justified. */
.centered-block {
  text-align: left;
}

.centered-block .centered-head {
  display: block;
  max-width: 60%;
  height: auto;
  margin: 0 0 1.5rem;
}

/* ---------- SIDE-BY-SIDE ROWS ---------- */
.row {
  display: flex;
  align-items: flex-start;
  gap: 3rem;
  max-width: 1280px;
  margin: 0 auto;
  padding: 5rem 2rem;
}

.row.reverse {
  flex-direction: row-reverse;
}

.row > * {
  flex: 1 1 0;
  min-width: 0;
}

.row video {
  width: 100%;
  display: block;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #000;
}

.row p {
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.75;
  color: #fff;
}

.row .ai-row-head {
  display: block;
  max-width: 70%;
  height: auto;
  margin: 0 0 1.5rem;
}

@media (max-width: 768px) {
  .text-block { padding: 5rem 1.25rem; }
  .text-block p { font-size: 1.1rem; }
  .scroll-prompt { font-size: 0.6rem; bottom: 1.75rem; }

  .title-banner { padding: 2rem 1.25rem 0; }
  .ai-title-banner-img { max-width: 70%; }

  /* Stack rows on small screens; keep video above text consistently */
  .row, .row.reverse {
    flex-direction: column;
    gap: 1.75rem;
    padding: 3.5rem 1.25rem;
  }
  .row p { font-size: 1.1rem; }
}

/* ---------- VIEWFINDER CORNER BRACKETS (Video 1 & Video 2) ---------- */
.vf-frame {
  position: relative;
}

.vf-corner {
  position: absolute;
  width: 52px;
  height: 52px;
  z-index: 4;
  pointer-events: none;
}

/* Each corner is two perpendicular arms (horizontal + vertical) that
   grow out from the corner point when the video scrolls into view. */
.vf-corner::before,
.vf-corner::after {
  content: "";
  position: absolute;
  background: rgba(255, 255, 255, 0.92);
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.45));
  transform: scale(0);
  transition: transform 0.95s cubic-bezier(0.22, 1, 0.36, 1);
}

/* horizontal arm */
.vf-corner::before { height: 2px; width: 100%; }
/* vertical arm */
.vf-corner::after  { width: 2px; height: 100%; }

/* Corner placement (just outside the frame edges) */
.vf-corner.tl { top: -20px; left: -20px; }
.vf-corner.tr { top: -20px; right: -20px; }
.vf-corner.bl { bottom: -20px; left: -20px; }
.vf-corner.br { bottom: -20px; right: -20px; }

/* Anchor each arm to its corner so it grows outward from the meeting point */
.vf-corner.tl::before { top: 0; left: 0; transform-origin: left center; }
.vf-corner.tl::after  { top: 0; left: 0; transform-origin: center top; }

.vf-corner.tr::before { top: 0; right: 0; transform-origin: right center; }
.vf-corner.tr::after  { top: 0; right: 0; transform-origin: center top; }

.vf-corner.bl::before { bottom: 0; left: 0; transform-origin: left center; }
.vf-corner.bl::after  { bottom: 0; left: 0; transform-origin: center bottom; }

.vf-corner.br::before { bottom: 0; right: 0; transform-origin: right center; }
.vf-corner.br::after  { bottom: 0; right: 0; transform-origin: center bottom; }

/* When the frame is scrolled into view, the arms draw in */
.vf-frame.in-view .vf-corner::before { transform: scaleX(1); }
.vf-frame.in-view .vf-corner::after  { transform: scaleY(1); }

/* Slight stagger so corners form one after another */
.vf-frame.in-view .vf-corner.tl::before,
.vf-frame.in-view .vf-corner.tl::after { transition-delay: 0s; }
.vf-frame.in-view .vf-corner.tr::before,
.vf-frame.in-view .vf-corner.tr::after { transition-delay: 0.18s; }
.vf-frame.in-view .vf-corner.bl::before,
.vf-frame.in-view .vf-corner.bl::after { transition-delay: 0.36s; }
.vf-frame.in-view .vf-corner.br::before,
.vf-frame.in-view .vf-corner.br::after { transition-delay: 0.54s; }

@media (max-width: 768px) {
  .vf-corner { width: 40px; height: 40px; }
  .vf-corner.tl { top: -16px; left: -16px; }
  .vf-corner.tr { top: -16px; right: -16px; }
  .vf-corner.bl { bottom: -16px; left: -16px; }
  .vf-corner.br { bottom: -16px; right: -16px; }
}
</style>
