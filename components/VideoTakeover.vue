<!-- components/VideoTakeover.vue -->
<template>
  <div 
    class="video-takeover"
    :class="{ 
      'fade-out': isFading,
      'video-initializing': videoStatus === 'Initializing' || !props.lottieUrl
    }"
  >
    <!-- Debug Panel -->
    <div v-if="debug" class="debug-panel">
      <div>Animation Status: {{ videoStatus }}</div>
      <div>Loading Progress: {{ loadingProgress }}%</div>
      <div>Error: {{ errorMessage || 'None' }}</div>
      <div>Source: {{ lottieUrl }}</div>
      <div>URL Ready: {{ props.isUrlReady }}</div>
      <div>Initial Load: {{ isInitialLoad }}</div>
    </div>

    <!-- Loading Indicator -->
    <div class="loading-container" :class="{ 'visible': isLoading || !props.lottieUrl }">
      <div class="loading-bar-container">
        <div 
          class="loading-bar" 
          :style="{ 
            width: `${loadingProgress}%`,
            backgroundColor: loadingBarColor
          }"
        ></div>
      </div>
    </div>

    <!-- Error State -->
    <!-- <div v-if="errorMessage" class="error-container">
      <span class="error-text">{{ errorMessage }}</span>
      <button @click="retryLoad" class="retry-button">Retry</button>
    </div> -->

    <!-- Lottie Animation Container -->
    <div 
      v-show="props.lottieUrl" 
      ref="lottieContainer" 
      :class="['lottie-container', { 'lottie-visible': isAnimationReady }]"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'

const nuxtApp = useNuxtApp()
const lottie = nuxtApp.$lottie

