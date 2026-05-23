<template>
  <div class="page page-wrapper" v-if="story">
    <div v-if="isReelPage">
      <ReelMedia
        v-if="!pending && currentMedia"
        :mediaItems="mediaItems"
        :backLink="editorBackLink"
        :headerTitle="editorName"
        :backText="editorName"
        :slugParam="reelSlug"
        :currentMedia="currentMedia"
        :error="error"
        :closeLink="`/${parentPath}`" 
      />
    </div>
    <div v-else :class="[
      'dynamic-page-content',
      { 'reel-hovered': isAnyReelHovered },
      ...componentClasses
    ]">
      <StoryblokWrapper 
        :key="story.content._uid"
        :blok="story.content"
      />
    </div>
  </div>

  <div v-else>
    Loading...
  </div>
</template>

<script setup>
const route = useRoute();
const version = useState('version', () => 'published');
const isAnyReelHovered = ref(false);

// Compute if we're on a reel page (more than one segment in slug)
const isReelPage = computed(() => 
  Array.isArray(route.params.slug) && route.params.slug.length > 1
);

const editorName = computed(() => {
  if (currentMedia.value?.category) {
    return currentMedia.value.category;
  }
  return '';
});

const editorBackLink = computed(() => {
  if (editorName.value) {
    return `/editors/${editorName.value.toLowerCase().replace(/\s+/g, '-')}`;
  }
  return '/editors';
});

// Get parent path for reel pages
const parentPath = computed(() => {
  if (isReelPage.value) {
    return route.params.slug.slice(0, -1).join('/');
  }
  return route.params.slug?.[0] || '';
});

// Get the reel slug if we're on a reel page
const reelSlug = computed(() => 
  isReelPage.value ? route.params.slug[route.params.slug.length - 1] : null
);

onMounted(() => {
  if (window.location.search.includes('_storyblok')) {
    version.value = 'draft';
  }
  
  // Set up event listeners for reel hover detection
  if (process.client) {
    const handleGlobalMouseOver = (e) => {
      const reelElement = e.target.closest('.reel');
      if (reelElement) {
        isAnyReelHovered.value = true;
      }
    };
    
    const handleGlobalMouseOut = (e) => {
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
    
    // Clean up event listeners on component unmount
    onBeforeUnmount(() => {
      document.removeEventListener('mouseover', handleGlobalMouseOver);
      document.removeEventListener('mouseout', handleGlobalMouseOut);
    });
  }
});

// Fetch Storyblok content
const story = await useStoryblok(parentPath.value, { 
  version: version.value,
});

// If we're on a reel page, fetch the Simian data
const { data, error, pending } = await useAsyncData(
  `reel-${route.path}`,
  async () => {
    if (!isReelPage.value) return null;

    try {
      const simianComponent = story.value.content.body.find(
        item => item.component === 'SimianReel'
      );

      if (!simianComponent?.SimianReelID) return null;

      return await $fetch('/api/simian', {
        method: 'POST',
        body: { reelId: simianComponent.SimianReelID }
      });
    } catch (err) {
      console.error('Failed to fetch Simian data:', err);
      return null;
    }
  },
  {
    watch: [isReelPage]
  }
);

// console.log("data", data);

const mediaItems = computed(() => {
  if (!data.value?.root?.media) return [];
  return Array.isArray(data.value.root.media) 
    ? data.value.root.media 
    : [data.value.root.media];
});

const currentMedia = computed(() => {
  if (!mediaItems.value.length || !reelSlug.value) return null;
  return mediaItems.value.find(media => 
    formatSlug(media.title) === reelSlug.value
  );
});

// Format slug for the title
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

// Computed property to generate component-based classes
const componentClasses = computed(() => {
  if (!story.value?.content?.body) return [];
  
  // Map of component types to class names
  const classMap = {
    'banner': 'story-block-block has-banner-block',
    'SimianReel': 'story-block-block has-simian-reel-block',
    'qAndA': 'story-block-block has-qa-block',
    'bio': 'story-block-block has-bio-block',
    'htmlBlock': 'story-block-block has-html-block'
  };
  
  // Build array of classes based on which components are present
  const classes = [];
  const componentsPresent = new Set();
  
  // Track first component type for special styling
  if (story.value.content.body.length > 0) {
    const firstComponent = story.value.content.body[0].component;
    if (firstComponent && classMap[firstComponent]) {
      classes.push(`first-block-${firstComponent.toLowerCase()}`);
    }
  }
  
  // Add classes for all component types
  story.value.content.body.forEach(blok => {
    if (blok.component && classMap[blok.component]) {
      componentsPresent.add(blok.component);
    }
  });
  
  // Add classes for each component type found
  componentsPresent.forEach(componentType => {
    classes.push(classMap[componentType]);
  });
  
  // Add a general class with count of components
  // classes.push(`has-${componentsPresent.size}-storyblok-blocks`);
  
  console.log('Page component classes:', classes);
  return classes;
});

// Check if header and footer should be disabled
const isHeaderFooterDisabled = computed(() => {
  return !!story.value?.content?.disableHeaderFooter;
});

// Apply hide-header-footer class to body when needed
onMounted(() => {
  if (isHeaderFooterDisabled.value) {
    document.body.classList.add('hide-header-footer');
    console.log('Header and footer are disabled for this page');
  }
  
  watch(isHeaderFooterDisabled, (isDisabled) => {
    if (isDisabled) {
      document.body.classList.add('hide-header-footer');
    } else {
      document.body.classList.remove('hide-header-footer');
    }
  });
});

// Clean up class on page change
onBeforeUnmount(() => {
  document.body.classList.remove('hide-header-footer');
});

// Set the head data with video title and credits
useHead(() => {
  // For second-level slugs (media pages)
  if (currentMedia.value) {
    const videoTitle = currentMedia.value?.title.replace(/['"]/g, '') || '';
    const credits = currentMedia.value?.credits?.agency || '';
    
    return {
      title: videoTitle,
      meta: [
        {
          name: 'description',
          content: `${story.value?.name}`
        }
      ]
    };
  }
  
  // For first-level slugs (category pages)
  return {
    title: story.value?.name || '',
    meta: [
      {
        name: 'description',
        content: story.value?.content?.header || story.value?.name || ''
      }
    ]
  };
});
</script>

<style lang="scss" scoped>
.dynamic-page-content {
  // min-height: 100vh;
  transition: background-color 0.4s var(--easing-motion);
  
  /* Style for banner component */
  :deep(.banner-section) {
    height: calc(350px - 80px);
  }

  /* Styles for HTML block component */
  &.has-html-block {
    :deep(.html-container) {
      /* Add any specific styles for HTML containers here */
      iframe {
        border: 0;
      }
    }
  }

  @include gt-cinema {
    :deep(.banner-section) {
        height: calc(450px - var(--unit-header-height));
      }
    }
  
    @include lt-tablet {
      :deep(.banner-section) {
        height: calc(250px - var(--unit-header-height));
      }
    }
  
}
</style>

<style scoped lang="scss">

</style>