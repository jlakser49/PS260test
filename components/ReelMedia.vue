<!-- components/ReelMedia.vue -->
<template>
  <div class="reel-media">
    <template v-if="currentMedia">
      <div class="reel-container">
        <VideoStage
          :desktopSrc="currentMedia.media_file"
          :mobileSrc="currentMedia.media_file"
          mode="fit-to-parent"
          class="reel-stage"
          ref="containerRef"
          :poster="currentMedia.thumbnail"
        >
          <template #top>
            <div class="header-container">
              <div class="header">
                <div class="header__controls">
                  <NuxtLink 
                    :to="computedCloseLink"
                    class="back-button-x"

                  >
                    <IconClose />
                  </NuxtLink>
                  <!-- <NuxtLink 
                    v-if="headerTitle"
                    :to="backLink || computedBackLink" 
                    class="back-button"
                    :style="{ 
                      viewTransitionName: `editor-${headerTitle.toLowerCase().replace(/\s+/g, '-')}` 
                    }"
                  >
                    {{ headerTitle }}
                  </NuxtLink> -->
                  <h1 
                    v-if="headerTitle"
                    class="editor-name-label"
                    :style="{ 
                      viewTransitionName: `editor-${headerTitle.toLowerCase().replace(/\s+/g, '-')}` 
                    }"
                  >
                    {{ headerTitle }}
                  </h1>
                </div>
              </div>
            </div>

            <NextPrevLink 
              :to="getNavLinks.prev"
              :next="false"
              :current-index="currentIndex"
              :total-items="mediaItems.length"
            />
            <NextPrevLink 
              :to="getNavLinks.next"
              :next="true"
              :current-index="currentIndex"
              :total-items="mediaItems.length"
            />
          </template>

          <template #default>
            <div class="info">
              <h1 class="title">{{ formatMainTitle(currentMedia.title) }}</h1>
              <div v-if="reelTitle(currentMedia.title)" class="subtitle">
                {{ reelTitle(currentMedia.title) }}
              </div>
              <div v-if="currentMedia.credits?.director" class="director">
                Dir. {{ currentMedia.credits.director }}
              </div>
            </div>
          </template>
        </VideoStage>
      </div>
    </template>
  </div>
