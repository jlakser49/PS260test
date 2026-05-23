<!-- pages/editors/index.vue -->
<template>
  <div v-if="pending" class="loading-text">
    Loading editors...
  </div>
  <div v-else-if="story" class="page page-editors" :class="{ 'is-wider': manuallyExpanded || (isWider && hasAccentImage) }" 
    :style="smallestWidth > 375 ? { '--initial-width': `${smallestWidth}px` } : {}"
  >
    <!-- If we have a background video (backgroundAsset), show that; otherwise use the image -->
    <video 
      v-if="editorsBgAsset" 
      class="bg"
      autoplay
      loop
      muted
      playsinline
    >
      <source :src="editorsBgAsset" type="video/mp4">
    </video>
    <nuxt-img 
      v-else-if="editorsBgImage"
      class="bg"
      :src="editorsBgImage"
    />
    
    <!-- Toggle button for expanding accent image (only visible on desktop) -->
    <div 
      v-if="hasAccentImage && !manuallyExpanded && windowWidth >= 960" 
      class="expand-trigger"
      @click="toggleIsWider"
      title="Click to expand"
    >
    </div>
    
    <StoryblokComponent 
      :key="story.content._uid"
      :blok="story.content"
      class="content" 
    />
  </div>
</template>

<script setup>
const version = useState('version', () => 'published')
const storyblokApi = useStoryblokApi()
const windowWidth = useState('windowWidth', () => 0)
const initialWidth = useState('initialWidth', () => 0)
const smallestWidth = useState('smallestWidth', () => 0)
const hasExpanded = useState('hasExpanded', () => false)
// Create a global isWider state that can be accessed from anywhere
const globalIsWider = useState('isWider', () => false)
// Direct state for manual toggling via click
const manuallyExpanded = ref(false)

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
  else if (windowWidth.value >= smallestWidth.value + expansionThreshold && windowWidth.value > 960) {
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
    console.log(`EDITORS: isWider changed from ${currentState} to ${newState} (width: ${windowWidth.value}px)`);
    
    // Also set a data attribute on body for direct DOM access
    document.body.setAttribute('data-is-wider', String(newState));
    
    // If changing from true to false, trigger media change (backup method)
    if (currentState === true && newState === false && hasAccentImage.value) {
      console.log('EDITORS: TRUE → FALSE transition - triggering media change');
      window.changeAccentMedia?.();
    }
  }
  
  return newState;
})

// const logPageEvent = (message, data = {}) => {
//   console.log(`[Editors Page] ${message}`, {
//     timestamp: performance.now(),
//     ...data
//   })
// }

// Fetch story data using useAsyncData
const { data: story, pending, error, refresh } = await useAsyncData(
  'editors-page',
  async () => {
    try {
      // logPageEvent('Fetching editors data')
      
      const { data } = await storyblokApi.get('cdn/stories/editors', {
        version: version.value,
      })

      // logPageEvent('Editors data fetched', { 
      //   storyId: data.story?.id,
      //   version: version.value 
      // })

      return data.story
    } catch (err) {
      console.error('Error fetching editors:', err)
      throw new Error('Failed to load editors content')
    }
  },
  {
    cache: {
      maxAge: 60000, // Cache duration in ms
      staleWhileRevalidate: true // Use stale data while fetching fresh
    },
    server: true,
    immediate: true,
    watch: [version], // Refresh when version changes
    transform: (data) => data || null,
    default: () => null
  }
)

// Fetch global elements data
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

// Extract the editor's background asset (video) URL from global elements
const editorsBgAsset = computed(() => {
  const bgComponent = globalElements.value?.content?.body?.find(
    item => item.component === 'EditorsBgImage'
  )
  return bgComponent?.backgroundAsset || ""
})

// Extract the editor's background image URL from global elements (fallback if no video)
const editorsBgImage = computed(() => {
  const bgComponent = globalElements.value?.content?.body?.find(
    item => item.component === 'EditorsBgImage'
  )
  return bgComponent?.backgroundImage?.filename || ""
})

// Check if the page has an AccentImage component
const hasAccentImage = computed(() => {
  if (!story.value?.content?.body) return false
  
  // Check if any component in the body is an AccentImage
  return story.value.content.body.some(item => item.component === 'AccentImage')
})

// Define the resize handler outside of onMounted so it's accessible in onUnmounted
const handleResize = () => {
  // Always track window width
  windowWidth.value = window.innerWidth
  
  if (window.innerWidth > 960) {
    // Update smallest width if current width is smaller
    if (windowWidth.value < smallestWidth.value) {
      smallestWidth.value = windowWidth.value
    }
  }
  
  // Always unset expansion if window is less than 960px
  if (window.innerWidth < 960) {
    if (manuallyExpanded.value) {
      console.log(`EDITORS: Window is less than 960px, disabling accent image`);
      manuallyExpanded.value = false;
      globalIsWider.value = false;
      hasExpanded.value = false;
      document.body.setAttribute('data-is-wider', 'false');
      
      // Trigger media change when collapsing
      window.changeAccentMedia?.();
    }
  }
  // If window gets smaller than the initial width but still above 960px, unset manual expansion
  else if (manuallyExpanded.value && window.innerWidth < initialWidth.value) {
    console.log(`EDITORS: Window got smaller than initial width (${initialWidth.value}px), resetting manual expansion`);
    manuallyExpanded.value = false;
    globalIsWider.value = false;
    hasExpanded.value = false;
    document.body.setAttribute('data-is-wider', 'false');
    
    // Trigger media change when collapsing
    window.changeAccentMedia?.();
  }
}