const props = defineProps({
  lottieUrl: {
    type: String,
    required: true
  },
  isUrlReady: {
    type: Boolean,
    default: false
  },
  debug: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['complete', 'error'])

// Refs
const lottieContainer = ref(null)
const lottieInstance = ref(null)
const isLoading = ref(true)
const isFading = ref(false)
const errorMessage = ref('')
const videoStatus = ref('Initializing')
const lastEvent = ref('')
const loadingProgress = ref(0)
const isAnimationReady = ref(false) // Track when animation is ready to display

// Loading state computeds
const showLoading = computed(() => {
  return isLoading.value || videoStatus.value === 'Buffering'
})

const loadingMessage = computed(() => {
  switch (videoStatus.value) {
    case 'Initializing':
      return 'Initializing animation...'
    case 'Loading started':
      return 'Loading animation...'
    case 'Buffering':
      return 'Buffering...'
    case 'Data loaded':
      return 'Preparing playback...'
    case 'Ready to play':
      return 'Starting playback...'
    case 'Stalled':
      return 'Connection interrupted...'
    case 'Error':
      return 'Error loading animation'
    default:
      return 'Get Ready...'
  }
})

const loadingBarColor = computed(() => {
  switch (videoStatus.value) {
    case 'Error':
      return '#ff4444'
    case 'Stalled':
      return '#ffaa00'
    case 'Ready to play':
      return '#00aaff'
    default:
      return '#00aaff'
  }
})

// Event logging helper
const logEvent = (event, details = '') => {
  const message = `Lottie Event: ${event}${details ? ` - ${details}` : ''}`
  lastEvent.value = message
  // console.log(message)
}

// Load and initialize Lottie animation
const loadLottieAnimation = async () => {
  try {
    // Don't proceed if there's no URL or container
    if (!props.lottieUrl || !lottieContainer.value) {
      videoStatus.value = 'Waiting for URL'
      return
    }
    
    videoStatus.value = 'Loading started'
    loadingProgress.value = 10
    isLoading.value = true
    logEvent('loadStart', props.lottieUrl)
    
    if (lottieInstance.value) {
      lottieInstance.value.destroy()
      lottieInstance.value = null
    }
    
    // Simulate loading progress with proper reference for cleanup
    const progressInterval = setInterval(() => {
      if (loadingProgress.value < 80) {
        loadingProgress.value += 5
      } else {
        clearInterval(progressInterval)
      }
    }, 100)
    
    // Store interval reference for cleanup
    const intervalRef = progressInterval

    // console.log('Loading Lottie animation with URL:', props.lottieUrl)
    
    // Focus on JSON files for now
    lottieInstance.value = lottie.loadAnimation({
      container: lottieContainer.value,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path: props.lottieUrl
    })
    
    // Event listeners
    lottieInstance.value.addEventListener('DOMLoaded', () => {
      videoStatus.value = 'Data loaded'
      loadingProgress.value = 85
      logEvent('DOMLoaded')
    })
    
    lottieInstance.value.addEventListener('data_ready', () => {
      videoStatus.value = 'Ready to play'
      loadingProgress.value = 95
      logEvent('data_ready')
      
      // Clear any remaining progress interval
      clearInterval(intervalRef)
      
      // Set animation as ready first, then play it after a short delay
      // This ensures the container is visible before the animation starts
      isAnimationReady.value = true
      
      setTimeout(() => {
        isLoading.value = false
        loadingProgress.value = 100
        videoStatus.value = 'Playing'
        lottieInstance.value.play()
        logEvent('playing')
      }, 200)
    })
    
    lottieInstance.value.addEventListener('complete', () => {
      videoStatus.value = 'Ended'
      logEvent('complete')
      // First fade out the animation container
      isAnimationReady.value = false
      // Then fade out the entire takeover
      setTimeout(() => {
        isFading.value = true
        setTimeout(() => {
          emit('complete')
        }, 400)
      }, 200)
    })
    
    lottieInstance.value.addEventListener('data_failed', (err) => {
      handleError(err)
      clearInterval(intervalRef)
      logEvent('data_failed', err?.message)
    })
    
  } catch (error) {
    handleError(error)
  }
}
const handleError = (e) => {
  const errorDetails = {
    message: e?.message || 'Unknown error',
    details: e
  }

  errorMessage.value = `Animation Error: ${errorDetails.message}`
  videoStatus.value = 'Error'
  loadingProgress.value = 0
  isAnimationReady.value = false
  
  console.error('Animation Error Details:', errorDetails)
  emit('error', errorDetails)
}

// Retry mechanism
const retryLoad = () => {
  try {
    resetAnimationState();
    errorMessage.value = ''
    videoStatus.value = 'Retrying'
    loadLottieAnimation()
  } catch (error) {
    console.error('Retry failed:', error)
    errorMessage.value = 'Retry failed: ' + error.message
  }
}

// Reset animation state when URL changes or component refreshes
const resetAnimationState = () => {
  isAnimationReady.value = false;
  isLoading.value = true;
  loadingProgress.value = 0;
  videoStatus.value = 'Initializing';
};

// Watch for when the URL is ready to load
// Start loading immediately when URL becomes ready
watch(() => props.isUrlReady, (isReady) => {
  if (isReady && props.lottieUrl) {
    // console.log('URL is now ready, loading animation with final URL:', props.lottieUrl)
    resetAnimationState(); // Reset animation state before loading animation
    // Use setTimeout with 0ms to push this to the next event loop tick
    // This helps ensure the DOM is ready and improves performance
    setTimeout(() => {
      loadLottieAnimation();
    }, 0);
  }
})

// Also watch for source changes (for dynamic updates)
watch(() => props.lottieUrl, (newUrl, oldUrl) => {
  // Only reload if the URL changes after it was marked as ready
  if (props.isUrlReady && oldUrl && newUrl !== oldUrl) {
    // console.log('Animation URL changed after ready state, reloading animation', { oldUrl, newUrl })
    resetAnimationState(); // Reset animation state before loading new animation
    loadLottieAnimation();
  }
})

// Track if we're in the initial load to prevent double loading
const isInitialLoad = ref(true)
  
// Lifecycle
onMounted(() => {
  // Reset animation state on mount
  resetAnimationState();
  
  // Don't auto-load - wait for isUrlReady to become true
  // console.log('VideoTakeover mounted, waiting for URL ready state');
  
  // If URL is already marked as ready, load the animation
  if (props.isUrlReady && props.lottieUrl) {
    console.log('URL already ready on mount, loading:', props.lottieUrl);
    loadLottieAnimation();
  }
})

onBeforeUnmount(() => {
  if (lottieInstance.value) {
    // Remove event listeners to prevent memory leaks
    lottieInstance.value.removeEventListener('DOMLoaded')
    lottieInstance.value.removeEventListener('data_ready')
    lottieInstance.value.removeEventListener('complete')
    lottieInstance.value.removeEventListener('data_failed')
    
    // Destroy the instance
    lottieInstance.value.destroy()
    lottieInstance.value = null
  }
})
</script>

<style lang="scss" scoped>
.video-takeover {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: var(--color-black);
  z-index: 9999;
  opacity: 1;
  transition: opacity .4s var(--easing-motion);

  &.fade-out {
    opacity: 0;
    pointer-events: none;
  }
}

.video-initializing {
  background-color: var(--color-black);
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  text-align: center;
  z-index: 10000;
  width: 100%;
  opacity: 0;
  transition: opacity 0.3s ease-out;
  
  &.visible {
    opacity: 1;
  }
}

.loading-text {
  display: block;
  color: var(--color-white);
}

.loading-bar-container {
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.loading-bar {
  height: 100%;
  background: var(--color-white);
  transition: all 0.3s ease-out;
}

.error-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 10000;
}

.error-text {
  display: block;
  color: #ff4444;
  font-size: 16px;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.retry-button {
  padding: 8px 16px;
  background: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.4s var(--easing-motion);
  
  &:hover {
    background: #eee;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  z-index: 1001;
  
  div {
    margin: 4px 0;
    white-space: nowrap;
  }
}

.lottie-container {
  width: 50%;
  height: 50%;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.4s var(--easing-motion);
  
  &.lottie-visible {
    opacity: 1;
  }
}
</style>