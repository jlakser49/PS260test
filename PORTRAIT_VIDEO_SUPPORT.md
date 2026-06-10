# Portrait Video Support — Implementation Notes

Added support for 9:16 (portrait) videos across the editor reel grid and the full-screen lightbox player. Previously all containers assumed 16:9 (landscape), causing portrait content to be zoomed and cropped.

---

## Problem

Cassandra Jolie's Simian reels (`media_width: 2160`, `media_height: 3840`) are 9:16 portrait. Two places were broken:

1. **Reel cards** on the editor page — container uses a hardcoded `padding-bottom: 28.125%` (16:9 aspect ratio at 50% width), and `object-fit: cover` on the video, causing portrait content to be cropped to fill a landscape box.
2. **Full-screen lightbox player** — `VideoStage.vue` uses `object-fit: cover` and `max-height: 450px`, which forces portrait video into a landscape frame.

---

## Files Changed

### 1. `pages/editors/[name]/[index].vue`

**What changed:** The reel card grid now reads each video's actual dimensions and overrides the aspect ratio for portrait content.

**Added function** (in `<script setup>`):
```js
const reelAspectStyle = (media) => {
  const w = parseInt(media.media_width || 0);
  const h = parseInt(media.media_height || 0);
  if (h > w && w > 0) {
    return { aspectRatio: `${w}/${h}`, height: 'auto', paddingBottom: '0' };
  }
  return {};
};
```

- For **landscape** videos: returns `{}` — existing `padding-bottom: 28.125%` (16:9) applies unchanged.
- For **portrait** videos: returns inline `aspect-ratio`, `height: auto`, and `paddingBottom: '0'` to override the padding-bottom trick with a proper CSS aspect ratio.

**Updated template** — applied the style to each `ReelVideo` component:
```html
<ReelVideo
  v-for="(media, i) in remainingVideos"
  ...
  :style="reelAspectStyle(media)"
/>
```

**Why `paddingBottom: '0'` and `height: 'auto'`:** The existing layout uses the `height: 0; padding-bottom` CSS trick for aspect ratio. Overriding with just `aspect-ratio` isn't enough — you also need to zero out `padding-bottom` and set `height: auto` to let the `aspect-ratio` property take full control. This avoids conflicts between the two approaches.

---

### 2. `components/VideoStage.vue`

**What changed:** Added a `portrait` prop and portrait-specific CSS styles.

**Added prop:**
```js
portrait: {
  type: Boolean,
  default: false
}
```

**Updated `classes` computed** to include `is-portrait` when portrait:
```js
const classes = computed(() => [
  "video-stage",
  "has-loaded",
  { "is-mobile": isMobile.value, "is-portrait": props.portrait },
  `mode-${props.mode}`
])
```

**Added CSS block:**
```scss
&.is-portrait {
  .video-container {
    max-height: none;
  }
  .video {
    object-fit: contain;
    max-width: 400px;
    max-height: 85vh;
  }
}
```

- `max-height: none` on `.video-container` removes the `450px` cap that forced a landscape shape.
- `object-fit: contain` displays the full video frame without cropping (vs. `cover` which zooms to fill).
- `max-width: 400px` keeps the portrait video at a phone-like width on desktop — consistent with how 9:16 content is presented on platforms like TikTok/YouTube Shorts.
- `max-height: 85vh` prevents the video from overflowing the viewport on shorter screens.

> **Note:** This initial CSS was later revised — see [Mobile Fix](#mobile-fix-portrait-video-cut-off-on-iphone) below.

---

### 3. `components/ReelMedia.vue`

**What changed:** Added `isPortrait` computed and wired it to `VideoStage`.

**Added computed** (placed after `currentMedia` computed):
```js
const isPortrait = computed(() => {
  const w = parseInt(currentMedia.value?.media_width || 0);
  const h = parseInt(currentMedia.value?.media_height || 0);
  return h > w && w > 0;
});
```

Reads `media_width` and `media_height` from the currently active Simian media item. Returns `true` when height > width (portrait).

**Updated `VideoStage` usage** in template:
```html
<VideoStage
  :desktopSrc="currentMedia.media_file"
  :mobileSrc="currentMedia.media_file"
  mode="fit-to-parent"
  class="reel-stage"
  ref="containerRef"
  :poster="currentMedia.thumbnail"
  :portrait="isPortrait"
>
```

---

## How It Works End-to-End

### Reel cards (editor page grid)

1. Simian data includes `media_width` and `media_height` on each media item.
2. `reelAspectStyle(media)` checks if `h > w` — if so, returns `aspect-ratio: 2160/3840` (or whatever the actual dimensions are).
3. The inline style overrides `padding-bottom` on the `.reel` element, making the card portrait-shaped.
4. The video inside fills the correctly-shaped portrait card with `object-fit: cover` — no cropping since card and video now share the same aspect ratio.

### Full-screen lightbox (video player)

1. `ReelMedia.vue` computes `isPortrait` from the active media item's dimensions.
2. Passes `portrait` prop to `VideoStage`.
3. `VideoStage` applies `.is-portrait` class which:
   - Removes the `max-height: 450px` cap on the video container.
   - Switches video rendering to `object-fit: contain` — full portrait frame is visible.
   - Constrains the video to `max-width: 400px` / `max-height: 85vh` for a clean presentation.

---

## Mobile Fix — Portrait Video Cut Off on iPhone

### Problem

On iPhone, the portrait video was getting cut off at the bottom inside the lightbox. Root cause:

- `--window-height` = `100svh - 128px` (subtracts the site's nav height).
- The lightbox stage (`VideoStage`) is that height, with `overflow: hidden`.
- The stage is a **flex column** (set by `ReelMedia.vue`'s `:deep` override) with three children: `slot-top` (header ~70px), `.video-container`, and `slot-bottom` (info ~80px).
- The original `.is-portrait` CSS used `height: auto; max-height: 85vh` on the video, letting it grow to its full natural height (~693px on a 390px-wide iPhone 14). Combined with the header and info slots, the total exceeded the stage height and the bottom of the video was clipped.

### Fix — `components/VideoStage.vue`

Replaced the `max-height: 85vh` approach with a flex-based layout so `.video-container` only occupies the space **remaining between the header and info slots** — it can never overflow.

**Updated CSS block** (replaces the original `.is-portrait` block):
```scss
&.is-portrait {
  .video-container {
    flex: 1 1 0;
    min-height: 0;
    max-height: none;
  }
  .video {
    object-fit: contain;
    max-width: 400px;
    height: 100%;
  }
}
```

- `flex: 1 1 0` — `.video-container` becomes a flex child that grows to fill all remaining vertical space after the header and info slots claim their natural heights.
- `min-height: 0` — required on flex children to allow shrinking below their content size; without this the container can still overflow.
- `max-height: none` — removes the `450px` cap from the base styles.
- `height: 100%` on `.video` — fills the flex container exactly; `object-fit: contain` then scales the portrait frame to fit within that height without cropping.

**Why not just reduce `max-height`:** A fixed `max-height` value (e.g., `60vh`) would need to account for the exact heights of the header and info slots, which vary by device and content. The flex approach adapts to any screen size automatically.

---

## Backward Compatibility

All changes are purely additive for landscape content:

- `reelAspectStyle` returns `{}` for landscape videos — no style change.
- `isPortrait` returns `false` for landscape videos — `portrait` prop is `false` by default.
- `VideoStage` without `portrait` prop behaves identically to before.

No other editors are affected.
