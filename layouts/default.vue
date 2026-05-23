<!-- layouts/default.vue -->
<template>
  <div 
    :class="['page-layout', `page-name-${routeClassName}`, 
    {'panel-is-open': isMenuOpen}, 
    {'is-slug': isSlugPage},
    {'has-scroll-100vh': hasScroll},
    {'has-scrolled': hasScrolled}
    ]"
    ref="layoutRoot">
    <NuxtLoadingIndicator :height="3" :color="false" :throttle="0" />

      <VideoTakeover
        :lottie-url="currentVideoUrl"
        :is-url-ready="isVideoUrlReady"
        @complete="handleTakeoverComplete"
      />
  
    <SpeedInsights />
    <LogoCycler />
    <GlobalHeaderFloating>
      <template #menu>
        <GlobalNav  />
      </template>
    </GlobalHeaderFloating>
    <GlobalHamburger class="global-hamburger" />
    <PanelMenu />
    <NuxtPage />
    <GlobalFooter keep-alive />
  </div>
</template>

<script setup>
const route = useRoute()
const storyblokApi = useStoryblokApi()

import { SpeedInsights } from '@vercel/speed-insights/vue'

const hasSeenTakeover = useState('has-seen-takeover', () => false)
const takeoverComplete = useState('takeover-complete', () => false)
const canAnimateQuote = useState('can-animate-quote', () => false)
const version = useState('version', () => 'published')
const isMenuOpen = useMenuState()
const hasScroll = ref(false)
const hasScrolled = ref(false)
const layoutRoot = ref(null)

const isSlugPage = computed(() => {
  // Check if the current route has a slug parameter and is at least two levels deep
  const hasDeepSlugParam = route.params.slug && Array.isArray(route.params.slug) && route.params.slug.length >= 2;

  // Check if the current route name matches a slug pattern
  const isSlugRoute = route.name && route.name.startsWith('slug-'); 

  // Special cases for "reel"
  const isReelRoute = route.name === 'editors-name-reel' || route.name === 'featured-slug'; // Add any other special reel cases here

  // Combine the conditions
  return hasDeepSlugParam || isSlugRoute || isReelRoute;
});

const routeClassName = computed(() => {
  if (route.name === 'featured-slug') {
    return 'featured'
  }
  
  return (route.params.slug?.toString().toLowerCase() ?? 
    route.name?.toString().toLowerCase() ?? 
    '')
    .replace(/,/g, '-') // Replace commas with hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
})

// const logState = (message) => {
//   console.log(`[Layout] ${message}`, {
//     path: route.path,
//     hasSeenTakeover: hasSeenTakeover.value,
//     canAnimateQuote: canAnimateQuote.value,
//     takeoverComplete: takeoverComplete.value
//   })
// }

// Fetch data
const { data: logo } = await useAsyncData(
  'global-logo',
  async () => {
    try {
      const storyblokApi = useStoryblokApi()
      const { data } = await storyblokApi.get('cdn/stories/global/logo', {
        version: version.value
      })
      return data.story
    } catch (err) {
      console.error('Error fetching logo:', err)
      return null
    }
  }
)

// Use the same state management as the rest of the app
const { story: currentPageData } = useStoryblokPage()

// Debug log for VideoAnimationOverride feature
// onMounted(() => {
//   if (process.client) {
//     setTimeout(() => {
//       console.log('VideoAnimationOverride status:', {
//         path: route.path,
//         params: route.params,
//         isOnDynamicPage: isOnDynamicPage.value,
//         parentPath: parentPath.value,
//         hasParentData: !!parentPageData.value,
//         isVideoUrlReady: isVideoUrlReady.value,
//         hasOverrideInCurrentPage: currentPageData.value?.content?.body?.some(
//           item => item.component === 'VideoAnimationOverride' && item.URL
//         ),
//         hasOverrideInParentPage: parentPageData.value?.content?.body?.some(
//           item => item.component === 'VideoAnimationOverride' && item.URL
//         ),
//         hasOverride: hasVideoOverride.value,
//         overrideUrl: videoOverrideUrl.value,
//         defaultUrl: logoMainUrl.value,
//         finalUrl: currentVideoUrl.value
//       })
//     }, 500) // Slight delay to ensure parent page data is loaded
//   }
// })

