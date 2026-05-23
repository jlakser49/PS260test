<template>
<div 
  class="sticky-video-container" 
  ref="container" 
  :class="{ 'dimmed': isDimmed }" 
  :style="{ display: componentOpacity <= 0.05 ? 'none' : 'block' }"
  @mouseenter="onMouseEnter"
  @mouseleave="onMouseLeave"
>
    <div class="sticky-video" ref="videoContainer">
      <video 
        ref="videoPlayer"
        class="video-element"
        :src="videoPath"
        :poster="placeholderImage"
        muted
        playsinline
        loop
        autoplay
        @loadeddata="onVideoLoaded"
        @canplay="onCanPlay"
      />
      
      <div class="underlay">
        <h1
          class="name"
          :style="{ 
            viewTransitionName: `editor-${name.toLowerCase().replace(/\s+/g, '-')}` 
          }"
          v-html="name"
        />
      </div>

      <button 
        ref="volumeButton"
        class="volume-control"
        @click="toggleMute"
        :aria-label="isMuted ? 'Unmute video' : 'Mute video'"
      >
        <span class="icon" v-html="isMuted ? muteIcon : unmuteIcon" />
        <div class="volume-text-container">
          <span class="volume-text" :class="{ 'active': !isMuted }">ON</span>
          <span class="volume-divider">/</span>
          <span class="volume-text" :class="{ 'active': isMuted }">OFF</span>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  videoPath: {
    type: String,
    required: true
  },
  placeholderImage: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  isDimmed: {
    type: Boolean,
    default: false
  }
});

const container = ref(null);
const videoContainer = ref(null);
const videoPlayer = ref(null);
const volumeButton = ref(null);
const isMuted = ref(true);
const isVideoReady = ref(false);
const componentOpacity = ref(1);
const isHovering = ref(false);

// Watch for changes in the isDimmed prop
watch(() => props.isDimmed, (isDimmed) => {
  if (isDimmed && videoPlayer.value) {
    videoPlayer.value.pause();
  } else if (!isDimmed && videoPlayer.value && isVideoReady.value) {
    forcePlayWithMute();
  }
});

// Force play with mute
const forcePlayWithMute = async () => {
  if (videoPlayer.value) {
    try {
      // Use the same state for muted preference regardless of device
      if (!isMuted.value) {
        // If user has unmuted, keep it unmuted
        videoPlayer.value.muted = false;
        
        // For unmuted videos, only play if the user is hovering over it
        if (!isHovering.value) {
          // Return early without playing if user isn't hovering and video is unmuted
          return;
        }
      } else {
        // Default to muted if not explicitly unmuted
        videoPlayer.value.muted = true;
      }
      
      // Make sure loop is enabled
      videoPlayer.value.loop = true;
      
      await videoPlayer.value.play();
    } catch (err) {
      console.log('Force play failed:', err);
    }
  }
};

const playVideo = async () => {
  if (videoPlayer.value && isVideoReady.value) {
    await forcePlayWithMute();
  }
};

const toggleMute = () => {
  if (videoPlayer.value) {
    isMuted.value = !isMuted.value;
    videoPlayer.value.muted = isMuted.value;
    
    // If unmuted, check hover state
    if (!isMuted.value) {
      // Only play if user is hovering
      if (isHovering.value) {
        videoPlayer.value.play();
      } else {
        videoPlayer.value.pause();
      }
    } else {
      // If muted, always play
      videoPlayer.value.play();
    }
  }
};

// Mouse enter handler
const onMouseEnter = () => {
  isHovering.value = true;
  
  // If the video is not muted, resume playback
  if (videoPlayer.value && !isMuted.value) {
    videoPlayer.value.play();
  }
};

// Mouse leave handler
const onMouseLeave = () => {
  isHovering.value = false;
  
  // If the video is not muted, pause it when cursor leaves
  if (videoPlayer.value && !isMuted.value) {
    videoPlayer.value.pause();
  }
};

const onCanPlay = () => {
  isVideoReady.value = true;
  playVideo();
};

const onVideoLoaded = () => {
  isVideoReady.value = true;
  playVideo();
};

// Handle page visibility changes
const handleVisibilityChange = () => {
  if (document.hidden) {
    if (videoPlayer.value) {
      videoPlayer.value.pause();
    }
  } else {
    // When tab becomes visible again, ensure loop is enabled and restore state
    if (videoPlayer.value) {
      videoPlayer.value.loop = true;
      forcePlayWithMute();
    }
  }
};


// Route change handler
const router = useRouter();
if (router) {
  router.beforeEach((to, from, next) => {
    forcePlayWithMute();
    next();
  });
}

// Watch for video path changes
watch(() => props.videoPath, () => {
  isVideoReady.value = false;
  nextTick(async () => {
    if (videoPlayer.value) {
      videoPlayer.value.load();
      await forcePlayWithMute();
    }
  });
});

