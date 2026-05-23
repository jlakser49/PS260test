<!-- pages/contact.vue -->
<template>
  <div class="page page-contact" v-if="story" :class="{ 'is-wider': isWider && hasAccentImage, 'no-accent': !hasAccentImage }"
    :style="smallestWidth > 375 ? { '--initial-width': `${smallestWidth}px` } : {}"
  >
    <div class="contact-with-accent">
    
      <div class="contact-meta">
        <Contact :story="contactStory" />
      </div>

      <AccentImage v-if="accentData" :blok="accentData" :is-wider="isWider && hasAccentImage" />

    </div>
  </div>

  <div v-else>
    Loading...
  </div>
</template>

<script setup>
const version = useState('version', () => 'published')
const windowWidth = useState('windowWidth', () => 0)
const initialWidth = useState('initialWidth', () => 0)
const smallestWidth = useState('smallestWidth', () => 0)
const hasExpanded = useState('hasExpanded', () => false)
const globalIsWider = useState('isWider', () => false)

// Similar isWider logic as in index.vue but with extra condition for small screens
const isWider = computed(() => {
  // If no accent image, always return false
  if (!hasAccentImage.value) {
    return false;
  }
  
  // Get current state before any changes
  const currentState = globalIsWider.value;
  let newState = false;
  
  // Always return false if width is less than 960px
  if (windowWidth.value < 960) {
    // Force is-wider to be false on screens less than 960px
    hasExpanded.value = false;
    newState = false;
  }
  else {
    // Set a smaller expansion threshold - just 20px to make it trigger more easily
    const expansionThreshold = 20;
    
    // If we've already expanded and window is still wider than initial width, stay expanded
    if (hasExpanded.value && windowWidth.value > initialWidth.value) {
      newState = true;
    }
    
    // If we've grown by the threshold amount from smallest width, trigger expansion
    // Make sure we're also above 960px before expanding
    else if (windowWidth.value >= smallestWidth.value + expansionThreshold && windowWidth.value > 960) {
      hasExpanded.value = true;
      newState = true;
    }
    
    // If window gets smaller than initial width, reset expanded state
    else if (windowWidth.value <= initialWidth.value) {
      hasExpanded.value = false;
      newState = false;
    }
  }
  
  // If state has changed, update global state and log
  if (newState !== currentState) {
    globalIsWider.value = newState;
    console.log(`CONTACT: isWider changed from ${currentState} to ${newState} (width: ${windowWidth.value}px)`);
    
    // Also set a data attribute on body for direct DOM access
    document.body.setAttribute('data-is-wider', String(newState));
    
    // If changing from true to false, trigger media change
    if (currentState === true && newState === false && hasAccentImage.value) {
      console.log('CONTACT: TRUE → FALSE transition - triggering media change');
      window.changeAccentMedia?.();
    }
  }
  
  return newState;
})

// Load data
const story = await useStoryblok('contact-new', { 
  version: version.value,
})

// Extract the AccentImage data
const accentData = computed(() => {
  if (!story.value || !story.value.content.body) return null
  
  const accentBlok = story.value.content.body.find(item => item.component === 'AccentImage')
  
  console.log('Contact Page - Accent Data:', {
    found: !!accentBlok,
    components: story.value.content.body.map(item => item.component)
  })
  
  return accentBlok
})

// Computed property to check if we have an accent image
const hasAccentImage = computed(() => {
  return !!accentData.value
})

// Create contact-only story version
const contactStory = computed(() => {
  if (!story.value) return null
  
  // Create a deep copy of the story
  const storyData = JSON.parse(JSON.stringify(story.value))
  
  // Filter out the AccentImage component
  if (storyData.content && storyData.content.body) {
    storyData.content.body = storyData.content.body.filter(
      item => item.component !== 'AccentImage'
    )
  }
  
  return storyData
})

