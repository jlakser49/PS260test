<template>
  <div class="page page-featured">
    <!-- <pre v-if="debug">{{ debugState }}</pre> -->

    <template v-if="isDataReady">
      <ReelMedia
        :mediaItems="mediaItems"
        :cameFromHome="true"
        :backLink="categoryInfo?.link || '/'"
        :headerTitle="categoryInfo?.name || ''" 
        :slugParam="route.params.slug"
        :currentMedia="currentMediaObject || {}"
        :error="error"
      />
    </template>
    <div v-else class="loading-text">
      Loading...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStoryblokApi } from '@storyblok/vue';

const route = useRoute();
const error = ref(null);
const mediaItems = ref([]);
const categoryInfo = ref(null);
const debug = ref(true);
const loading = ref(true);

const story = await useStoryblok('featured', { 
  version: 'published' 
})

// Computed properties
const currentMediaObject = computed(() => {
  if (!mediaItems.value?.length || !route.params.slug) return {};
  
  return mediaItems.value.find(media => 
    formatSlug(media.title) === route.params.slug
  ) || {};
});

const isDataReady = computed(() => {
  return !loading.value && 
         mediaItems.value?.length > 0 && 
         !!route.params.slug &&
         !!categoryInfo.value &&
         !!currentMediaObject.value;
});

const debugState = computed(() => ({
  loading: loading.value,
  mediaItemsCount: mediaItems.value?.length || 0,
  currentSlug: route.params.slug,
  hasCurrentMedia: !!currentMediaObject.value,
  categoryInfo: categoryInfo.value,
  isReady: isDataReady.value
}));

// Helper functions
const formatSlug = (title) => {
  if (!title) return '';
  return String(title)
    .toLowerCase()
    .replace(/[""]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .trim();
};

// Data fetching
const fetchData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const storyblokApi = useStoryblokApi();
    const { data } = await storyblokApi.get('cdn/stories/featured', {
      version: 'published'
    });

    
    
    if (!data?.story?.content?.body?.[0]?.simianReelId) {
      throw new Error('No reel ID found');
    }
    
    const simianData = await $fetch('/api/simian', {
      method: 'POST',
      body: {
        reelId: data.story.content.body[0].simianReelId
      }
    });

    console.log("simianData", simianData);


    if (!simianData?.root?.media) {
      throw new Error('Invalid media data');
    }

    mediaItems.value = Array.isArray(simianData.root.media)
      ? simianData.root.media
      : [simianData.root.media];

    await updateCategoryInfo();
  } catch (err) {
    error.value = { message: err.message || 'Failed to fetch content' };
    console.error('Error:', err);
  } finally {
    loading.value = false;
  }
};

const updateCategoryInfo = async () => {
  if (!route.params.slug || !mediaItems.value?.length) return;

  const media = mediaItems.value.find(m => 
    formatSlug(m.title) === route.params.slug
  );

  categoryInfo.value = {
    name: media?.category || 'Featured',
    link: `/editors/${formatSlug(media?.category || 'featured')}`
  };
};

// Watchers
watch(() => route.params.slug, async (newSlug) => {
  if (newSlug && mediaItems.value?.length) {
    await updateCategoryInfo();
  }
}, { immediate: true });

// Lifecycle
onMounted(() => {
  fetchData();
});

watchEffect(() => {
  const videoData = currentMediaObject.value

  useHead({
    meta: [
      {
        name: 'description',
        content: videoData?.credits?.editor 
          ? `Edited by ${videoData.credits.editor}` 
          : 'Featured editor reels and projects'
      },
      {
        property: 'og:title',
        content: videoData?.title || 'Featured Reels | PS 260'
      },
      {
        property: 'og:description',
        content: videoData?.credits?.editor 
          ? `Edited by ${videoData.credits.editor}` 
          : 'Featured editor reels and projects'
      },
      {
        property: 'og:image',
        // Use the full URL directly from the thumbnail property
        content: videoData?.thumbnail || ''
      },
      {
        property: 'og:image:width',
        content: videoData?.media_width || '1024'
      },
      {
        property: 'og:image:height',
        content: videoData?.media_height || '576'
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        name: 'twitter:image',
        content: videoData?.thumbnail || ''
      }
    ].filter(meta => meta.content)
  })
})
</script>

<style scoped lang="scss">
.loading-text {
  text-align: center;
  font-size: 20px;
  color: var(--color-white);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>