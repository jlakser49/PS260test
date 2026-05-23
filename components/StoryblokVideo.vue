<template>
  <div :class="['section-video', { 'is-accent': isAccent }]">
    <div v-if="isLoading" class="loading-container">
      <div class="loading-background"></div>
    </div>
    
    <!-- Debug Panel (only visible when debug is true) -->
    <div v-if="debug" class="debug-panel">
      <div>Video Status: {{ videoStatus }}</div>
      <div>Current Time: {{ formatTime(currentTime) }}</div>
      <div>Duration: {{ formatTime(duration) }}</div>
      <div>Progress: {{ Math.round((currentTime / (duration || 1)) * 100) }}%</div>
      <div>Index: {{ activeIndex }} / {{ mediaItems.length }}</div>
      <div>Auto Cycle: {{ props.autoCycle ? 'Enabled' : 'Disabled' }}</div>
      <div>Media Type: {{ currentMedia?.type || 'None' }}</div>
      <div v-if="currentMedia?.title">Title: {{ currentMedia.title }}</div>
    </div>
    
    <!-- Media Display - render all media items but only show active one -->
    <div class="media-container">
      <!-- Render all media items but control visibility with CSS -->
      <template v-for="(media, index) in mediaItems" :key="`media-${index}`">
        <div 
          :class="['media-wrapper', { 'active': index === activeIndex }]">
          
          <!-- Use NuxtLink if linking is enabled -->
          <NuxtLink v-if="!isLinkDisabled" :to="getMediaLink(media.title)" class="media-link">
            <!-- Video Media -->
            <video 
              v-if="media.type === 'video'"
              :id="`video-${index}`"
              :ref="`video-${index}`"
              class="video-element" 
              muted 
              autoplay
              :loop="!props.autoCycle"
              playsinline
              :src="media.videoUrl"

              :data-index="index"
              webkit-playsinline
              x5-playsinline
              playsInline
              @timeupdate="(e) => index === activeIndex && updateVideoDetails(e)"
              @loadstart="(e) => index === activeIndex && updateVideoStatus('Loading started')"
              @loadeddata="(e) => index === activeIndex && updateVideoStatus('Data loaded')"
              @canplay="(e) => index === activeIndex && updateVideoStatus('Ready to play')"
              @play="(e) => index === activeIndex && updateVideoStatus('Playing')"
              @pause="(e) => index === activeIndex && updateVideoStatus('Paused')"
              @waiting="(e) => index === activeIndex && updateVideoStatus('Buffering')"
              @stalled="(e) => index === activeIndex && updateVideoStatus('Stalled')"
              @error="(e) => index === activeIndex && updateVideoStatus('Error')"
              @ended="(e) => index === activeIndex && handleVideoEnded(e)"
            >
              <!-- Fallback for browsers that don't support the src attribute -->
              <source 
                v-if="media.videoUrl" 
                :src="media.videoUrl" 
                type="video/mp4"
              />
            </video>
            <!-- Image Media -->
            <img 
              v-else 
              class="image-element" 
              :src="media.thumbnailUrl" 
              alt=""
            />
          </NuxtLink>
          
          <!-- Use a div when linking is disabled -->
          <div v-else class="media-link no-link">
            <!-- Video Media -->
            <video 
              v-if="media.type === 'video'"
              :id="`video-${index}-nolink`"
              :ref="`video-${index}-nolink`" 
              class="video-element" 
              muted 
              autoplay
              :loop="!props.autoCycle"
              playsinline
              webkit-playsinline
              x5-playsinline
              playsInline
              :src="media.videoUrl"

              :data-index="index"
              @timeupdate="(e) => index === activeIndex && updateVideoDetails(e)"
              @loadstart="(e) => index === activeIndex && updateVideoStatus('Loading started')"
              @loadeddata="(e) => index === activeIndex && updateVideoStatus('Data loaded')"
              @canplay="(e) => index === activeIndex && updateVideoStatus('Ready to play')"
              @play="(e) => index === activeIndex && updateVideoStatus('Playing')"
              @pause="(e) => index === activeIndex && updateVideoStatus('Paused')"
              @waiting="(e) => index === activeIndex && updateVideoStatus('Buffering')"
              @stalled="(e) => index === activeIndex && updateVideoStatus('Stalled')"
              @error="(e) => index === activeIndex && updateVideoStatus('Error')"
              @ended="(e) => index === activeIndex && handleVideoEnded(e)"
            >
              <!-- Fallback for browsers that don't support the src attribute -->
              <source 
                v-if="media.videoUrl" 
                :src="media.videoUrl" 
                type="video/mp4"
              />
            </video>
            <!-- Image Media -->
            <img 
              v-else 
              class="image-element" 
              :src="media.thumbnailUrl" 
              alt=""
            />
          </div>
        </div>
      </template>
    </div>
    
    <!-- Pagination (only show if there are multiple items) -->
    <SectionPagination 
      v-if="mediaItems.length > 1"
      :index="activeIndex"
      :total-sections="mediaItems.length"
      :is-active="true"
      @change="handleSectionChange"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