// Check if we're in the Storyblok editor
onMounted(() => {
  // logPageEvent('Page mounted')

  if (window.location.search.includes('_storyblok')) {
    version.value = 'draft'
  }
  
  // Set initial width only if window is wide enough
  windowWidth.value = window.innerWidth
  if (window.innerWidth > 960) {
    initialWidth.value = window.innerWidth
    smallestWidth.value = window.innerWidth
  }
  
  console.log(`EDITORS: Initial page width set to ${initialWidth.value}px`)
  
  // Call immediately to set initial state
  handleResize();
  
  // Add event listener
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Remove the resize handler
  window.removeEventListener('resize', handleResize)
})

// Function to toggle the isWider state manually
function toggleIsWider() {
  if (hasAccentImage.value) {
    // Only allow toggle on screens that are wide enough
    if (window.innerWidth < 960 && !manuallyExpanded.value) {
      console.log('EDITORS: Screen too small to expand');
      return;
    }
    
    // Simply toggle the manuallyExpanded state
    manuallyExpanded.value = !manuallyExpanded.value;
    
    // Also update global state for consistency
    globalIsWider.value = manuallyExpanded.value;
    hasExpanded.value = manuallyExpanded.value;
    
    console.log(`EDITORS: Manual toggle - isWider set to ${manuallyExpanded.value}`);
    document.body.setAttribute('data-is-wider', String(manuallyExpanded.value));
    
    // If toggling from true to false, trigger media change
    if (!manuallyExpanded.value) {
      console.log('EDITORS: Manual TRUE → FALSE transition - triggering media change');
      window.changeAccentMedia?.();
    }
  }
}

// Watch for version changes to handle preview mode
watch(version, async (newVersion) => {
  // logPageEvent('Version changed', { newVersion })
  await refresh()
})

useHead(() => {
  // For first-level slugs (category pages)
  return {
    title: story.value?.name || '',
    meta: [
      {
        name: 'description',
        content: story.value?.content?.header || ''
      }
    ]
  };
});
</script>

<style lang="scss" scoped>
.page-editors {
  min-height: var(--window-height);
  overflow: hidden;
  width: 100%;
  position: relative;

  .content {
    position: relative;
    z-index: 15;
    width: fit-content;
    margin: 0 auto;
    transition: all 0.4s var(--easing-motion);
    padding-bottom: 150px
  }
  
  .expand-trigger {
    position: fixed;
    top: var(--unit-header-height);
    left: 0;
    width: 50vw;
    height: var(--window-height);
    background-color: transparent;
    z-index: 10;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      // background-color: rgba(255, 255, 255, 0.05);
    }
  }
  
  .bg {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100vh;
    object-fit: cover;
    transform: translate(-50%, -50%);
    z-index: 0;
    object-position: center;
  }
  
  /* Apply the same styles to video element */
  video.bg {
    object-fit: cover;
  }

  .has-scrolled & {
    :deep(.accent-image) {
    .video-element,
    .image-element {
      padding-top: 0;
    }
  }
  }
  
  :deep(.accent-image) {
    left: var(--initial-width);
    z-index: 5;
    // transition: padding-top 0.3s ease;

  }
  
  &.is-wider {
    .content {
      width: 50vw;
      padding-left: 5vw;
      padding-right: 5vw;
      box-sizing: border-box;
      margin: 0;
    }
   
    :deep(.accent-image:not(.expand-view)) {
      width: calc(var(--initial-width));
      z-index: 10;
      left: 50%;
    }
    
    // Apply specific styles to editor-specific elements when wider
    :deep(.category) {
      max-width: 100%;
    }
  }
  
  .editor-card {
    h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  }
  
  .reels-grid {
    display: grid;
    gap: 2rem;
    margin: 2rem 0;
  }
  
  .reel-item {
    background: #f8f8f8;
    border-radius: 8px;
    overflow: hidden;
  
    .reel-video {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: cover;
    }
  
    .reel-info {
      padding: 1rem;
  
      h3 {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
      }
    }
  
    .credits {
      margin: 1rem 0;
      font-size: 0.9rem;
  
      .credit-item {
        margin-bottom: 0.25rem;
      }
    }
  
    .meta-info {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #666;
      margin-top: 0.5rem;
    }
  }
  
  .view-more {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: var(--color-black);
    color: var(--color-white);
    text-decoration: none;
    border-radius: 4px;
    margin-top: 1rem;
    
    &:hover {
      background: #333;
    }
  }
  
  @media (min-width: 768px) {
    .reels-grid {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  }

  @include lt-tablet {
    // Hide click triggers on smaller screens
    .expand-trigger {
      display: none;
    }
  }

  @include lt-small-phone {
    :deep(.accent-image) {
      display: none;
    }
    
    &.is-wider {
      :deep(.content) {
        width: 100%;
      }
    }
    
    // Hide click triggers on smaller screens
    .expand-trigger {
      display: none;
    }
  }
}

</style>
