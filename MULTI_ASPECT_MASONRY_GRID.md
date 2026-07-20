# Multi-Aspect-Ratio Masonry Grid — Implementation Notes

Replaced the fixed-width flex grid (which assumed only 16:9 and 9:16 clips) with a CSS Grid + dense-packing masonry layout so 16:9, 9:16, and 4:3 clips can be mixed on Cassandra Jolie's reel grid with no forced cropping and no blank space between rows.

---

## Problem

The reel grid on the editor page (`pages/editors/[name]/[index].vue`) originally handled exactly two shapes:

- Landscape (assumed 16:9): fixed `padding-bottom: 28.125%` box, 2-up, `.reel:nth-child(odd/even)` margins.
- Portrait (9:16): `.reel.portrait`, real `aspect-ratio` box, 3-up, `:nth-child(3n)` margins.

Once 4:3 clips were mixed in (via the Cassandra sticky/main reel IDs), two problems surfaced:

1. **Forced cropping** — any non-portrait clip (including 4:3) was jammed into the hardcoded 16:9 box. Since `ReelVideo.vue`'s `<video>` uses `object-fit: cover`, a 4:3 clip in a 16:9 box got cropped hard on the top/bottom.
2. **Blank space** — `justify-content: space-between` on the flex container, combined with `:nth-child(odd/even)` margins that assume a row is uniformly one type, left visible gaps whenever a row's mixed-width items didn't sum to exactly 100%, or when a short clip sat next to a tall one (no fill-in for the leftover vertical space).

---

## File Changed

### `pages/editors/[name]/[index].vue`

---

### 1. Removed `reelAspectStyle`, replaced with `reelGridStyle` (in `<script setup>`)

The old helper only gave portrait clips a real `aspect-ratio` box; everything else fell back to the fixed 16:9 padding-bottom hack. The new helper computes an exact `grid-column` + `grid-row` span for **every** clip, based on its real `media_width`/`media_height`:

```js
const GRID_COLUMNS = 6;
const GRID_GAP = 5; // px, matches .reels-container gap
const ROW_UNIT = 1; // px, height of one implicit grid row
const MOBILE_BREAKPOINT = 850; // matches the lt-phone SCSS mixin

const reelsContainerRef = ref(null);
const containerWidth = ref(0);
const isMobileLayout = ref(false);

const measureGridLayout = () => {
  if (!reelsContainerRef.value) return;
  containerWidth.value = reelsContainerRef.value.clientWidth;
  isMobileLayout.value = window.innerWidth <= MOBILE_BREAKPOINT;
};

const spanColumnsFor = (media) => {
  if (isMobileLayout.value) return GRID_COLUMNS; // full width, single column on mobile
  return reelAspectClass(media) === 'portrait' ? 2 : 3;
};

const reelGridStyle = (media) => {
  const w = parseInt(media.media_width || 0);
  const h = parseInt(media.media_height || 0);
  const spanCols = spanColumnsFor(media);
  const style = { gridColumn: `span ${spanCols}` };

  if (w > 0 && h > 0) {
    // Fallback so the item has a sane height before the grid is measured client-side.
    style.aspectRatio = `${w}/${h}`;

    if (containerWidth.value > 0) {
      const colUnit = (containerWidth.value - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
      const widthPx = spanCols * colUnit + (spanCols - 1) * GRID_GAP;
      const heightPx = widthPx * (h / w);
      const rowSpan = Math.max(1, Math.ceil((heightPx + GRID_GAP) / (ROW_UNIT + GRID_GAP)));
      style.gridRowEnd = `span ${rowSpan}`;
    }
  }

  return style;
};
```

- 6 columns lets both existing width buckets fit exactly: landscape/4:3 spans 3 (50%), portrait spans 2 (33.3%).
- `grid-auto-rows: 1px` on the container (see CSS below) makes each grid row track 1px tall, so a `grid-row: span N` gives an item a rendered height of `N px` plus `(N-1)` row-gaps — the classic "fine-grained row unit" trick for masonry-via-CSS-Grid.
- `rowSpan` is derived from the item's **actual** rendered width (based on its column span and the *measured* container width) divided by its real aspect ratio — so every clip's box exactly matches its native shape. No more forced 16:9 cropping.
- `reelAspectClass` (unchanged) still decides portrait vs. not, which only affects the column span now, not the box shape.

### 2. Container width measurement (in `<script setup>`)

Grid-row spans need real pixel measurements, which aren't available during SSR. Added a `ref` on the grid container, measured on mount and on resize:

