<!-- components/SimianReel.vue -->
<template>
    <div :class="['reels-container', 'block-item', { 'reel-hovered': isAnyReelHovered }]">
      <div v-if="pending" class="loading-text">
        Loading...
      </div>
  
      <template v-else-if="!error && data?.root?.media">
        <ReelVideo
          v-for="(media, index) in mediaItems"
          :key="media.id"
          :media="media"
          :editorName="dunamicSlug"
          :isFirst="index === 0"
          :index="index"
          @hover="handleReelHover"
          @unhover="handleReelUnhover"
        />
      </template>
    </div>
  </template>
  
  <script setup>
const route = useRoute();
const isAnyReelHovered = ref(false);

const handleReelHover = () => {
  isAnyReelHovered.value = true;
};

const handleReelUnhover = () => {
  isAnyReelHovered.value = false;
};

const props = defineProps({
    blok: {
        type: Object,
        required: true
    }
});

const dunamicSlug = computed(() => {
  return formatName(route?.params?.slug[0] || "");
});

const formatName = (name) => {
  if (!name) return '';
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
  
  const { data, error, pending } = await useAsyncData(
    `simian-reel-${props.blok.SimianReelID}`,
    async () => {
      try {
        const reelData = await $fetch('/api/simian', {
          method: 'POST',
          body: {
            reelId: props.blok.SimianReelID
          },
          headers: {
            // Prefer cached data if available (increases browser cache utilization)
            'Cache-Control': 'max-age=3600'
          }
        });
  
        if (!reelData?.root?.media) {
          throw createError({
            statusCode: 404,
            message: 'No media found in reel'
          });
        }
  
        return reelData;
      } catch (err) {
        throw createError({
          statusCode: err.statusCode || 500,
          message: err.message || 'Failed to load Simian data'
        });
      }
    },
    {
      // Additional client-side caching configuration
      server: true, // Fetch on server when possible
      lazy: false,  // Load immediately
      // Only refresh on significant changes (like new deployment or 1 hour passed)
      watch: false, // Don't refresh when reactive dependencies change
      // Cache for a day (in milliseconds) since Simian data rarely changes
      // This avoids extra API calls during the same browsing session
      ttl: 24 * 60 * 60 * 1000
    }
  );
  
  const mediaItems = computed(() => {
    if (!data.value?.root?.media) return [];
    return Array.isArray(data.value.root.media) 
      ? data.value.root.media 
      : [data.value.root.media];
  });
  
  // Define event handler references at component level
  let handleGlobalMouseOver;
  let handleGlobalMouseOut;
  
  // Register cleanup before any async operations
  onBeforeUnmount(() => {
    if (process.client && handleGlobalMouseOver && handleGlobalMouseOut) {
      document.removeEventListener('mouseover', handleGlobalMouseOver);
      document.removeEventListener('mouseout', handleGlobalMouseOut);
    }
  });
  
  // Set up global event listeners for hover detection
  onMounted(() => {
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
    }
  });
  </script>
  
  <style scoped lang="scss">
  .reels-container {
    width: 100%;
    position: relative;
    z-index: 30;
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    background: var(--color-black);
    gap: 0; /* No gap, we're using margins on children */
    box-sizing: border-box;
    justify-content: space-between; /* Distribute items with space between */
    transition: background-color 0.4s var(--easing-motion);
    border-top: 5px solid var(--color-black);
    z-index: 30;
    
    &.reel-hovered {
      // background: red;
    }

    .reel {
      position: relative;
      width: calc(50% - 2.5px); /* Adjust width to account for the horizontal gap */
      /* Use aspect ratio instead of fixed heights */
      height: 0;
      padding-bottom: 28.125%; /* 16:9 aspect ratio (9/16 = 0.5625 * 50% = 28.125%) */
      overflow: hidden;
      box-sizing: border-box;
      transition: all 0.4s var(--easing-motion);
      margin-bottom: 5px; /* Exactly 5px vertical spacing between reels */
      
      &:nth-child(odd) {
        margin-right: 2.5px; /* Horizontal spacing between odd and even */
      }

      &:nth-child(even) {
        margin-left: 2.5px; /* Horizontal spacing between odd and even */
      }
    }

    .loading-text {
      padding: 2rem;
      text-align: center;
      color: var(--color-white);
      font-size: 1.2rem;
    }
    
    @include gt-cinema {
      /* No need to specify height for reels as the aspect ratio handles it */
    }
    
    @include lt-phone {
      flex-direction: column;
      
      .reel {
        width: 100%; /* Full width on mobile */
        padding-bottom: 56.25%; /* 16:9 aspect ratio (9/16 = 0.5625 = 56.25%) */
        margin-bottom: 5px; /* Keep consistent 5px vertical spacing */
        
        /* Reset the horizontal margins since we're in a column */
        &:nth-child(odd), &:nth-child(even) {
          margin-left: 0;
          margin-right: 0;
        }
      }
    }
  }
  
  
  </style>