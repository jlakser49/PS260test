<!-- components/VideoStage.vue -->
<template>
  <div ref="stageRef" :class="classes">
    <div
      v-if="$slots.top"
      ref="topRef"
      class="slot slot-top"
    >
      <slot name="top" />
    </div>

    <div class="video-container">
      <video 
        ref="videoRef"
        class="video"
        :src="mobileSrc"
        playsinline
        autoplay
        controls
      />
    </div>

    <div
      v-if="$slots.default"
      ref="bottomRef"
      class="slot slot-bottom"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useBreakpoint } from '~/composables/useBreakpoint'

const { isMobile } = useBreakpoint()

const props = defineProps({
  mobileSrc: {
    type: String,
    required: true
  },
  desktopSrc: {
    type: String,
    required: true
  },
  poster: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'css'
  },
  portrait: {
    type: Boolean,
    default: false
  }
})

// Refs
const stageRef = ref(null)
const topRef = ref(null)
const bottomRef = ref(null)
const videoRef = ref(null)

// State
const hasLoaded = ref(true)

// Computed
const classes = computed(() => [
  "video-stage",
  "has-loaded",
  { "is-mobile": isMobile.value, "is-portrait": props.portrait },
  `mode-${props.mode}`
])

// Lifecycle hooks
// No need for empty resize handler
onMounted(() => {
  // Empty handler removed
});
</script>

<style lang="scss">
.video-stage {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 40px 40px 0 40px;
  box-sizing: border-box;
  
  .video-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    max-height: 450px;
  }

  .video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    max-width: 750px;
    padding: 5px 0;
    box-sizing: border-box;
    margin: 0 auto;
  }
  
  .slot {
    overflow: hidden;
    width: 100%;
    z-index: 1;
  }

  &.mode-css {
    .video-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .video {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
    }
  }

  @include phone-landscape {
    padding: 22px;
    
    .video {
      max-width: 400px;
      padding: 0;
    }
  }

  &.is-mobile {
    .video-container {
      height: auto;
    }
    .video {
      max-width: 100%;
      height: auto;
      padding: 0;
    }
  }

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
}
</style>