<template>
  <div 
    :class="['banner-section', 'block-item', { 'reel-hovered': isAnyReelHovered }]"
    ref="bannerRef"
  >
    <div class="banner-media" v-if="firstVideo">
      <StickyVideo
        :video-path="firstVideo.media_file"
        :placeholder-image="firstVideo.thumbnail"
        :name="pageName"
        :is-dimmed="isAnyReelHovered"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
});

const route = useRoute();
const pageName = computed(() => {
  // Use the title from Storyblok, or fall back to the page name from route
  if (props.blok.title) {
    return props.blok.title;
  }
  
  // Fallback: Get page title from route
  // First try the last part of the route path
  if (route.path) {
    const pathSegments = route.path.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      // Get the last segment and convert to title case
      const lastSegment = pathSegments[pathSegments.length - 1];
      return toTitleCase(lastSegment.replace(/-/g, ' '));
    }
  }
  
  // Second fallback: try route name
  if (route.name) {
    return toTitleCase(route.name.replace(/-/g, ' '));
  }
  
  // Last resort: empty string
  return '';
});

// Helper function to convert string to title case
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

// State for tracking loading and data
const loading = ref(true);
const firstVideo = ref(null);
const isAnyReelHovered = ref(false);
const bannerRef = ref(null);

// Event handler function to be passed to ReelVideo components
const handleReelHover = () => {
  isAnyReelHovered.value = true;
};

const handleReelUnhover = () => {
  isAnyReelHovered.value = false;
};

// Define event handler references at the component level
let handleGlobalMouseOver;
let handleGlobalMouseOut;

// Clean up event listeners on component unmount
onBeforeUnmount(() => {
  if (process.client && handleGlobalMouseOver && handleGlobalMouseOut) {
    document.removeEventListener('mouseover', handleGlobalMouseOver);
    document.removeEventListener('mouseout', handleGlobalMouseOut);
  }
});

// Get the Simian reel data
onMounted(async () => {
  loading.value = true;
  
  if (props.blok.SimianReelID) {
    try {
      // Fetch reel data from API
      const reelData = await $fetch('/api/simian', {
        method: 'POST',
        body: {
          reelId: props.blok.SimianReelID
        }
      });
      
      // Extract the first video from the response
      if (reelData?.root?.media) {
        if (Array.isArray(reelData.root.media)) {
          firstVideo.value = reelData.root.media[0] || null;
        } else {
          // Single media item
          firstVideo.value = reelData.root.media;
        }
      }
    } catch (error) {
      console.error('Error fetching Simian banner data:', error);
    }
  }
  
  loading.value = false;
  
  // Set up global event listeners for hover events from any source
  if (process.client) {
    handleGlobalMouseOver = (e) => {
      const reelElement = e.target.closest('.reel');
      if (reelElement) {
        isAnyReelHovered.value = true;
      }
    };
    
    handleGlobalMouseOut = (e) => {
      const reelElement = e.target.closest('.reel');
      const relatedTarget = e.relatedTarget;
      
      // Only unhover if we're not still within a reel element
      if (reelElement && !reelElement.contains(relatedTarget)) {
        isAnyReelHovered.value = false;
      }
    };
    
    // Add event listeners
    document.addEventListener('mouseover', handleGlobalMouseOver);
    document.addEventListener('mouseout', handleGlobalMouseOut);
    
    // We'll handle fade-in in the StickyVideo component directly
  }
});
</script>

<style scoped lang="scss">
.banner-section {
  // position: fixed;
  // width: 100%;
  // height: 30vh;
  // max-height: 30vh;
  // display: block;

  height: calc(350px - 80px);
  transition: background-color 0.4s var(--easing-motion),
  opacity 0.4s var(--easing-motion);
  
  &.reel-hovered {
    // opacity: 0.65;
  }

.banner-media {
  width: 100%;
  height: 100%;
}

  @include gt-cinema {
    height: calc(450px - var(--unit-header-height));
  }

  @include lt-tablet {
    height: calc(250px - var(--unit-header-height));
  }

}
</style>