// Check if we need to load parent page data (for dynamic routes)
const isOnDynamicPage = computed(() => {
  // Check for multi-level slug parameters (like /WKTF-example/amd-case-study)
  if (route.params.slug && Array.isArray(route.params.slug) && route.params.slug.length > 1) {
    return true;
  }
  
  // Check for specific route patterns
  if (route.params.name && route.path.startsWith('/editors/')) {
    return true;
  }
  
  if (route.params.slug && route.path.startsWith('/featured/')) {
    return true;
  }
  
  return false;
});

// Store data for parent page when on dynamic pages
const parentPageData = ref(null);

// Determine the parent path for the current page
const parentPath = computed(() => {
  // For multi-level slug routes (like /WKTF-example/amd-case-study)
  if (route.params.slug && Array.isArray(route.params.slug) && route.params.slug.length > 1) {
    return route.params.slug[0]; // First segment
  }
  
  // For editors/[name]
  if (route.params.name && route.path.startsWith('/editors/')) {
    return 'editors';
  }
  
  // For featured/[slug]
  if (route.params.slug && route.path.startsWith('/featured/')) {
    return 'featured'; 
  }
  
  // Default: first path segment
  return route.path.split('/').filter(Boolean)[0] || '';
});

// Fetch parent page data when needed
const fetchParentPageIfNeeded = async () => {
  if (isOnDynamicPage.value && process.client && parentPath.value) {
    try {
      console.log(`Fetching parent page: ${parentPath.value}`);
      
      const { data } = await storyblokApi.get(`cdn/stories/${parentPath.value}`, {
        version: version.value
      });
      
      parentPageData.value = data.story;
      isParentDataLoaded.value = true;
      
      // Now that parent data is loaded, we can mark the URL as ready
      if (currentVideoUrl.value) {
        console.log('Setting video URL ready after parent data loaded');
        isVideoUrlReady.value = true;
      }
      
      return data.story;
    } catch (err) {
      console.error(`Error fetching parent page (${parentPath.value}):`, err);
      parentPageData.value = null;
      isParentDataLoaded.value = true;
      
      // Mark URL as ready even on error (will use default)
      isVideoUrlReady.value = true;
      
      return null;
    }
  } else {
    // If not on a dynamic page, mark parent data as loaded and URL as ready
    isParentDataLoaded.value = true;
    isVideoUrlReady.value = true;
  }
  return null;
};

// Call this when mounted
onMounted(async () => {
  // Set isVideoUrlReady to true immediately to start loading animation right away
  // This prevents the flash of default animation
  isVideoUrlReady.value = true;
  
  if (isOnDynamicPage.value) {
    // Fetch parent page data in the background - no await to prevent delay
    fetchParentPageIfNeeded();
  }
  
  if (window.location.search.includes('_storyblok')) {
    version.value = 'draft'
  }

  // Initialize states if returning to homepage
  if (route.path === '/' && hasSeenTakeover.value) {
    takeoverComplete.value = true
    canAnimateQuote.value = true
  }
});

// Check if current page has VideoAnimationOverride
const hasVideoOverride = computed(() => {
  // First check current page
  if (currentPageData.value?.content?.body) {
    const hasOverride = currentPageData.value.content.body.some(
      item => item.component === 'VideoAnimationOverride' && item.URL
    );
    
    if (hasOverride) return true;
  }
  
  // If on dynamic page, check parent page too
  if (isOnDynamicPage.value && parentPageData.value?.content?.body) {
    return parentPageData.value.content.body.some(
      item => item.component === 'VideoAnimationOverride' && item.URL
    );
  }
  
  return false;
});

