# Portrait 3-Column Grid — Implementation Notes

Added support for a 3-wide grid layout for 9:16 (portrait) videos on the editor page. Landscape (16:9) videos remain capped at 2-wide.

---

## Problem

Portrait videos in the reel grid were displayed 2-wide, giving each card a very tall, narrow shape — roughly `~16.67% of viewport width`. A 3-column layout is more appropriate for portrait content and matches how 9:16 video is presented on modern platforms.

---

## File Changed

### `pages/editors/[name]/[index].vue`

**Three additions were made.**

---

### 1. `reelAspectClass` helper (in `<script setup>`)

```js
const reelAspectClass = (media) => {
  const w = parseInt(media.media_width || 0);
  const h = parseInt(media.media_height || 0);
  return h > w && w > 0 ? 'portrait' : '';
};
```

Uses the same `h > w` detection as the existing `reelAspectStyle`. Returns `'portrait'` for portrait videos, empty string for landscape.

---

### 2. `:class` binding on `<ReelVideo>` (in template)

```html
<ReelVideo
  v-for="(media, i) in remainingVideos"
  ...
  :class="reelAspectClass(media)"
  :style="reelAspectStyle(media)"
/>
```

In Vue 3, a class bound on a component is merged onto the component's root element. Since `ReelVideo`'s root element already has class `reel`, portrait reels gain class `reel portrait`.

---

### 3. CSS — `.reel.portrait` (in `<style lang="scss" scoped>`)

**Desktop (3-column):**

```scss
.reel.portrait {
  width: calc(33.333% - 3.334px);

  &:nth-child(odd), &:nth-child(even) {
    margin-left: 0;
    margin-right: 0;
  }

  &:not(:nth-child(3n)) {
    margin-right: 5px;
  }
}
```

- `width: calc(33.333% - 3.334px)` — accounts for 2 × 5px horizontal gaps distributed across 3 items (10px / 3 ≈ 3.334px per item). Three items × `(33.333% - 3.334px)` + two `5px` gaps = 100%.
- The `odd`/`even` margin overrides are necessary because the base `.reel` rule assigns `margin-right: 2.5px` to odd children and `margin-left: 2.5px` to even children. These target a 2-column assumption and would misalign a 3-column grid.
- `:not(:nth-child(3n))` applies `margin-right: 5px` to every item that is **not** the last in its row (3rd, 6th, 9th…), producing consistent 5px gutters.

**Mobile override (inside existing `@include lt-phone` block):**

```scss
.reel.portrait {
  width: 100%;

  &:not(:nth-child(3n)) {
    margin-right: 0;
  }
}
```

Resets portrait reels to full-width stacked layout on mobile, consistent with landscape behavior. The `margin-right` reset is needed because the desktop portrait rule targets `:not(:nth-child(3n))` — without this override, portrait items would carry a `5px` right margin on mobile (harmless in a column layout, but unnecessary).

---

## How It Works

1. Simian data includes `media_width` and `media_height` on each media item.
2. `reelAspectClass` detects portrait dimensions and returns `'portrait'`.
3. Vue merges `'portrait'` onto the `.reel` root element.
4. The `.reel.portrait` CSS rule overrides width to `~33.333%` and replaces the 2-column margin logic with 3-column gutters.
5. The aspect ratio and height are still controlled by the existing `reelAspectStyle` inline style — no change needed there.

---

## Backward Compatibility

- `reelAspectClass` returns `''` for landscape videos — no class is added, 2-column layout is unchanged.
- All landscape-specific rules (`.reel:nth-child(odd)`, `.reel:nth-child(even)`) continue to apply to landscape reels exactly as before.
- No changes to `ReelVideo.vue`, `VideoStage.vue`, or `ReelMedia.vue`.
