<template>
  <div ref="accentImageRef" class="accent-image">
    <div v-if="!mediaItems.length" class="loading-text">Loading...</div>
    <div v-else class="media-container">
      <!-- Current Media Display with NuxtLink if linking is enabled -->
      <div v-if="currentMedia" class="current-media-wrapper">
        <!-- Use NuxtLink if linking is enabled -->
        <NuxtLink v-if="!isLinkDisabled" :to="getMediaLink(currentMedia.title)" class="media-link">
          <!-- Video Media -->
          <video 
            v-if="currentMedia.type === 'video'" 
            class="video-element" 
            :src="currentMedia.url" 
            muted 
            loop
            playsinline
            autoplay
          ></video>
          <!-- Image Media -->
          <img 
            v-else 
            class="image-element" 
            :src="currentMedia.url" 
            alt=""
          />
        </NuxtLink>
        
        <!-- Use a div when linking is disabled -->
        <div v-else class="media-link no-link">
          <!-- Video Media -->
          <video 
            v-if="currentMedia.type === 'video'" 
            class="video-element" 
            :src="currentMedia.url" 
            muted 
            loop
            playsinline
            autoplay
          ></video>
          <!-- Image Media -->
          <img 
            v-else 
            class="image-element" 
            :src="currentMedia.url" 
            alt=""
          />
        </div>
      </div>
      
      <!-- Indicator for debugging -->
      <!-- <div class="media-indicator">
        {{ activeIndex + 1 }} / {{ mediaItems.length }}
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
// Define media item interface
interface MediaItem {
  type: 'video' | 'image';
  url: string;
  thumbnail?: string;
  title?: string;
}

// Props definition
const props = defineProps({
  blok: {
    type: Object,
    required: true
  },
  isWider: {
    type: Boolean,
    default: false
  }
});

// Core state variables
const accentImageRef = ref(null);
const activeIndex = ref(0);
const mediaItems = ref<MediaItem[]>([]);
const isReady = ref(false);

// Computed property for current media
const currentMedia = computed(() => {
  if (!mediaItems.value.length) return null;
  return mediaItems.value[activeIndex.value];
});

// Check if linking should be disabled
const isLinkDisabled = computed(() => {
  // Simply check if disableLink is "true"
  return props.blok.disableLink === "true";
});

// Function to generate media link
const getMediaLink = (title: string | undefined): string => {
  if (!title) return '#';
  return `/featured/${sanitizeTitle(title)}`;
};

// Helper to sanitize titles for URLs
const sanitizeTitle = (title: string): string => {
  if (!title) return '';
  
  return title
    .toLowerCase()                    // Convert to lowercase
    .replace(/['"""'']/g, '')         // Remove quotes
    .replace(/&/g, '-and-')           // Replace & with 'and'
    .replace(/[^a-zA-Z0-9- ]/g, '')   // Remove special chars
    .trim()                           // Trim whitespace
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .replace(/-+/g, '-')              // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens
};

// Fetch media data
const { data: fetchedMedia, pending, error } = await useAsyncData(
  `accent-media-${props.blok.simianReelId}`,
  async () => {
    try {
      // console.log('🎬 Fetching media with ID:', props.blok.simianReelId);
      
      const response = await $fetch('/api/simian', {
        method: 'POST',
        body: { reelId: props.blok.simianReelId }
      });

      if (!response?.root?.media) {
        throw new Error('No media found in response');
      }

      const mediaArray = Array.isArray(response.root.media) 
        ? response.root.media 
        : [response.root.media];

      return mediaArray.map(media => ({
        type: media.file_type || (media.media_file?.endsWith('.mp4') ? 'video' : 'image'),
        url: media.media_file,
        thumbnail: media.thumbnail,
        title: media.title
      }));
    } catch (error) {
      console.error('Error fetching Simian media:', error);
      throw error;
    }
  },
  {
    server: true,
    immediate: true,
    transform: (data) => data || [],
    default: () => []
  }
);

// Immediately set media items when data is available
if (fetchedMedia.value?.length) {
  mediaItems.value = fetchedMedia.value;
  // console.log(`✅ IMMEDIATE: Loaded ${mediaItems.value.length} media items from Simian`);
  isReady.value = true;
}

// Also watch for changes
watch(fetchedMedia, (newData) => {
  if (newData?.length) {
    mediaItems.value = newData;
    // console.log(`✅ WATCH: Loaded ${mediaItems.value.length} media items from Simian`);
    isReady.value = true;
  }
});

// Function to change to next media item
function changeToNextMedia() {
  if (!mediaItems.value.length) {
    console.error('❌ Cannot change media - no items available');
    return false;
  }
  
  // Calculate next index
  const nextIndex = (activeIndex.value + 1) % mediaItems.value.length;
  
  // Log for debugging
  // console.log(`🔄 CHANGING MEDIA: ${activeIndex.value + 1} → ${nextIndex + 1}`);
  // console.log(`  • From: "${mediaItems.value[activeIndex.value]?.title || 'Untitled'}"`);
  // console.log(`  • To: "${mediaItems.value[nextIndex]?.title || 'Untitled'}"`);
  
  // Update index
  activeIndex.value = nextIndex;
  return true;
}

// Make the function available globally for debugging
onMounted(() => {
  window.changeAccentMedia = changeToNextMedia;
});

// Watch for isWider changes
watch(() => props.isWider, (newIsWider, oldIsWider) => {
  // Only process actual changes
  if (newIsWider === oldIsWider || !isReady.value) return;
  
  // console.log(`🔎 ACCENT: isWider changed: ${oldIsWider} → ${newIsWider}`);
  
  // Change media ONLY when isWider changes from true to false
  if (newIsWider === false && oldIsWider === true) {
    // console.log(`🚨 TRUE → FALSE detected - changing media item`);
    changeToNextMedia();
  }
}, { immediate: false });

// Cleanup
onBeforeUnmount(() => {
  // Clean up any global references
  if (window.changeAccentMedia) {
    window.changeAccentMedia = undefined;
  }
});
</script>

<style lang="scss" scoped>
.accent-image {
  position: fixed;
  top: 0;
  z-index: 10;
  overflow: hidden;
  background-color: var(--color-black);
  transition: all 0.4s;
  height: 100svh;
  width: 100vw;

  .loading-text {
    color: white;
    font-size: 16px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .media-container {
    position: relative;
    height: 100%;
    width: 100%;
  }
  
  .current-media-wrapper {
    position: relative;
    height: 100%;
    width: 100%;
  }
  
  .media-link {
    display: block;
    height: 100%;
    width: 100%;
    transition: opacity 0.4s var(--easing-motion, ease);
    
    &:hover {
      opacity: 0.85;
    }
    
    &.no-link {
      cursor: default;
      
      &:hover {
        opacity: 1;
      }
    }
  }

  .video-element,
  .image-element {
    position: fixed;
    top: 0;
    height: 100vh;
    width: 50vw;
    pointer-events: auto;
    object-fit: cover;
    box-sizing: border-box;
    padding: 0;
    object-position: center;
    transition: padding 0.4s;
  }
  
  .media-indicator {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(0,0,0,0.5);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 100;
  }

  @include phone-landscape {
    .video-element,
    .image-element {
      // width: 50vw;
    }
  }

  @include lt-small-desktop {
    display: none;
  }
}
</style>