```js
let gridResizeObserver = null;
let debouncedMeasure = null;

onMounted(async () => {
  // ...existing video-observer setup...

  measureGridLayout();
  debouncedMeasure = () => {
    clearTimeout(debouncedMeasure._t);
    debouncedMeasure._t = setTimeout(measureGridLayout, 150);
  };
  window.addEventListener('resize', debouncedMeasure);
  if (window.ResizeObserver && reelsContainerRef.value) {
    gridResizeObserver = new ResizeObserver(measureGridLayout);
    gridResizeObserver.observe(reelsContainerRef.value);
  }
});

onBeforeUnmount(() => {
  // ...existing cleanup...
  if (gridResizeObserver) gridResizeObserver.disconnect();
  if (debouncedMeasure) {
    clearTimeout(debouncedMeasure._t);
    window.removeEventListener('resize', debouncedMeasure);
  }
});
```

Before this measurement runs (first paint / SSR), each item falls back to its inline `aspect-ratio` style, so there's no layout crash — just a brief, expected reflow once the client measures the real container width.

### 3. Template (`ref` + style binding)

```html
<div v-if="data" class="reels-container" ref="reelsContainerRef">
  <ReelVideo
    v-for="(media, i) in remainingVideos"
    ...
    :class="reelAspectClass(media)"
    :style="reelGridStyle(media)"
  />
</div>
```

Only change: added `ref="reelsContainerRef"` on the container, and swapped `reelAspectStyle` → `reelGridStyle`.

### 4. CSS — `.reels-container` switched from flex to grid

```scss
.reels-container {
  position: relative;
  z-index: 30;
  margin-top: 345px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 1px; /* fine-grained track height; JS sets an exact grid-row span per item */
  grid-auto-flow: dense; /* fills gaps left by shorter neighbors instead of leaving blank space */
  align-items: start;
  width: 100%;
  background: var(--color-black);
  border-top: 5px solid var(--color-black);
  gap: 5px; /* Consistent spacing regardless of how aspect ratios interleave */
  box-sizing: border-box;
}
```

- `grid-auto-flow: dense` is what actually closes the gaps: the browser back-fills earlier empty cells with later items in the list when they fit, instead of leaving dead space. Trade-off: visual order can shift slightly (a later short clip may jump up to fill a gap left by an earlier tall one).
- `gap: 5px` replaces the old `margin`-based spacing — it applies uniformly between every adjacent item regardless of column span, so there's no need for `:nth-child(odd/even)` or `:nth-child(3n)` rules anymore.

### 5. CSS — `.reel` simplified

```scss
.reel {
  /* grid-column and grid-row spans are set inline per-item in reelGridStyle() */
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
```

Removed: fixed `width`, `height: 0` + `padding-bottom` hack, `transition`, and all `:nth-child` margin rules. `.reel.portrait`'s width override was removed entirely — column span is now set inline via `reelGridStyle`.

### 6. CSS — mobile (`lt-phone`) block simplified

```scss
@include lt-phone {
  /* Single-column layout on mobile is handled by isMobileLayout in reelGridStyle() */
}
```

Previously this block force-reset widths/margins for a single mobile column. That's now handled entirely in JS: `isMobileLayout` (driven by the same 850px breakpoint as the `lt-phone` SCSS mixin) makes `spanColumnsFor` return the full 6 columns for every clip below that width.

---

## How It Works End-to-End

1. `measureGridLayout` records the container's real pixel width and whether the viewport is mobile-width.
2. `reelGridStyle` picks a column span (2, 3, or 6 on mobile) and derives the exact row span needed to render that clip at its true aspect ratio, using the fine-grained `1px` row-track trick.
3. `grid-auto-flow: dense` lets the browser slot items into any earlier gap they fit into, so mismatched heights across a row don't leave blank space.
4. Resize / ResizeObserver keep the measurement (and therefore every clip's row span) in sync with viewport changes.

---

## Trade-offs / Known Limitations

- **Visual order isn't strictly left-to-right-in-DOM-order anymore.** Dense packing can pull a later, shorter clip up to fill a gap left by an earlier tall one. This was an explicit, agreed trade-off for closing all blank space.
- **No SSR-exact layout.** `grid-row` spans are only computed client-side (real container width isn't known during SSR); the `aspect-ratio` inline style is the pre-measurement fallback, so there's a brief reflow on first client paint.
- Not extracted into a reusable composable/component — this logic lives inline in `pages/editors/[name]/[index].vue` since it's currently only used on this one page.