interface MediaData {
  videoUrl?: string;
  thumbnailUrl: string;
  title?: string;
  alternateFormat?: {
    file: string;
    file_type: string;
  };
  type: 'video' | 'image';
}

interface StoryblokBlok {
  simianReelId: string;
  disableLink?: string;
  randomizeOrder?: boolean;
  _uid?: string;
  component?: string;
}

const props = defineProps({
  blok: {
    type: Object as PropType<StoryblokBlok>,
    required: true
  },
  isAutoplay: {
    type: Boolean,
    default: true
  },
  index: {
    type: [Number, String],
    default: 0,
    description: "Index of the media item to display from the reel (0-based)"
  },
  isAccent: {
    type: Boolean,
    default: false
  },
  autoCycle: {
    type: Boolean,
    default: true,
    description: "Automatically advance to the next video when current video completes"
  },
  debug: {
    type: Boolean,
    default: false,
    description: "Show debug panel with video details"
  }
})

// Core state
const isLoading = ref(true)
const activeIndex = ref(typeof props.index === 'number' ? props.index : parseInt(props.index as string, 10) || 0)

// Video details tracking
const videoStatus = ref('Initializing')
const currentTime = ref(0)
const duration = ref(0)
const lastEvent = ref('')

// Preload flag
const nextVideoPreloaded = ref(false);

// Flag to prevent multiple transitions at once
const isTransitioning = ref(false);