// Use throttled/debounced scroll handler for better performance
const handleScroll = () => {
  if (process.client && container.value) {
    // Use requestAnimationFrame for smoother updates
    requestAnimationFrame(() => {
      const scrollPosition = window.scrollY;
      const fadeThreshold = window.innerHeight * 0.65;
      
      if (scrollPosition >= fadeThreshold) {
        componentOpacity.value = 0;
      } else {
        const fadeStart = window.innerHeight * 0.65;
        if (scrollPosition > fadeStart) {
          const fadeRange = fadeThreshold - fadeStart;
          const fadeAmount = (scrollPosition - fadeStart) / fadeRange;
          componentOpacity.value = 1 - Math.min(fadeAmount, 1);
        } else {
          componentOpacity.value = 1;
        }
      }
    });
  }
};

onMounted(() => {
  if (process.client) {

    // Create a passive event listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });

  

    // Call this once to set initial state
    handleScroll();


    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Force initial play
    forcePlayWithMute();

    // Intersection Observer setup
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    // Store the observer in a ref for proper cleanup
    const videoObserver = ref(null);
    
    // Create and store the observer
    videoObserver.value = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // When it becomes visible again, restore previous state and play
          if (videoPlayer.value) {
            // Ensure loop is always enabled
            videoPlayer.value.loop = true;
            forcePlayWithMute();
          }
        } else {
          if (videoPlayer.value) {
            videoPlayer.value.pause();
          }
        }
      });
    }, options);

    if (videoPlayer.value) {
      videoObserver.value.observe(videoPlayer.value);
    }
    
    // Set up fade-in intersection observer
    if (videoPlayer.value) {
      // Initially set video element to invisible
      videoPlayer.value.style.opacity = '0';
      
      const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Apply a delay before fading in
            setTimeout(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transition = 'opacity 0.5s ease-in-out';
            }, 400); // 0.4s delay
          }
        });
      }, { threshold: 0.1 });
      
      fadeObserver.observe(videoPlayer.value);
    }

    // Start playing as soon as possible
    if (videoPlayer.value?.readyState >= 3) {
      // Ensure loop is enabled
      if (videoPlayer.value) {
        videoPlayer.value.loop = true;
      }
      forcePlayWithMute();
    }

    // Cleanup
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);

        // In your onBeforeUnmount, add:
    window.removeEventListener('scroll', handleScroll);

      if (videoObserver.value) {
        videoObserver.value.disconnect();
        videoObserver.value = null;
      }
      if (videoPlayer.value) {
        videoPlayer.value.pause();
        videoPlayer.value.src = '';
        videoPlayer.value.load();
      }
    });
  }
});


// SVG icons for mute/unmute
const muteIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M23 9L17 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M17 9L23 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const unmuteIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
</script>

 
  <style lang="scss" scoped>
  .sticky-video-container {
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 10;
    box-sizing: border-box;
    top: 0;
    overflow: hidden;
    
    &.dimmed .video-element {
      // opacity: 0.65;
    }

    .has-scrolled & {
      .sticky-video .underlay {
        padding-top: 0;
      }
    }

    .sticky-video {
      width: 100%;
      height: 350px;
      overflow: hidden;
      transition: height 0.4s var(--easing-motion),
                  opacity 0.4s var(--easing-motion);
      display: flex;

      .video-element {
        object-fit: cover;
        flex: 1;
        min-width: 100%;
        transition: opacity 0.4s var(--easing-motion);
      }
      
      .underlay {
        position: absolute;
        left: 0;
        top: 0;

        display: flex;
        justify-content: flex-end;
        align-items: center;
        width: 100%;
        height: 100%;

        padding-right: 6.5vw;
        padding-top: var(--unit-header-height);

        background: rgba(0,0,0,.25);
        box-sizing: border-box;
        transition: padding-top .4s var(--easing-motion);
        
        .name {
          position: fixed;
          padding-left: 50px;
          z-index: 30;
          color: var(--color-yellow);
          font-size: 6.5vw;
          font-family: 'PS260', sans-serif;
          font-weight: normal;
          margin: 0;
          transition: opacity .4s var(--easing-motion), color .4s var(--easing-motion);
        }
      }

      .volume-control {
        position: absolute;
        bottom: .25rem;
        right: .5rem;
        background: transparent;
        border: none;
        padding: 50px 5px 0px 50px;
        color: var(--color-white);
        letter-spacing: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.4s var(--easing-motion);
        z-index: 10;
        gap: 5px;
        
        &:hover {
          .icon {
            // color: var(--color-yellow);
          }
        }

        .icon {
          color: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.4s var(--easing-motion);
        }

        .volume-text {
          color: var(--color-white);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          transition: color 0.4s var(--easing-motion);

          &.active {
            color: var(--color-yellow);
          }
        }
      }
    }

    @include gt-cinema {
      .sticky-video {
        height: 450px;
      }
    }
  
    @include lt-tablet {
      .sticky-video {
        height: 250px;
      }
    }
  }
    </style>