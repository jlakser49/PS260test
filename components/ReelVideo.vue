<!-- components/ReelVideo.vue -->
<template>
    <div 
      class="reel"
      :class="{ 'first-video': isFirst, 'video-loaded': videoLoaded }"
      ref="sectionRef"
      @mouseenter="handleMouseOver(media.id)" 
      @mouseleave="handleMouseOut(media.id)"
    >
      <div :class="['reel-video-meta', {'hovered': hoverStates[media.id]}]">
        <div class="underlay" />
  
        <video
          :ref="el => videoRefs[media.id] = el"
          class="reel-video"
          :poster="thumbnailUrl"
          muted
          playsinline
          loop
          preload="none"
          @loadeddata="handleVideoLoaded"
          :src="videoSource"
        ></video>
     
        <nuxt-link
          class="reel-info" 
          @mouseover="handleMouseOver(media.id)" 
          @mouseout="handleMouseOut(media.id)"
          :to="dynamicLink"
        >
          <h2 class="reel-title">{{ formattedTitle.mainTitle }}</h2>
          <div v-if="formattedTitle.subtitle" class="reel-subtitle">
            {{ formattedTitle.subtitle }}
          </div>
          <div class="reel-director" v-if="media.credits?.director">
            Dir. {{ media.credits.director }}
          </div>
        </nuxt-link>
      </div>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    media: {
      type: Object,
      required: true
    },
    isFirst: {
      type: Boolean,
      default: false
    },
    editorName: {
      type: String,
      required: true
    },
    index: {
      type: Number,
      default: 0
    }
  })
  
  const emit = defineEmits(['hover', 'unhover'])
  
  const route = useRoute()
  
  const videoRefs = ref({})
  const hoverStates = ref({})
  const sectionRef = ref(null)
  const isMobile = ref(false)
  const videoLoaded = ref(false)
  
  // Handle video loaded event
  const handleVideoLoaded = () => {
    videoLoaded.value = true
  }
  
  // Check if the device is mobile
  const checkMobile = () => {
    if (process.client) {
      const isDetectedMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                      (window.innerWidth <= 767);
      
      isMobile.value = isDetectedMobile;
      
      // On mobile, we want to immediately set videoLoaded to true
      // to prevent the visibility:hidden from hiding the video
      if (isDetectedMobile && !videoLoaded.value) {
        videoLoaded.value = true;
      }
    }
  }
  
  
  const handleMouseOver = (id) => {
    // Skip setting hover state on mobile devices
    if (isMobile.value) return;
    
    hoverStates.value[id] = true
    videoRefs.value[id]?.play()
    emit('hover')
  }
  
  const handleMouseOut = (id) => {
    // Skip clearing hover state on mobile devices
    if (isMobile.value) return;
    
    hoverStates.value[id] = false
    videoRefs.value[id]?.pause()
    emit('unhover')
  }
  
  const formatMainTitle = (title) => {
  if (!title) {
    return { mainTitle: '', subtitle: null };
  }

  // Use the browser's HTML parser to decode entities on client side
  // For SSR, use manual replacement
  let normalizedTitle = process.client
    ? (function() {
        const div = document.createElement('div');
        div.innerHTML = title;
        return div.textContent || div.innerText || title;
      })()
    : title.replace(/&#39;/g, "'").replace(/&#039;/g, "'").replace(/&apos;/g, "'")
           .replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&amp;/g, '&');

  // Now normalize quotes
  normalizedTitle = normalizedTitle
    .replace(/"|"/g, '"')  // Replace smart double quotes with straight quotes
    .replace(/'|'/g, "'")  // Replace smart single quotes with straight single quotes
    .replace(/[""]/g, '"')  // Ensure all double quotes are straight
    .replace(/['']/g, "'")  // Ensure all single quotes are straight
    .replace(/\s+/g, ' ');  // Normalize multiple spaces to single spaces
  
  // Try a more flexible pattern that allows for various spacing
  // Only match actual quotes (double quotes), not apostrophes
  const pattern = /^(.*?)\s*["](.*?)["]\s*$/;
  const match = normalizedTitle.match(pattern);
  
  if (match) {
    return {
      mainTitle: match[1].trim(),
      subtitle: match[2].trim()
    };
  }
  
  // If no match, let's try a more generic approach to find any quotes (only double quotes)
  const quoteMatch = normalizedTitle.match(/["](.*?)["]/);
  if (quoteMatch) {
    const quotedText = quoteMatch[1];
    const beforeQuote = normalizedTitle.substring(0, normalizedTitle.indexOf(quoteMatch[0])).trim();

    if (beforeQuote) {
      return {
        mainTitle: beforeQuote,
        subtitle: quotedText
      };
    }
  }
  
  return {
    mainTitle: normalizedTitle.trim(),
    subtitle: null
  };
};
  
  const formattedTitle = computed(() => {
    return formatMainTitle(props.media.title)
  })
  
  const formatSlug = (title) => {
  if (!title) return '';

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
    .replace(/^-+|-+$/g, '')          // Remove leading/trailing hyphens
};
  
