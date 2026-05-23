<!-- pages/editors/[name]/[reel].vue -->
<template>
  <div class="page reel-page">
    <pre v-if="debug">{{ debugState }}</pre>

    <ReelMedia
      v-if="isReady"
      :mediaItems="mediaItems"
      :backLink="`/editors/${route.params.name}`"
      :headerTitle="editorName"
      :backText="'Editors'"
      :slugParam="route.params.reel"
      :currentMedia="currentMedia"
      :error="error"
      :closeLink="`/editors/${route.params.name}`"
    />

    <div v-else class="loading-text">
      Loading...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStoryblokApi } from '@storyblok/vue';

const route = useRoute();
const debug = ref(false);

// Computed properties
const editorName = computed(() => {
  return formatName(route.params.name);
});

const currentMedia = computed(() => {
  if (loading.value || !mediaItems.value?.length || !route.params.reel) 
    return { title: `${editorName.value}'s Work` };
  
  return mediaItems.value.find(media => 
    formatSlug(media.title) === route.params.reel
  ) || { title: `${editorName.value}'s Work` };
});

const isReady = computed(() => {
  return !loading.value && 
         mediaItems.value.length > 0 && 
         editorData.value &&
         !!currentMedia.value;
});

const debugState = computed(() => ({
  mediaItemsLength: mediaItems.value.length,
  editorName: editorName.value,
  loading: loading.value,
  currentMedia: currentMedia.value?.title,
  hasError: !!error.value,
  params: route.params
}));

// Helper functions
const formatName = (name) => {
  if (!name) return '';
  return name
    .replace(/-/g, ' ') // Replace dashes with spaces
    .split(' ') // Split by space
    .map((word, index) => {
      if (index === 0) { // Only apply the two caps to the first word
        // Check if the first word has exactly 2 letters and both are lowercase
        if (word.length === 2 && word.charAt(0).toLowerCase() === word.charAt(0) && word.charAt(1).toLowerCase() === word.charAt(1)) {
          return word.toUpperCase(); // Capitalize both letters
        }
      }
      // Capitalize the first character and retain the rest of the word as is
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalize the first letter only
    })
    .join(' '); // Join the words with a space
};

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

// Server-side data fetching with useAsyncData
const { data: fetchedData, pending, error: fetchError } = useAsyncData(
  `editor-${route.params.name}-${route.params.reel}`,
  async () => {
    try {
      // Get editor data from Storyblok
      const storyblokApi = useStoryblokApi();
      const { data: editorsData } = await storyblokApi.get('cdn/stories/editors', {
        version: 'published'
      });

      // Find matching person
      let matchingPerson = null;
      for (const category of editorsData.story.content.body) {
        const person = category.Person.find(p => 
          p.Name.toLowerCase().replace(/\s+/g, '-') === route.params.name
        );
        if (person) {
          matchingPerson = person;
          break;
        }
      }

      if (!matchingPerson) {
        throw new Error('Editor not found');
      }

      if (!matchingPerson.SimianReelID) {
        throw new Error('No reel ID found');
      }

      // Get media data from Simian
      const simianData = await $fetch('/api/simian', {
        method: 'POST',
        body: { reelId: matchingPerson.SimianReelID }
      });

      if (!simianData?.root?.media) {
        throw new Error('Invalid media data');
      }

      const mediaItems = Array.isArray(simianData.root.media)
        ? simianData.root.media
        : [simianData.root.media];

      return {
        editorData: matchingPerson,
        mediaItems
      };
    } catch (err) {
      throw new Error(err.message || 'Failed to fetch content');
    }
  }
);

// Update refs to use the fetched data
const editorData = computed(() => fetchedData.value?.editorData || null);
const mediaItems = computed(() => fetchedData.value?.mediaItems || []);
const loading = computed(() => pending.value);
const error = computed(() => fetchError.value ? { message: fetchError.value.message } : null);

// Refresh data when route changes
watch(
  () => route.params?.name,
  (newName, oldName) => {
    if (newName && oldName && newName !== oldName) {
      refreshNuxtData(`editor-${route.params.name}-${route.params.reel}`);
    }
  }
);

// Helper function to decode HTML entities
const decodeHtmlEntities = (text) => {
  if (!text) return '';
  
  // Create a temporary textarea element to use the browser's built-in HTML entity decoding
  if (process.client) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  
  // Server-side fallback for common HTML entities
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/"/g, '"')      // Smart quotes
    .replace(/"/g, '"')      // Smart quotes
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');
};

// // Add these computed properties
// const pageTitle = computed(() => {
//   // currentMedia.value.title should always be defined now due to our changes
//   // Clean up any HTML entities in the title
//   const cleanTitle = decodeHtmlEntities(currentMedia.value.title);
//   const cleanEditorName = decodeHtmlEntities(editorName.value);
  
//   return `${cleanTitle} by ${cleanEditorName}`;
// });

// const pageDescription = computed(() => {
//   // Clean up any HTML entities in the description
//   const description = currentMedia.value?.description || 
//     `Watch ${editorName.value}'s reels at PS 260`;
  
//   return decodeHtmlEntities(description);
// });

const normalizedUrl = computed(() => {
  // Check if route.params exists and has name property
  if (!route.params || !route.params.name) {
    return '';
  }
  
  try {
    const name = route.params.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9-]/g, '-'); // Replace non-alphanumeric with hyphens
    
    return name;
  } catch (error) {
    console.error('Error normalizing URL:', error);
    return route.params.name || '';
  }
});

// Add useHead configuration
useHead(() => {
  // Default canonical URL
  let canonicalUrl = 'https://www.ps260.com/editors';
  
  // Add params only if they exist
  if (normalizedUrl.value) {
    canonicalUrl += `/${normalizedUrl.value}`;
    
    if (route.params && route.params.reel) {
      canonicalUrl += `/${route.params.reel}`;
    }
  }
  
  // Get the raw title from the media item
  let rawTitle = '';
  let cleanMediaTitle = '';
  
  if (currentMedia.value?.title) {
    // Replace quotes directly to avoid encoding
    cleanMediaTitle = currentMedia.value.title.replace(/"/g, '').replace(/&quot;/g, '');
    rawTitle = cleanMediaTitle;
  } else {
    cleanMediaTitle = editorName.value + "'s Work";
    rawTitle = cleanMediaTitle + ' | PS 260 Editors';
  }
  
  const description = `Watch ${cleanMediaTitle} by ${editorName.value}`;
  
  return {
    // Use a function for the title to bypass Nuxt's automatic encoding
    titleTemplate: () => rawTitle,
    meta: [
      {
        name: 'description',
        content: description
      },
      // Open Graph
      {
        property: 'og:title',
        content: rawTitle
      },
      {
        property: 'og:description',
        content: description
      },
      // Twitter Card
      {
        name: 'twitter:card',
        content: 'player'
      },
      {
        name: 'twitter:title',
        content: rawTitle
      },
      {
        name: 'twitter:description',
        content: description
      }
    ],
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl
      }
    ]
  };
});
</script>

<style lang="scss" scoped>
.loading-text {
  text-align: center;
  font-size: 20px;
  color: var(--color-white);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.reel-page {
  width: 100%;
  height: 100%;
}

pre {
  position: fixed;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  font-size: 12px;
  z-index: 9999;
}
</style>
