<template>
  <div class="page page-home" v-if="story?.content" :class="{ 'is-wider': isWider && hasAccentImage, 'no-accent': !hasAccentImage }"
  :style="smallestWidth > 375 ? { '--initial-width': `${smallestWidth}px` } : {}"
  >
    <StoryblokComponent 
      :key="story?.content?._uid"
      :blok="story.content"
      class="content" 
    />
  </div>
  <div v-else>
    Loading...
  </div>
</template>

<script setup>
const storyblokApi = useStoryblokApi()
const version = useState('version', () => 'published')
const windowWidth = useState('windowWidth', () => 0)
const initialWidth = useState('initialWidth', () => 0)
const smallestWidth = useState('smallestWidth', () => 0)
const hasExpanded = useState('hasExpanded', () => false)
// Create a global isWider state that can be accessed from anywhere
const globalIsWider = useState('isWider', () => false)

// Updated isWider logic:
// 1. Now uses a much smaller threshold (20px) for easier activation
// 2. Stay active until window gets smaller than initial width
// 3. Updates the global isWider state for components to access
const isWider = computed(() => {
  // If no accent image, always return false
  if (!hasAccentImage.value) {
    return false;
  }
  
  // Get current state before any changes
  const currentState = globalIsWider.value;
  let newState = false;
  
  // Set a smaller expansion threshold - just 20px to make it trigger more easily
  const expansionThreshold = 20;
  
  // If we've already expanded and window is still wider than initial width, stay expanded
  if (hasExpanded.value && windowWidth.value > initialWidth.value) {
    newState = true;
  }
  
  // If we've grown by the threshold amount from smallest width, trigger expansion
  else if (windowWidth.value >= smallestWidth.value + expansionThreshold && windowWidth.value > 375) {
    hasExpanded.value = true;
    newState = true;
  }
  
  // If window gets smaller than initial width, reset expanded state
  else if (windowWidth.value <= initialWidth.value) {
    hasExpanded.value = false;
    newState = false;
  }
  
  // If state has changed, update global state and log
  if (newState !== currentState) {
    globalIsWider.value = newState;
    console.log(`INDEX: isWider changed from ${currentState} to ${newState} (width: ${windowWidth.value}px)`);
    
    // Also set a data attribute on body for direct DOM access
    document.body.setAttribute('data-is-wider', String(newState));
    
    // If changing from true to false, trigger media change (backup method)
    if (currentState === true && newState === false && hasAccentImage.value) {
      console.log('INDEX: TRUE → FALSE transition - triggering media change');
      window.changeAccentMedia?.();
    }
  }
  
  return newState;
})

const story = await useAsyncStoryblok('home', { 
  version: version.value
})

// Check if the page has an AccentImage component
const hasAccentImage = computed(() => {
  if (!story.value?.content?.body) return false
  
  // Check if any component in the body is an AccentImage
  return story.value.content.body.some(item => item.component === 'AccentImage')
})

// Check if we're in the Storyblok editor
onMounted(() => {
  if (window.location.search.includes('_storyblok')) {
    version.value = 'draft'
  }
  
  // Set initial width
  if (window.innerWidth > 375) {
    initialWidth.value = window.innerWidth
    windowWidth.value = window.innerWidth
    smallestWidth.value = window.innerWidth
  }
  
  // Add resize listener
  window.addEventListener('resize', () => {
    if (window.innerWidth > 375) {
      windowWidth.value = window.innerWidth
      
      // Update smallest width if current width is smaller
      if (windowWidth.value < smallestWidth.value) {
        smallestWidth.value = windowWidth.value
      }
    } 
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    windowWidth.value = window.innerWidth
  })
})

// Update the useHead hook to use the globalElements data
const { data: globalElements } = await useAsyncData(
  'global-elements',
  async () => {
    try {
      const { data } = await storyblokApi.get('cdn/stories/global/global-elements', {
        version: version.value,
      })
      return data.story
    } catch (err) {
      console.error('Error fetching global elements:', err)
      return null
    }
  }
)

// Get the website image URL from the global elements
const websiteImageUrl = computed(() => {
  const websiteImageComponent = globalElements.value?.content?.body?.find(
    item => item.component === 'websiteImage'
  )
  return websiteImageComponent?.Image?.filename || ''
})

const metaDescription = computed(() => {
  return story.value?.content?.header || 'PS 260';
});

// Update the useHead hook to include og:image
useHead(() => {
  return {
    meta: [
      {
        name: 'description',
        content: metaDescription.value
      },
      // Open Graph / Social Media Meta Tags
      {
        property: 'og:title',
        content: 'PS 260'
      },
      {
        property: 'og:description',
        content: metaDescription.value
      },
      {
        property: 'og:image',
        content: websiteImageUrl.value
      },
      {
        property: 'og:type',
        content: 'website'
      },
      // Twitter Card Meta Tags (also uses og:image)
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        name: 'twitter:title',
        content: 'PS 260'
      },
      {
        name: 'twitter:description',
        content: metaDescription.value
      }
    ]
  };
})
</script>

<style scoped lang="scss">
.page-home {
  overflow: hidden;
  width: 100%;
  position: relative;
 
  .content {
    height: var(--window-height);
  }

  :deep(.accent-image) {
    left: var(--initial-width);
  }
  
  // When no accent image is present
  // &.no-accent {
  //   :deep(.quote-animator) {
  //     width: 100%;
  //     max-width: 1200px;
  //     margin: 0 auto;
  //   }
    
  //   :deep(.section-video) {
  //     width: 100%;
  //     max-width: 1200px;
  //     margin: 0 auto;
  //   }
  // }

  &.is-wider {
    .content {
      width: 100%;
    }
   
    :deep(.accent-image:not(.expand-view)) {
        width: calc(var(--initial-width));
        z-index: 10;
        left: 50%;
    }

    :deep(.quote-animator) {
      width: 50%;
    }
    
    :deep(.section-video) {
      width: 50%;
    }
  }

  
  @include gt-cinema {
    &.is-wider {
      :deep(.accent-image:not(.expand-view)) {
        // width: calc(var(--initial-width) * 1.25);
      }
    }
  }

  @include lt-tablet {
    :deep(.accent-image) {
      // max-width: 100%;
    }
  }

  @include lt-phone {
    :deep(.section-video) {
      max-width: 100%;
      // height: 234px;
    }
  }

  @include phone-landscape {
    .content {
      height: 100svh;
    }
  }


  @include lt-small-phone {
    &.is-wider {
    // :deep(.accent-image:not(.expand-view)) {
    //     width: calc(var(--initial-width));
    //     z-index: 10;
    //     left: 50%;
    // }

    :deep(.quote-animator) {
      width: 100%;
    }
    
    :deep(.section-video) {
      width: 100%;
    }
  }  }
}
</style>