const videoSource = computed(() => {
  // Check if media has alternate_formats
  if (props.media.alternate_formats?.format?.file) {
    return props.media.alternate_formats.format.file;
  }
  
  // If no alternate format, use the default media_file
  return props.media.media_file;
});

const dynamicLink = computed(() => {
  const currentSlug = route.path.split('/')[1]; // Gets the first part of the path
  const formattedSlug = formatSlug(props.media.title);
  if (currentSlug === 'editors') {
    return `/editors/${props.editorName}/${formattedSlug}`;
  }
  // Build the path string directly instead of using named routes
  return `/${currentSlug}/${formattedSlug}`;
});

// Debug thumbnail URL
const thumbnailUrl = computed(() => {
  if (!props.media.thumbnail) {
    console.warn('No thumbnail for media:', props.media.id, props.media.title);
    return null;
  }
  
  // console.log('Thumbnail URL for', props.media.title, ':', props.media.thumbnail);
  return props.media.thumbnail;
});

  onMounted(() => {
    // Check if the device is mobile on mount
    checkMobile();
    
    // Check thumbnail availability on mount
    // if (thumbnailUrl.value) {
    //   console.log('Thumbnail available on mount:', thumbnailUrl.value);
    // } else {
    //   console.warn('No thumbnail available on mount for:', props.media.title);
    // }
    
    // On mobile devices, mark as loaded immediately
    if (isMobile.value) {
      videoLoaded.value = true;
    }
    
    // Add resize listener to update mobile status when orientation changes
    if (process.client) {
      window.addEventListener('resize', checkMobile);
    }
    
    // Load video only when it becomes visible
    const loadVideoOnDemand = () => {
      if (videoRefs.value[props.media.id]) {
        const videoEl = videoRefs.value[props.media.id];
        
        // Always force-set the poster attribute, regardless of platform
        // This ensures the poster is set even if binding didn't work
        if (thumbnailUrl.value) {
          // Force the poster to be set programmatically
          videoEl.setAttribute('poster', thumbnailUrl.value);
          
          // Check if the poster was set correctly
          // console.log('Setting poster programmatically:', thumbnailUrl.value);
          // console.log('Current poster attribute:', videoEl.getAttribute('poster'));
          
          // Re-trigger poster display by reinitializing the video
          const currentSrc = videoEl.src;
          videoEl.src = '';
          setTimeout(() => {
            videoEl.src = currentSrc;
            videoEl.load();
          }, 10);
        } else {
          // console.log('No thumbnail available for media ID:', props.media.id);
        }
        
        // Start loading the video
        videoEl.load();
        
        // If we haven't already marked it as loaded and it's a mobile device
        if (!videoLoaded.value && isMobile.value) {
          // For mobile - mark as loaded immediately since we have a poster
          // This prevents waiting for video loading on mobile
          videoLoaded.value = true;
        }
      }
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Load video on demand regardless of platform
          loadVideoOnDemand();
          
          // Function to show the element with delay
          const showElement = () => {
            // Base delay of 0.4s plus 0.2s for each reel index
            const delay = 0.4 + (props.index * 0.2);
            
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transition = 'opacity 0.4s ease-in-out';
            }, delay * 200);
          };
          
          if (videoLoaded.value) {
            // If already loaded (or on mobile), show immediately
            showElement();
          } else {
            // For desktop, wait for video to actually load
            const unwatch = watch(videoLoaded, (isLoaded) => {
              if (isLoaded) {
                showElement();
                unwatch(); // Clean up the watcher
              }
            });
          }
        }
      });
    }, { threshold: 0.1 });
    
    if (sectionRef.value) {
      observer.observe(sectionRef.value);
    }
    
    // Clean up event listener on unmount
    onBeforeUnmount(() => {
      if (process.client) {
        window.removeEventListener('resize', checkMobile);
      }
    });
  });

  defineExpose({
    videoRefs,
    sectionRef,
    hoverStates,
    videoLoaded
  })
  </script>
  
  <style lang="scss" scoped>

