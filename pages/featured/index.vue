<template>
    <div class="page reel-page">
      <div v-if="error" class="error-text">
        {{ error }}
      </div>
      <div v-else-if="pending" class="loading-text">
        Loading featured content...
      </div>
    </div>
  </template>

  <script setup>
  const storyblokApi = useStoryblokApi();
// Getting the first child in the featured reels and redirecting to the first object.
  const { data, error: asyncError, pending } = await useAsyncData(
    'featured-content',
    async () => {
      try {
        // Fetch Storyblok data
        const { data: storyblokData } = await storyblokApi.get('cdn/stories/featured', {
          version: 'published'
        });

        const simianReelId = storyblokData?.story?.content?.body?.[0]?.simianReelId;
        
        if (!simianReelId) {
          throw new Error('Featured content not found');
        }

        // Fetch Simian data
        const simianResponse = await $fetch('/api/simian', {
          method: 'POST',
          body: {
            reelId: simianReelId
          }
        });

        if (!simianResponse?.root?.media) {
          throw new Error('No media found in featured content');
        }

        const mediaItems = Array.isArray(simianResponse.root.media) 
          ? simianResponse.root.media 
          : [simianResponse.root.media];

        if (mediaItems.length === 0) {
          throw new Error('No media items found');
        }

        return mediaItems[0];
      } catch (err) {
        console.error('Error:', err);
        throw new Error('Error loading featured content');
      }
    },
    {
      immediate: true,
      watch: [], // No dependencies to watch
      transform: (mediaItem) => ({
        slug: mediaItem.title
          ? mediaItem.title
              .toLowerCase()                  // Convert to lowercase
              .replace(/['"""'']/g, '')       // Remove quotes
              .replace(/&/g, '-and-')         // Replace & with 'and'
              .replace(/[^\w\s-]/g, '')       // Remove special chars except alphanumeric, spaces, hyphens
              .trim()                         // Trim whitespace
              .replace(/\s+/g, '-')           // Replace spaces with hyphens
              .replace(/-+/g, '-')            // Remove consecutive hyphens
              .replace(/^-+|-+$/g, '')        // Remove leading/trailing hyphens
          : '',
        mediaItem
      })
    }
  );

  // Watch for data changes to handle navigation
  watch(data, (newData) => {
    if (newData?.slug) {
      navigateTo(`/featured/${newData.slug}`);
    }
  }, { immediate: true });

  // Computed error message
  const error = computed(() => {
    return asyncError.value?.message || null;
  });
  </script>

  <style scoped>
  .loading-text, .error-text {
    text-align: center;
    font-size: 20px;
    color: var(--color-white);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .error-text {
    color: #ff4444;
  }
  </style>