</template>

  
<script setup>
  import { useRoute, useRouter } from 'vue-router';
  
  const route = useRoute();
  const router = useRouter();
  
  
  const props = defineProps({
    mediaItems: {
      type: Array,
      required: true
    },
    backLink: {
      type: String,
      required: true
    },
    closeLink: {
      type: String,
      required: false
    },
    headerTitle: {
      type: String,
      required: true
    },
    backToEditor: {
      type: String,
      default: 'Back'
    },
    error: {
      type: Object,
      default: null
    },
    slugParam: {
      type: String,
      required: true,
      default: '' 
    },
    cameFromHome: {
        type: Boolean,
        default: false
    },
    currentMedia: {
      type: Object,
      required: true,
      default: () => ({})
    }
  });
  
  // state variables
  const pending = ref(true); // Define pending state
  const cameFromHistory = ref(false);
  
  // Find current media based on slug
  const currentMedia = computed(() => {
    if (!props.mediaItems || !Array.isArray(props.mediaItems) || !props.slugParam) {
      return null;
    }
    
    try {
      return props.mediaItems.find(media => {
        if (!media || !media.title) return false;
        return formatSlug(media.title) === props.slugParam;
      });
    } catch (error) {
      // console.error('Error finding current media:', error);
      return null;
    }
  });
  
  // Add these missing helper functions
  const formatMainTitle = (title) => {
    if (!title || typeof title !== 'string') {
      return '';
    }

    try {
      // Decode HTML entities using browser's parser or manual replacement
      const decodedTitle = process.client
        ? (function() {
            const div = document.createElement('div');
            div.innerHTML = title;
            return div.textContent || div.innerText || title;
          })()
        : title.replace(/&#39;/g, "'").replace(/&#039;/g, "'").replace(/&apos;/g, "'")
               .replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&amp;/g, '&');

      const parts = decodedTitle.split(/[""\u201C\u201D]/);
      return parts[0].trim();
    } catch (error) {
      // console.error('Error formatting main title:', error, title);
      return '';
    }
  };
  
  const reelTitle = (title) => {
    if (!title || typeof title !== 'string') {
      return null;
    }
    
    try {
      const match = title.match(/[""\u201C](.*?)[""\u201D]/);
      return match ? match[1].trim() : null;
    } catch (error) {
      // console.error('Error getting reel title:', error, title);
      return null;
    }
  };
  
  // Track initial entry path and whether we've navigated between videos
  const initialEntryPath = ref('');
  const hasNavigatedVideos = ref(false);
  
  const formatSlug = (title) => {
    if (!title || typeof title !== 'string') {
      return '';
    }

    try {
      // Decode HTML entities using browser's parser or manual replacement
      const decodedTitle = process.client
        ? (function() {
            const div = document.createElement('div');
            div.innerHTML = title;
            return div.textContent || div.innerText || title;
          })()
        : title.replace(/&#39;/g, "'").replace(/&#039;/g, "'").replace(/&apos;/g, "'")
               .replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&amp;/g, '&');

      return decodedTitle
        .toLowerCase()                    // Convert to lowercase
        .replace(/['"""'']/g, '')         // Remove all types of quotes
        .replace(/&/g, '-and-')           // Replace & with 'and'
        .replace(/[^\w\s-]/g, '')         // Remove special chars except alphanumeric, spaces, hyphens
        .trim()                           // Trim whitespace
        .replace(/\s+/g, '-')             // Replace spaces with hyphens
        .replace(/-+/g, '-')              // Remove consecutive hyphens
        .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens
    } catch (error) {
      // console.error('Error formatting slug:', error, title);
      return '';
    }
  };
  
  const currentIndex = computed(() => {
    if (!props.mediaItems || !props.mediaItems.length || !props.slugParam) return -1;
    
    return props.mediaItems.findIndex(media => {
      if (!media || !media.title) return false;
      return formatSlug(media.title) === props.slugParam;
    });
  });
  
  const getNavLinks = computed(() => {
    if (!props.mediaItems || !props.mediaItems.length || currentIndex.value === -1) {
      return { prev: null, next: null };
    }
    
    try {
      const basePath = route.path.split('/').slice(0, -1).join('/');
      
      let prev = null;
      if (currentIndex.value > 0 && props.mediaItems[currentIndex.value - 1]) {
        const prevMedia = props.mediaItems[currentIndex.value - 1];
        if (prevMedia && prevMedia.title) {
          prev = {
            title: prevMedia.title,
            slug: formatSlug(prevMedia.title)
          };
        }
      }
      
      let next = null;
      if (currentIndex.value < props.mediaItems.length - 1 && props.mediaItems[currentIndex.value + 1]) {
        const nextMedia = props.mediaItems[currentIndex.value + 1];
        if (nextMedia && nextMedia.title) {
          next = {
            title: nextMedia.title,
            slug: formatSlug(nextMedia.title)
          };
        }
      }
    
      return {
        prev: prev && prev.slug ? `${basePath}/${prev.slug}` : null,
        next: next && next.slug ? `${basePath}/${next.slug}` : null
      };
    } catch (error) {
      // console.error('Error generating nav links:', error);
      return { prev: null, next: null };
    }
  });
  
  // Watch for navigation between videos
  const stopWatcher = watch(() => route.path, (newPath, oldPath) => {
    // Only proceed if both paths are valid strings
    if (oldPath && newPath && typeof oldPath === 'string' && typeof newPath === 'string') {
      try {
        const newBase = newPath.split('/').slice(0, -1).join('/');
        const oldBase = oldPath.split('/').slice(0, -1).join('/');
        
        // If same base (directory) but different video
        if (newBase === oldBase && newPath !== oldPath) {
          hasNavigatedVideos.value = true;
          sessionStorage.setItem('hasNavigatedVideos', 'true');
        }
      } catch (error) {
        // Ignore errors in the watcher 
        // console.error('Error in route watcher:', error);
      }
    }
  }, { immediate: false });
  
  // Cleanup watchers and prevent navigation during component teardown
  onBeforeUnmount(() => {
    stopWatcher();
    
    // Set a flag to prevent navigation during unmount
    isUnmounting.value = true;
  });
  
  // Flag to track component unmounting state
  const isUnmounting = ref(false);
  
  const computedBackLink = computed(() => {
        return props.cameFromHome ? '/' : props.backLink; // Set to '/' if cameFromHome is true
    });

    // Use our composable for safe state management
    const { getNuxtReferrer } = useReferrerTracking();
    
    const computedCloseLink = computed(() => {
      // Get our tracking information safely (works with SSR)
      const nuxtReferrer = process.client ? getNuxtReferrer() : '';
      
      // Get path parts (more reliable than route.name or params)
      const pathParts = route.path.split('/').filter(Boolean);
      
      // SPECIAL CASE: If we're on a featured page, always go back to home
      if (pathParts[0] === 'featured') {
        console.log('CLOSE: Featured page detected, overriding to go to home');
        return '/';
      }
      
      // Use closeLink prop if provided (specifically for the X button)
      if (props.closeLink && props.closeLink !== '/') {
        console.log('CLOSE: Using provided closeLink prop:', props.closeLink);
        return props.closeLink;
      }
      
      // Priority 1: Use the provided backLink prop if available
      if (props.backLink && props.backLink !== '/' && pathParts[0] !== 'featured') {
        console.log('CLOSE: Using provided backLink prop:', props.backLink);
        return props.backLink;
      }
      
      // Priority 2: Use our custom nuxtReferrer if available and valid
      if (nuxtReferrer && nuxtReferrer !== '/' && nuxtReferrer !== route.path) {
        console.log('CLOSE: Using tracked nuxtReferrer:', nuxtReferrer);
        return nuxtReferrer;
      }
      
      // Priority 3: Use URL structure for predictable fallbacks
      
      // Editors section
      if (pathParts[0] === 'editors') {
        // Editor videos (3 segments: /editors/name/video)
        if (pathParts.length >= 3) {
          console.log('CLOSE: Editor video route, going to editor page:', `/editors/${pathParts[1]}`);
          return `/editors/${pathParts[1]}`; 
        } 
        // Editor pages (2 segments: /editors/name)
        else if (pathParts.length === 2) {
          console.log('CLOSE: Editor page route, going to editors index');
          return '/editors';
        }
        // Editors index
        else {
          console.log('CLOSE: Editors index, going to home');
          return '/';
        }
      }
      
      // Featured section is now handled at the top of the function
      
      // Other nested routes with 2+ segments (like /vfx/video-name)
      else if (pathParts.length >= 2) {
        console.log('CLOSE: Nested route, going to parent section:', `/${pathParts[0]}`);
        return `/${pathParts[0]}`;
      }
      
      // Default case - go to home
      console.log('CLOSE: Default case, going to home');
      return '/';
    })

  // Set pending to false after data is loaded
  pending.value = false; // Update this based on your data fetching logic
  
  // On mount, store the scroll position data for back navigation
  onMounted(() => {
    // Check if we already have an initialEntryPath stored in sessionStorage
    const storedPath = sessionStorage.getItem('videoEntryPath');
    const storedBaseUrl = sessionStorage.getItem('videoBaseUrl');
    const currentBaseUrl = route.path.split('/').slice(0, -1).join('/');
    
    // Use our composable for safe state management
    const { 
      getNuxtReferrer, 
      getVideoOrigin, 
      setVideoOrigin, 
      getPageHistory 
    } = useReferrerTracking();
    
    // console.log('====== VIDEO ORIGIN DEBUG ======');
    
    if (process.client) {
      // Get our custom tracked referrer (more reliable than document.referrer)
      const nuxtReferrer = getNuxtReferrer();
      // console.log('Nuxt tracked referrer:', nuxtReferrer || 'NONE');
      
      // Store the properly tracked origin only if it hasn't been set yet
      if (nuxtReferrer && getVideoOrigin() === '/') {
        // console.log('Setting videoOrigin from nuxtReferrer:', nuxtReferrer);
        setVideoOrigin(nuxtReferrer);
      }
      
      // Extract current path parts for debugging
      const pathParts = route.path.split('/').filter(Boolean);
      // console.log('Current path parts:', pathParts);
      
      // Log expected navigation based on URL structure
      // if (pathParts.length >= 3 && pathParts[0] === 'editors') {
        // console.log('Editor reel detected, should go to:', `/editors/${pathParts[1]}`);
      // } else if (pathParts.length === 2) {
        // console.log('Section item detected, should go to:', `/${pathParts[0]}`);
      // } else {
        // console.log('Top level detected, should go to: /');
      // }
      
      // For debugging: still log all referrer information
      // console.log('document.referrer:', document.referrer || 'EMPTY');
      // console.log('Current URL:', window.location.href);
      // console.log('videoOrigin:', getVideoOrigin() || 'NONE');
      
      // Show page history
      const history = getPageHistory();
      // console.log('📚 PAGE HISTORY:', history);
    }
    
    // console.log('==============================');
    
    // Get the state management functions we need
    const { 
      setVideoEntryPath, 
      setVideoBaseUrl, 
      setHasNavigatedVideos 
    } = useReferrerTracking();
    
    if (process.client) {
      // First time visiting any video or different section
      if (!storedBaseUrl || storedBaseUrl !== currentBaseUrl) {
        // Store current path as entry point (first video viewed)
        initialEntryPath.value = route.path;
        hasNavigatedVideos.value = false;
        
        // Reset for new section - using both our composable and sessionStorage for compatibility
        setVideoEntryPath(route.path);
        setVideoBaseUrl(currentBaseUrl);
        setHasNavigatedVideos(false);
      } else {
        // Not first video, might be navigating within a section
        initialEntryPath.value = storedPath || route.path;
        
        // If the current path is different from stored path but same base URL,
        // we've navigated between videos
        if (route.path !== storedPath && currentBaseUrl === storedBaseUrl) {
          hasNavigatedVideos.value = true;
          setHasNavigatedVideos(true);
        }
      }
      
      // Check if there's previous history entry
      if (window.history.state && window.history.state.position) {
        cameFromHistory.value = true;
      }
    }
  });
  
  </script>
  
<style lang="scss" scoped>
  
.reel-media {
  height: var(--window-height);

  position: relative;
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .loading-text {
  text-align: center;
  font-size: 20px;
  color: var(--color-white);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.reel-container {
  // height: 100vh;
  width: 100%;
}

.fade-out {
  opacity: 0; /* Fade out effect */
}

.reel-stage {
  height: 100%;
}

.header-container {
  width: 100%;
  max-width: 750px;
  // max-width: calc(25.75rem + ((1vw - 7.68px) * 25.9861));

  margin: 15px auto;
  // padding: 0 7.5%;
  box-sizing: border-box;
  transition: max-width 0.4s ease-in-out, opacity 0.1s;
}

.header {
  width: 100%;
  height: 100%;
  position: relative;
  
  &__controls {
    // padding: 20px;
    display: flex;
    align-items: flex-start; // Changed from center
    justify-content: space-between;
    height: 100%;
  }
}

.editor-name-label {
  color: var(--color-yellow);
  text-decoration: none;
  font-size: 24px;
  font-family: "PS260", sans-serif;
  font-weight: normal;
  padding-right: 20px;
  margin: 0;

  &:hover {
    // opacity: .55;
  }
}

.back-button-x {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-gray);
  font-size: 20px;
  font-weight: 300;
  transition: color 0.4s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--color-yellow);
  }
}

.info {
  padding: 25px 0;
  text-align: center;
  color: var(--color-white);
}

.title {
  font-size: 36px;
  margin-bottom: 4px;
  margin-top: 0;
  font-weight: 900;
}

.subtitle {
  font-size: 18px;
  margin-bottom: 3px;
  font-weight: 500;
}

.director {
  font-size: 16px;
  font-weight: 700;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  // height: 100vh;
  color: var(--color-white);
  text-align: center;
  padding: 2rem;
  
  .back-link {
    margin-top: 1rem;
    color: var(--color-yellow);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

:deep(.video-stage)  {
        height: var(--window-height);
        // @todo verify responsive raffi!
        max-height: 768px;
        
       
        overflow: hidden;

        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
        justify-content: center;
        align-content: center;
        align-items: center;
        // gap: 20px;
        // overflow: hidden;

        .iframe {
          width: 100%;
            height: auto;
            flex: 1 1 auto;
            position: static;
            margin: auto;
            // max-width: 920px;
        }
       .slot-bottom {
            width: 100%;
            // margin: 20px 0;

            display: flex;
            justify-content: center;
            align-items: center;
        }
}

@include phone-landscape {
  .header-container {
    display: none;
  }
  .info {
    display: none
  }
}

@include lt-tablet {
  .title {
    font-size: 32px;
  }

  .subtitle {
    font-size: 16px;
  }

  .director {
    font-size: 12px;
  }

}

  @include lt-phone {
    .title {
      margin: 0;
    }
    .editor-name-label {
      padding-right: 0;
    }
  }
}

</style>