// Get the override URL if it exists
const videoOverrideUrl = computed(() => {
  if (!hasVideoOverride.value) return '';
  
  // First check current page
  if (currentPageData.value?.content?.body) {
    const overrideItem = currentPageData.value.content.body.find(
      item => item.component === 'VideoAnimationOverride'
    );
    
    if (overrideItem?.URL) return overrideItem.URL;
  }
  
  // If on dynamic page, check parent page
  if (isOnDynamicPage.value && parentPageData.value?.content?.body) {
    const parentOverrideItem = parentPageData.value.content.body.find(
      item => item.component === 'VideoAnimationOverride'
    );
    
    return parentOverrideItem?.URL || '';
  }
  
  return '';
})

// Default logo URL from global settings
const logoMainUrl = computed(() => 
  logo.value?.content?.body?.[0]?.MainLogo || ''
)

// Use the override URL if available, otherwise fall back to global logo URL
// Apply override whenever it's available
const currentVideoUrl = computed(() => 
  hasVideoOverride.value && videoOverrideUrl.value ? videoOverrideUrl.value : logoMainUrl.value
)

// Flag indicating the final URL is determined and stable
const isVideoUrlReady = ref(false)

// Flag to track if parent data is loaded
const isParentDataLoaded = ref(false)

// Watch for URL changes and set ready flag
watch(currentVideoUrl, (newUrl) => {
  // When isOnDynamicPage is true and parentPageData isn't loaded yet,
  // the URL might still change, so don't set ready yet
  if (isOnDynamicPage.value && !isParentDataLoaded.value) {
    return;
  }
  
  // Otherwise mark URL as ready
  if (newUrl) {
    isVideoUrlReady.value = true;
  }
})

const handleTakeoverComplete = () => {
  hasSeenTakeover.value = true
  takeoverComplete.value = true
  
  if (route.path === '/') {
    setTimeout(() => {
      canAnimateQuote.value = true
    }, 800)
  }
}

// Helper function for debouncing
const debounce = (fn, delay) => {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

// Function to handle scroll events
const checkScrollPosition = () => {
  if (!layoutRoot.value) return
  
  // Get the current scroll position
  const scrollY = window.scrollY || window.pageYOffset
  
  // Get the viewport height
  const viewportHeight = window.innerHeight
  
  // Set hasScroll to true if user has scrolled down one full viewport height
  hasScroll.value = scrollY >= viewportHeight
  
  // Set hasScrolled to true if user has scrolled more than 5px
  hasScrolled.value = scrollY >= 1
  
  // console.log(`Scroll position: ${scrollY}px, viewport height: ${viewportHeight}px, hasScroll: ${hasScroll.value}, hasScrolled: ${hasScrolled.value}`)
};

// Debounced version of the scroll handler to improve performance
const handleScroll = debounce(checkScrollPosition, 50);

// Initialize on mount - already handled initial states in the main onMounted hook above
onMounted(() => {
  // Add scroll event listener
  window.addEventListener('scroll', handleScroll, { passive: true })
  
  // Initial check for scroll position (without debounce)
  checkScrollPosition()
})

// Watch for route changes
watch(() => route.path, (newPath) => {
  // logState(`Route Changed to: ${newPath}`)
  
  if (newPath === '/') {
    // When returning to homepage and we've seen the takeover
    if (hasSeenTakeover.value) {
      nextTick(() => {
        takeoverComplete.value = true
        canAnimateQuote.value = true
      })
    }
  }
  
  // Reset the scroll states when changing routes
  hasScroll.value = false
  hasScrolled.value = false
  
  // Check scroll position after route changes
  nextTick(() => {
    // Use a slight delay to ensure scrolling is reset
    setTimeout(checkScrollPosition, 300)
  })
})

// Cleanup event listeners on unmount
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.page-layout {
  background-color: var(--color-black);
  min-height: 100svh;
  
  &.has-scroll-100vh {
    :deep(.sticky-video-container) {
      pointer-events: none;
    }
  }
}

.nuxt-loading-indicator {
  background-color: var(--color-blue);
}

.panel-is-open {
    overflow: hidden;
    
    /* Make sure hamburger is always visible when panel is open */
    .global-hamburger {
      display: flex !important;
    }
}

.nav-container {
  @media (max-width: 768px) {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: var(--header-bg-color);
    z-index: 1000;

    :deep(.global-nav) {
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }
  }
}
</style>