.reel {
  opacity: 0;
  
  // Initially hide the video on desktop only
  @media (min-width: 768px) {
    &:not(.video-loaded) .reel-video {
      visibility: hidden;
    }
    
    &.video-loaded .reel-video {
      visibility: visible;
    }
  }
  
  // Always visible on mobile
  @include lt-phone {
    .reel-video {
      visibility: visible !important;
    }
  }
  
  .reel-video-meta {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    &.hovered {
      color: var(--color-white);
      .reel-title,
      .reel-subtitle,
      .reel-director {
        opacity: 1 !important;
        transform: translate(0%, 0%) !important;
      }

      .underlay {
        background-color: rgba(0,0,0, 0) !important;
      }
    }
  }
  
  .reel-video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.2); /* Fallback background color */
  }
  
  .reel-info {
    position: absolute;
    bottom: 0;
    left: 0;
    transform: translate(0%, 0%);
    text-align: left;
    color: var(--color-white);
    z-index: 10;
    padding: 25px;
    border-radius: 8px;
    line-height: 1.1;
    font-size: 45px;
    text-decoration: none;
  
    height: 100%;
    box-sizing: border-box;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-start;
  
    
  }

 
  
  .reel-title {
    opacity: 0;
    transform: translateY(20px);
    margin: 0;
    font-weight: 900;
    font-size: calc(1rem + ((1vw - 3.2px) * 1.9573));
    min-height: 0vw;
    line-height: 1;
    transition: color 0.4s var(--easing-motion),
                transform 0.4s var(--easing-motion),
                opacity 0.4s var(--easing-motion);
  }
  
  .reel-subtitle {
    opacity: 0;
    transform: translateY(20px);
    font-size: calc(.5rem + ((1vw - 3.2px) * 1.9573));
    min-height: 0vw;
    margin-top: 2px;
    font-weight: 900;
    transition: color 0.4s var(--easing-motion),
                transform 0.4s var(--easing-motion),
                opacity 0.4s var(--easing-motion);
  }
  
  .reel-director {
    opacity: 0;
    transform: translateY(20px);
    font-size: calc(.2rem + ((1vw - 3.2px) * 1.6014));
    min-height: 0vw;
    margin-top: 4px;
    font-weight: 900;
    transition: color 0.4s var(--easing-motion),
                transform 0.4s var(--easing-motion),
                opacity 0.4s var(--easing-motion);
  }
  
  .underlay {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,.5);
    z-index: 5;
    transition: background-color 0.4s var(--easing-motion);
  
  }
  
  @include lt-phone {
    .reel-info {
      // padding: 0.5rem;
    }
    .underlay {
      background-color: rgba(0,0,0,.4);
    }
    .reel-title {
      font-size: 24px;
    }
    .reel-director {
      font-size: 11px;
      margin-top: 4px;
    }
    .reel-subtitle {
      margin-top: 3px;
      font-size: 14px;
    }
    .reel-title,
    .reel-subtitle,
    .reel-director {
      opacity: 1;
      transform: translateY(0);
    }
    
    // Prevent hover effects on mobile
    .reel-video-meta.hovered {
      // Reset hover styles for mobile
      .underlay {
        // background-color: rgba(0,0,0,.4) !important;
      }
    }
  }
}
</style>