// Initialize and clean up
onMounted(() => {
  if (window.location.search.includes('_storyblok')) {
    version.value = 'draft'
  }
  
  // Set initial width - only track for screens wider than 600px
  if (window.innerWidth > 600) {
    initialWidth.value = window.innerWidth
    windowWidth.value = window.innerWidth
    smallestWidth.value = window.innerWidth
  }
  
  // Add resize listener
  const handleResize = () => {
    // Always update window width regardless of size
    windowWidth.value = window.innerWidth
    
    // Only track smallest width for screens wider than 600px
    if (window.innerWidth > 600) {
      // Update smallest width if current width is smaller
      if (windowWidth.value < smallestWidth.value) {
        smallestWidth.value = windowWidth.value
      }
    }
  }
  
  window.addEventListener('resize', handleResize)
  
  // Clean up on unmount
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
})

useHead(() => {
  return {
    title: "Contact",
    meta: [
      {
        name: 'description',
        content: `Contact PS 260`
      }
    ]
  };
});
</script>

<style scoped lang="scss">
.page-contact {
  // min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  
  :deep(.accent-image) {
    left: var(--initial-width);
    z-index: 5;
  }
  
  // When no accent image is present, adjust the layout
  // &.no-accent {
  //   .contact-meta {
  //     max-width: 1200px;
  //     margin: 0 auto;
  //     padding: 0 5vw;
  //   }
    
  //   :deep(.contact-wrapper) {
  //     margin: 0 auto;
  //     padding-top: 100px;
  //   }
  // }
  
  &.is-wider {
    .contact-meta {
      max-width: 50vw;
      margin: 0;
    }
    :deep(.position){
      font-size: 10px;
    }
    :deep(.image-meta img) {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    // Grid adjustments are now handled in Contact.vue component
    :deep(.accent-image:not(.expand-view)) {
      width: calc(var(--initial-width));
      z-index: 10;
      left: 50%;
    }
    .contact-wrapper {
      box-sizing: border-box;
      padding: 0 20px;
    }
    // Locations section alignment
    :deep(.locations-section) {
      align-items: flex-end;
    }
  }

  @include gt-cinema {
      &.is-wider {
        :deep(.position){
          font-size: 12px;
        }
      }
    }
}

.contact-with-accent {
  display: flex;
  transition: all;
  
  .no-accent & {
    display: block; // Single column layout when no accent image
  }
  
  @include lt-tablet {
    flex-direction: column;
  }
  
  .accent-column {
    position: relative;
    width: 50vw;
    // height: 100vh;
    z-index: 5;
    
    :deep(.accent-image) {
      position: fixed;
      top: var(--unit-header-height);
      width: 50vw;
      height: calc(100vh - var(--unit-header-height));
      overflow: hidden;
      // transition: all 0.4s var(--easing-motion);
    }
    
    :deep(.video-element),
    :deep(.image-element) {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    @include lt-tablet {
      display: none;
    }
  }
  
  .contact-meta {
    padding-left: 0;
    padding-right: 0;
    margin-left: auto;
    margin-right: auto;
    max-width: 1000px;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 10;
    box-sizing: border-box;
    transition: all 0.4s;
    
    // .no-accent & {
    //   max-width: 1200px;
    //   width: 100%;
    //   margin: 0 auto;
    // }

    :deep(.contact-wrapper) {
      margin-top: 0;
      padding-top: 0;
      padding-bottom: 0;
      display: block;
      min-height: var(--window-height);
    }
    
    @include lt-tablet {
      padding-left: 12vw;
      padding-right: 12vw;
      margin-left: 0;
      width: 100%;
      max-width: none;

      :deep(.contact-wrapper) {
        display: flex;
      flex-direction: column;
      justify-content: flex-start;


    }
    
    }
    
    @include lt-phone {
      padding-left: 5vw;
      padding-right: 5vw;
    }
  }
  
  .is-wider & {
    .contact-meta {
      max-width: 50vw;
    }
    
  }
}
</style>