// Format time helper function (converts seconds to MM:SS format)
const formatTime = (timeInSeconds: number) => {
  if (!timeInSeconds) return '00:00'
  
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Update video status
const updateVideoStatus = (status: string) => {
  videoStatus.value = status
  lastEvent.value = status
  
  if (props.debug) {
    // console.log(`[Video] Status changed to: ${status}`)
  }
}

// Last completion time tracking to prevent multiple triggers
let lastCompletionCheck = 0

// Preload the next video with improved Safari support
const preloadNextVideo = (videoUrl: string) => {
  if (!videoUrl) {
    // console.warn('No next video URL to preload.');
    return;
  }

  // Create preloader with explicit Safari-friendly attributes
  const preloadVideo = document.createElement('video');
  preloadVideo.muted = true;
  preloadVideo.playsInline = true;
  preloadVideo.preload = 'auto';
  preloadVideo.setAttribute('webkit-playsinline', '');
  preloadVideo.setAttribute('playsinline', '');
  
  // Load source and apply attributes before adding to DOM
  const source = document.createElement('source');
  source.src = videoUrl;
  source.type = 'video/mp4';
  preloadVideo.appendChild(source);
  
  // Start preloading sequence
  preloadVideo.load(); // Explicitly call load() for Safari
  
  // Listen for both loadedmetadata and canplaythrough for better Safari support
  preloadVideo.addEventListener('loadedmetadata', () => {
    // Request full data loading after metadata
    preloadVideo.currentTime = 0;
  });
  
  // Add to document temporarily to ensure preloading happens
  preloadVideo.style.display = 'none';
  document.body.appendChild(preloadVideo);
  
  // Remove from DOM after preloading
  setTimeout(() => {
    if (document.body.contains(preloadVideo)) {
      document.body.removeChild(preloadVideo);
    }
  }, 3000); // Give it a few seconds to preload
};

// Update video details during playback
const updateVideoDetails = (event: Event) => {
  const videoElement = event.target as HTMLVideoElement
  if (videoElement) {
    currentTime.value = videoElement.currentTime
    duration.value = videoElement.duration
    
    // For debugging - log when video is close to ending
    if (props.debug && 
        videoElement.currentTime > 0 && 
        videoElement.duration > 0 &&
        videoElement.currentTime > videoElement.duration - 1) {
      // console.log(`[Video] Almost ended: ${formatTime(videoElement.currentTime)}/${formatTime(videoElement.duration)}`)
    }
    
    // Check if video is at the end and manually trigger completion
    // This is a workaround for when the ended event doesn't fire reliably
    const now = Date.now()
    if (props.autoCycle && 
        videoElement.currentTime > 0 && 
        videoElement.duration > 0 &&
        videoElement.currentTime >= videoElement.duration - 0.1 && 
        now - lastCompletionCheck > 1000) { // Prevent multiple triggers within 1 second
      
      // console.log(`[Video] Detected video completion manually: ${formatTime(videoElement.currentTime)}/${formatTime(videoElement.duration)}`)
      lastCompletionCheck = now
      
      // Force reset video properties to prevent looping
      videoElement.loop = false
      
      // Call the advance function if auto-cycling is enabled 
      // console.log('[Video] Manual advance detection - going to next item')
      nextTick(() => {
        advanceToNextVideo()
      })
    }

    // Check if 10% of the video has been played and preload the next video
    if (videoElement.currentTime > 0 &&
        videoElement.duration > 0 &&
        videoElement.currentTime >= videoElement.duration * 0.1 &&
        !nextVideoPreloaded.value) {

      nextVideoPreloaded.value = true; // Set the flag to prevent multiple preloads

      // Determine the index of the next video
      const nextIndex = (activeIndex.value + 1) % mediaItems.value.length;
      const nextMedia = mediaItems.value[nextIndex];

      if (nextMedia && nextMedia.type === 'video') {
        preloadNextVideo(nextMedia.videoUrl);
      }
    }
  }
}

// Handle video ended event
const handleVideoEnded = (event: Event) => {
  updateVideoStatus('Ended')
  
  // Call the advance function if auto-cycling is enabled
  if (props.autoCycle) {
    // console.log('[Video] Video ended, advancing to next item')
    advanceToNextVideo()
  }
}

// Initialize with an empty array - we won't show anything until we have real media
const mediaItems = ref<MediaData[]>([])

// Video order randomization logic (moved from useVideoOrder composable)
const generateRandomOrder = (totalItems: number): number[] => {
  const indices = Array.from({ length: totalItems }, (_, i) => i)
  if (totalItems <= 1) return indices
  
  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  
  return indices
}

// Store video order in session storage
interface OrderEntry {
  order: number[];
}
// Get stored order or generate new one
const getVideoOrder = (reelId: string, totalItems: number): number[] => {
  // Server-side rendering or no window, return sequential order
  if (typeof window === 'undefined') {
    return Array.from({ length: totalItems }, (_, i) => i)
  }
  
  try {
    // Try to get order from sessionStorage instead of localStorage
    const storageKey = `videoOrder_${reelId}`
    const storedValue = sessionStorage.getItem(storageKey)
    
    if (storedValue) {
      // console.log(`[VideoOrder] Getting new random order for ${reelId}`)
    }
    
    // Generate new order if needed
    const newOrder = generateRandomOrder(totalItems)
    
    // Save to sessionStorage
    const entry: OrderEntry = {
      order: newOrder
    }
    
    sessionStorage.setItem(storageKey, JSON.stringify(entry))
    
    // Log new order creation
    // console.log(`[VideoOrder] Created new order for ${reelId}`, {
    //   orderItems: totalItems
    // })
    
    return newOrder
  } catch (e) {
    // console.error('Error in getVideoOrder', e)
    return generateRandomOrder(totalItems)
  }
}

// Check if linking should be disabled
const isLinkDisabled = computed(() => {
  // Simply check if disableLink is "true"
  return props.blok.disableLink === "true";
})

// Active slide computed property 
const currentMedia = computed(() => {
  if (mediaItems.value.length === 0) {
    return null;
  }
  
  // Make sure index is within bounds
  const safeIndex = ((activeIndex.value % mediaItems.value.length) + mediaItems.value.length) % mediaItems.value.length;
  
  // Log if the index needed correction
  if (safeIndex !== activeIndex.value) {
    // console.log(`Corrected index from ${activeIndex.value} to ${safeIndex} (total items: ${mediaItems.value.length})`);
    // Update the actual activeIndex to keep things in sync
    activeIndex.value = safeIndex;
  }
  
  // Use the safe index to get the current media
  return mediaItems.value[safeIndex];
})

// Function to generate media link
const getMediaLink = (title: string | undefined): string => {
  if (!title) return '#';
  return `/featured/${sanitizeTitle(title)}`;
}

// Helper to sanitize titles for URLs
const sanitizeTitle = (title: string): string => {
  if (!title) return '';
  
  return title
    .toLowerCase()                    // Convert to lowercase
    .replace(/['"""'']/g, '')         // Remove quotes
    .replace(/&/g, '-and-')           // Replace & with 'and'
    .replace(/[^a-zA-Z0-9- ]/g, '')   // Remove special chars
    .trim()                           // Trim whitespace
    .replace(/\s+/g, '-')             // Replace spaces with hyphens
    .replace(/-+/g, '-')              // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens
}

// Cache for API responses
const apiCache = ref(new Map());

// Fetch media items using useAsyncData
// Define a synchronous function to load media data
const loadMediaData = async () => {
  try {
    if (!props.blok.simianReelId) {
      return;
    }
    
    // Keep loading indicator until we have real data
    isLoading.value = true;
    
    // Check if we have cached data for this reel ID
    if (apiCache.value.has(props.blok.simianReelId)) {
      const cachedData = apiCache.value.get(props.blok.simianReelId);
      if (cachedData && cachedData.length > 0) {
        mediaItems.value = cachedData;
        isLoading.value = false;
        return;
      }
    }
    
    // Make the API request for new data
    const response = await $fetch('/api/simian', {
      method: 'POST',
      body: {
        reelId: props.blok.simianReelId
      }
    });

    // If no media in response, exit but keep loading state
    if (!response?.root?.media) {
      return;
    }

    // Handle both single media item and array of media items
    const apiMediaItems = Array.isArray(response.root.media) 
      ? response.root.media 
      : [response.root.media];
    
    if (apiMediaItems.length === 0) {
      return;
    }
    
    // Process each media item
    const processedItems = apiMediaItems.map((media) => {
      // Determine media type
      const mediaFileType = media.file_type?.toLowerCase() || '';
      const isVideo = mediaFileType === 'video' || (media.media_file || '').toLowerCase().endsWith('.mp4');
      
      // Determine which video URL to use - prioritize alternate format if available
      let videoUrl = isVideo ? media.media_file : undefined;
      
      // Extract alternate format if available for video preview
      let alternateFormat = undefined;
      
      // Check for alternate formats (preview videos)
      if (media.alternate_formats?.format?.file) {
        // Use alternative format for the videoUrl
        videoUrl = media.alternate_formats.format.file;
        
        // Also keep the alternateFormat structure 
        alternateFormat = {
          file: media.alternate_formats.format.file,
          file_type: media.alternate_formats.format.file_type || 'mp4'
        };
      }
      
      // Create the item object
      return {
        videoUrl: videoUrl,
        thumbnailUrl: media.thumbnail,
        title: media.title,
        alternateFormat,
        type: isVideo ? 'video' : 'image'
      };
    });
    
    if (processedItems.length > 0) {
      // Apply randomized order if enabled in blok settings
      if (props.blok.randomizeOrder && props.blok.simianReelId) {
        // Get a random order using our integrated getVideoOrder function
        const order = getVideoOrder(props.blok.simianReelId, processedItems.length);
        
        // Reorder the items based on the randomized indices
        const reorderedItems = order.map(index => processedItems[index]);
        
        // Set the media items in their randomized order
        mediaItems.value = reorderedItems;
        
        // Cache the reordered items
        apiCache.value.set(props.blok.simianReelId, reorderedItems);
      } else {
        // No randomization - use original order
        mediaItems.value = processedItems;
        apiCache.value.set(props.blok.simianReelId, processedItems);
      }
      
      // Loading complete
      isLoading.value = false;
    }
  } catch (err) {
    // console.error('Error loading media:', err);
  }
};

// Initialize component on mount
onMounted(() => {
  // console.log('StoryblokVideo component mounted')
})

// Run the loading function immediately
loadMediaData();

// Watch for changes to activeIndex to ensure the currentMedia is updated
watch(activeIndex, (newIndex) => {
  // console.log(`Active index changed to ${newIndex}, updating display`);
});

// Handle section changes from manual user interaction
const handleSectionChange = (newIndex: number) => {
  // console.log(`Changing media section from ${activeIndex.value} to ${newIndex}`);
  
  // Don't do anything if we're already transitioning or if it's the same index
  if (isTransitioning.value || newIndex === activeIndex.value) {
    return;
  }
  
  // Set the transitioning flag to prevent multiple transitions
  isTransitioning.value = true;
  
  // Get the current index before changing it
  const currentIdx = activeIndex.value;
  
  // Get references to current and next video elements
  const selector = isLinkDisabled.value ? `-nolink` : '';
  const currentVideoId = `video-${currentIdx}${selector}`;
  const nextVideoId = `video-${newIndex}${selector}`;
  
  const currentVideo = document.getElementById(currentVideoId) as HTMLVideoElement;
  const nextVideo = document.getElementById(nextVideoId) as HTMLVideoElement;
  
  if (isSafari.value) {
    // Safari-specific behavior: first prepare the next video
    if (nextVideo && mediaItems.value[newIndex]?.type === 'video') {
      // Reset to beginning before it's visible
      nextVideo.currentTime = 0;
    }
    
    // Pause current video
    if (currentVideo && mediaItems.value[currentIdx]?.type === 'video') {
      currentVideo.pause();
    }
    
    // Update index to trigger the transition - fade out current video
    activeIndex.value = newIndex;
    
    // After the transition completes (opacity animation finishes), play the next video
    setTimeout(() => {
      if (nextVideo && mediaItems.value[newIndex]?.type === 'video') {
        nextVideo.play().catch(e => {/* console.warn('Could not play next video:', e) */});
      }
      
      // Reset transitioning flag
      isTransitioning.value = false;
    }, 0); // Wait for opacity transition to complete
  } else {
    // Chrome/other browsers: play next video immediately for smooth transition
    if (nextVideo && mediaItems.value[newIndex]?.type === 'video') {
      // Reset to beginning and start playing before the transition
      nextVideo.currentTime = 0;
      
      // Start playing the next video immediately, before the transition
      nextVideo.play().catch(e => {/* console.warn('Could not play next video:', e) */});
    }
    
    // Pause the current video and update the index almost simultaneously
    if (currentVideo && mediaItems.value[currentIdx]?.type === 'video') {
      currentVideo.pause();
    }
    
    // Very short delay to ensure next video has started playing
    setTimeout(() => {
      activeIndex.value = newIndex;
      
      // Reset transitioning flag after a delay
      setTimeout(() => {
        isTransitioning.value = false;
      }, 2);
    }, 1);
  }
  
  // Reset the preload flag
  nextVideoPreloaded.value = false;
  
  // Preload the next video in the sequence
  const afterNextIndex = (newIndex + 1) % mediaItems.value.length;
  if (mediaItems.value[afterNextIndex]?.type === 'video' && mediaItems.value[afterNextIndex]?.videoUrl) {
    preloadNextVideo(mediaItems.value[afterNextIndex].videoUrl);
  }
}

// Function to advance to the next video when the current one completes
const advanceToNextVideo = () => {
  // console.log('[Auto-cycle] Video ended, advancing to next item');
  
  // Double-check: don't do anything if auto-cycle is disabled or we only have one item
  // Also prevent multiple transitions from happening at once
  if (!props.autoCycle || mediaItems.value.length <= 1 || isTransitioning.value) {
    return;
  }
  
  // Set the transitioning flag to true to prevent multiple calls
  isTransitioning.value = true;
  
  // Get the current index
  const currentIdx = activeIndex.value;
  
  // Advance to the next index, looping back to 0 if we reach the end
  const nextIndex = (currentIdx + 1) % mediaItems.value.length;
  
  // Get references to current and next video elements
  const selector = isLinkDisabled.value ? `-nolink` : '';
  const currentVideoId = `video-${currentIdx}${selector}`;
  const nextVideoId = `video-${nextIndex}${selector}`;
  
  const currentVideo = document.getElementById(currentVideoId) as HTMLVideoElement;
  const nextVideo = document.getElementById(nextVideoId) as HTMLVideoElement;
  
  if (isSafari.value) {
    // Safari-specific behavior: first prepare the next video
    if (nextVideo && mediaItems.value[nextIndex]?.type === 'video') {
      // Reset to beginning before it's visible
      nextVideo.currentTime = 0;
    }
    
    // Pause current video
    if (currentVideo && mediaItems.value[currentIdx]?.type === 'video') {
      currentVideo.pause();
    }
    
    // Update index to trigger the transition - fade out current video
    activeIndex.value = nextIndex;
    
    // After the transition completes (opacity animation finishes), play the next video 
    setTimeout(() => {
      if (nextVideo && mediaItems.value[nextIndex]?.type === 'video') {
        nextVideo.play().catch(e => {/* console.warn('Could not play next video:', e) */});
      }
      
      // Reset transitioning flag
      isTransitioning.value = false;
    }, 0); // Wait for opacity transition to complete
  } else {
    // Chrome/other browsers: play next video immediately for smooth transition
    if (nextVideo && mediaItems.value[nextIndex]?.type === 'video') {
      // Reset to beginning and start playing before the transition
      nextVideo.currentTime = 0;
      
      // Start playing the next video immediately, before the transition
      nextVideo.play().catch(e => {/* console.warn('Could not play next video:', e) */});
    }
    
    // Pause the current video and update the index almost simultaneously
    if (currentVideo && mediaItems.value[currentIdx]?.type === 'video') {
      currentVideo.pause();
    }
    
    // Very short delay to ensure next video has started playing
    setTimeout(() => {
      activeIndex.value = nextIndex;
      
      // Reset the transitioning flag after the delay
      setTimeout(() => {
        isTransitioning.value = false;
      }, 2);
    }, 1);
  }
  
  // Reset the preload flag when advancing to the next video
  nextVideoPreloaded.value = false;
  
  // Preload the next video in the sequence
  const afterNextIndex = (nextIndex + 1) % mediaItems.value.length;
  if (mediaItems.value[afterNextIndex]?.type === 'video' && mediaItems.value[afterNextIndex]?.videoUrl) {
    preloadNextVideo(mediaItems.value[afterNextIndex].videoUrl);
  }
};

// Safari detection helper
const isSafari = ref(false);

// Client-side initialization
onMounted(() => {
  // console.log('Component mounted, loading media data...');
  
  // Browser detection
  const ua = navigator.userAgent.toLowerCase();
  isSafari.value = ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
  
  // Instagram browser detection
  const isInstagramBrowser = 
    navigator.userAgent.includes('Instagram') || 
    window.navigator.userAgent.indexOf('Instagram') !== -1;
  
  if (isInstagramBrowser) {
    // console.log('Instagram browser detected, applying special handling');
    
    // For Instagram, we need to simulate a user interaction to bypass autoplay restrictions
    // Create an invisible button that we can programmatically click
    const tapTrigger = document.createElement('button');
    tapTrigger.style.cssText = 'position:fixed; opacity:0.01; top:0; left:0; width:1px; height:1px; z-index:-1;';
    tapTrigger.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tapTrigger);
    
    // Set a timeout to trigger the button after the page loads
    setTimeout(() => {
      // console.log('Simulating user interaction for Instagram');
      tapTrigger.click();
      
      // After the simulated click, try to play the video again
      setTimeout(() => {
        // Try both selector options to make sure we find the video
        const regularVideoId = `video-${activeIndex.value}`;
        const nolinkVideoId = `video-${activeIndex.value}-nolink`;
        
        // Try to get the video element (check both possibilities)
        let videoEl = document.getElementById(regularVideoId) as HTMLVideoElement;
        if (!videoEl) {
          videoEl = document.getElementById(nolinkVideoId) as HTMLVideoElement;
        }
        
        if (videoEl) {
          videoEl.muted = true;  // Ensure muted
          videoEl.play().catch(e => {
            // console.warn('Instagram video play failed even after tap:', e);
          });
        } else {
          // console.warn('Could not find video element with ID', regularVideoId, 'or', nolinkVideoId);
        }
        
        // Remove the temporary button
        document.body.removeChild(tapTrigger);
      }, 1);
    }, 2);
  }
  
  // Load media data on the client side as well to ensure it works
  loadMediaData().then(() => {
    // After data is loaded, play the initial video
    nextTick(() => {
      const selector = isLinkDisabled.value ? `-nolink` : '';
      const initialVideoId = `video-${activeIndex.value}${selector}`;
      const initialVideo = document.getElementById(initialVideoId) as HTMLVideoElement;
      
      if (initialVideo && mediaItems.value[activeIndex.value]?.type === 'video') {
        // console.log('Playing initial video');
        
        if (isSafari.value) {
          // In Safari, we need to reset and explicitly set the currentTime before playing
          initialVideo.currentTime = 0;
          initialVideo.play().catch(e => {/* console.warn('Could not play initial video:', e) */});
        } else {
          // For other browsers, just play normally
          initialVideo.play().catch(e => {/* console.warn('Could not play initial video:', e) */});
        }
      }
      
      // Preload the next video in the sequence
      const nextIndex = (activeIndex.value + 1) % mediaItems.value.length;
      if (mediaItems.value[nextIndex]?.type === 'video' && mediaItems.value[nextIndex]?.videoUrl) {
        preloadNextVideo(mediaItems.value[nextIndex].videoUrl);
      }
    });
  });
  
  // Ensure the media container has proper dimensions
  const mediaContainer = document.querySelector('.media-container');
  if (mediaContainer) {
    mediaContainer.classList.add('has-content');
  }
  
  // Robust approach for auto-cycling
  if (props.autoCycle) {
    // Setup a double-check timer that verifies video cycling is working
    const checkVideoInterval = setInterval(() => {
      // Get currently active video
      const selector = isLinkDisabled.value ? `-nolink` : '';
      const activeVideoId = `video-${activeIndex.value}${selector}`;
      const activeVideo = document.getElementById(activeVideoId) as HTMLVideoElement;
      
      if (activeVideo && mediaItems.value[activeIndex.value]?.type === 'video') {
        // Always force loop attribute to false
        if (activeVideo.loop) {
          activeVideo.loop = false;
        }
        
        // First detection method: video.ended property
        if (activeVideo.ended) {
          // Store current time to avoid multiple detections
          const now = Date.now();
          if (now - lastCompletionCheck > 3000) { // Longer lockout for Safari
            lastCompletionCheck = now;
            advanceToNextVideo();
          }
          return; // Exit early to prevent double-triggering
        }
        
        // Second detection method: currentTime vs duration
        if (activeVideo.currentTime > 0 && 
            activeVideo.duration > 0 &&
            Math.abs(activeVideo.currentTime - activeVideo.duration) < 0.2) {
          
          // Store current time to avoid multiple detections
          const now = Date.now();
          if (now - lastCompletionCheck > 3000) { // Longer lockout for Safari
            lastCompletionCheck = now;
            activeVideo.pause();  // Pause current video
            advanceToNextVideo();
          }
        }
      }
    }, isSafari.value ? 400 : 250); // Check less frequently on Safari
    
    // Cleanup
    onBeforeUnmount(() => {
      clearInterval(checkVideoInterval);
    });
  }
})
</script>

<style lang="scss" scoped>
.section-video {
  padding: 0;
  margin: 0;
  position: relative;
  width: 100%;
  max-width: 100%;
  height: calc(72.5vh - 70px); /* Increased height for better content display */
  transition: width 0.4s;
  overflow: hidden;
  box-sizing: border-box;
  z-index: 10;
  display: flex;
  flex-direction: column;
  background-color: var(--color-black); /* Always keep dark background */
  
  .loading-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    background-color: var(--color-black);
    
    .loading-background {
      width: 100%;
      height: 100%;
      background-color: var(--color-black);
    }
  }
  
  // Debug panel styling
  .debug-panel {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    z-index: 100;
    max-width: 250px;
    pointer-events: none;
    
    div {
      margin: 4px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .media-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--color-black);  /* Dark background for the container */
    
    .media-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      height: 100%;
      width: 100%;
      opacity: 0;
      pointer-events: none;
      /* Enhanced Safari compatibility for video transitions */
      transform: translateZ(0);
      -webkit-transform: translateZ(0);
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      will-change: opacity;
      transition: opacity .35s var(--easing-motion, ease);
      z-index: 1;
      
      &.active {
        opacity: 1;
        pointer-events: auto;
        z-index: 2;
        visibility: visible !important;
        background-color: var(--color-black);
      }
    }
    
    .media-link {
      display: block;
      height: 100%;
      width: 100%;
      transition: opacity 0.4s var(--easing-motion, ease);
      
      &.no-link {
        cursor: default;
        
        &:hover {
          opacity: 1;
        }
      }
    }

    :deep(){

      .video-element,
      .image-element {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        background-color: var(--color-black);  /* Dark background when no image is set */
      }
    }
    
  }

  // Section pagination positioning
  :deep(.section-pagination) {
    position: absolute;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    flex-direction: column;
    z-index: 15;  /* Ensure it's above the media */
    gap: 12px;    /* Increase gap for vertical dots */
  }
  
  @include lt-tablet {
    height: calc(62.5vh - 70px);
  }

  @include lt-phone {
    height: 50vh;
    
    :deep(.section-pagination) {
      right: 12px;
      
      .dot {
        width: 8px;
        height: 8px;
      }
    }
  }

  @media only screen and (max-width:400px) {
    height: 38vh;

    :deep(.section-pagination) {
      gap: 6px;
    }
  }
}
</style>