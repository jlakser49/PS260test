<template>
  <nuxt-link 
    ref="containerRef"
    to="/"
    v-if="logo"
    class="logo-cycler"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick">
    <div
      class="logo-image main-logo"
      :class="{
        'hidden': isHovering,
        'bounce-return': isReturning && !isHovering,
        'loaded': isMainLogoLoaded
      }"
    ></div>
    <div

      class="hover-video"
      :class="{ 'visible': isHovering }"
    ></div>
  </nuxt-link>
</template>

<script setup>
const nuxtApp = useNuxtApp()
const lottie = nuxtApp.$lottie

const version = useState('version', () => 'published')
const { isMobile } = useBreakpoint()
const isMenuOpen = useMenuState()

const isHovering = ref(false)
const isReturning = ref(false)
const containerRef = ref(null)
const isPlaying = ref(false)
const isAnimationPlaying = ref(false)
const isMainLogoLoaded = ref(false)
const route = useRoute()

const isHomePage = computed(() => route.path === '/')

let mainAnimation = null
let hoverAnimation = null

const logo = await useStoryblok('global/logo', { 
  version: version.value 
})

const mainLogoData = {
  path: logo.value?.content?.body?.[0]?.MainLogo || "",
  container: null,
  loop: false,
  autoplay: false,
}

// Create a reactive computed property for the hover logo path
const hoverLogoPath = computed(() => {
  return isHomePage.value && logo.value?.content?.body?.[0]?.homepageHoverLogo
    ? logo.value?.content?.body?.[0]?.homepageHoverLogo
    : logo.value?.content?.body?.[0]?.HoverVideo || ""
})

const hoverLogoData = {
  container: null,
  path: hoverLogoPath.value,
  loop: true,
  autoplay: false,
}

const playAnimation = () => {
  if (mainAnimation && !isAnimationPlaying.value) {
    isAnimationPlaying.value = true
    isPlaying.value = true
    mainAnimation.goToAndPlay(0)
  }
}

const handleClick = (event) => {
  if (isMenuOpen.value) {
    isMenuOpen.value = false
  }
  if (isMobile.value) {
    playAnimation()
  }
}

const handleMouseEnter = () => {
  if (isMobile.value) return
  
  // Use the same hover behavior on all pages
  startAnimation()
}

const startAnimation = () => {
  // Immediately switch to hover state without transition
  isHovering.value = true
  if (hoverAnimation) {
    hoverAnimation.goToAndPlay(0)
  }
}

const stopAnimation = () => {
  // Immediately switch back to normal state without transition
  isHovering.value = false
  isReturning.value = true
  if (hoverAnimation) {
    hoverAnimation.pause()
  }
  
  // Keep the bounce return animation
  setTimeout(() => {
    isReturning.value = false
  }, 400)
}

const handleMouseLeave = () => {
  if (isMobile.value) return
  
  // Always use the same behavior on all pages
  stopAnimation()
}

const initializeLottie = () => {
  // Wait for next tick to ensure the component is fully mounted
  nextTick(() => {
    // Check if containerRef exists and has an $el property
    if (containerRef.value && containerRef.value.$el) {
      // Initialize main logo animation using the DOM element
      const mainLogoElement = containerRef.value.$el.querySelector('.main-logo')
      if (mainLogoElement) {
        mainLogoData.container = mainLogoElement
        mainAnimation = lottie.loadAnimation(mainLogoData)

        // Wait for DOMLoaded event to ensure SVG is rendered before setting frame
        mainAnimation.addEventListener('DOMLoaded', () => {
          mainAnimation.goToAndStop(0, true)
          // Force repaint for Chrome
          mainLogoElement.offsetHeight
          isMainLogoLoaded.value = true

          // Trigger bounce animation after logo is loaded
          isReturning.value = true
          setTimeout(() => {
            isReturning.value = false
          }, 400)
        })

        mainAnimation.addEventListener('complete', () => {
          isPlaying.value = false
          isAnimationPlaying.value = false; // Reset when animation completes
        })
      }

      // Initialize hover animation for all pages
      const hoverElement = containerRef.value.$el.querySelector('.hover-video')
      if (hoverElement) {
        hoverLogoData.container = hoverElement
        hoverAnimation = lottie.loadAnimation(hoverLogoData)
        hoverAnimation.goToAndStop(0, true)
      }
    }
  })
}

// Watch for route changes to update the hover animation
watch(() => route.path, (newPath) => {
  // First destroy existing hover animation
  if (hoverAnimation) {
    hoverAnimation.destroy()
    hoverAnimation = null
  }
  
  // Reinitialize hover animation with current path based on homepage status
  nextTick(() => {
    if (containerRef.value && containerRef.value.$el) {
      const hoverElement = containerRef.value.$el.querySelector('.hover-video')
      if (hoverElement) {
        const updatedHoverLogoData = {
          container: hoverElement,
          path: hoverLogoPath.value,
          loop: true,
          autoplay: false,
        }
        hoverAnimation = lottie.loadAnimation(updatedHoverLogoData)
        hoverAnimation.goToAndStop(0, true)
      }
    }
  })
}, { immediate: false })

onMounted(() => {
  if (window.location.search.includes('_storyblok')) {
    version.value = 'draft'
  }

  nextTick(() => {
    initializeLottie()

    // We can keep the initial animation on first page load if desired
    // This is now independent of whether it's the homepage
    if (!sessionStorage.getItem('logoPlayed')) {
      setTimeout(() => {
        if (mainAnimation && isMainLogoLoaded.value) {
          mainAnimation.goToAndPlay(0)
          isAnimationPlaying.value = true
          isPlaying.value = true
        }
        sessionStorage.setItem('logoPlayed', 'true')
      }, 2000)
    }
  })
})

// Clean up animations and event listeners
onBeforeUnmount(() => {
  if (mainAnimation) {
    mainAnimation.removeEventListener('complete')
    mainAnimation.destroy()
    mainAnimation = null
  }
  if (hoverAnimation) {
    hoverAnimation.destroy()
    hoverAnimation = null
  }
})
</script>

<style lang="scss" scoped>
.logo-cycler {
  position: fixed;
  top: 0;
  width: 145px;
  height: 145px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index:400;
  transition: width 0.4s var(--easing-motion),
                  height 0.4s var(--easing-motion);
                  
.logo-image,
.hover-video {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;


  :deep(svg) {
    width: 100% !important;
    height: 100% !important;
  }
}

.hover-video {
  :deep(svg) {
    width: 100% !important;
    height: 100% !important;
  }
}

.main-logo {
  opacity: 0;
  transform: scale(1);
  transition: opacity 0.3s ease;

  &.loaded {
    opacity: 1;
  }

  &.hidden {
    opacity: 0;
    transform: scale(0.8);
  }

  &.bounce-return {
    animation: bounceReturn .4s cubic-bezier(0.36, 0, 0.66, 1.5) forwards;
  }
}

.hover-video {
  opacity: 0;
  /* Transition removed */
  
  &.visible {
    opacity: 1;
  }
}

@keyframes bounceReturn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  70% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@include lt-phone {

    width: 125px;
    height: 125px;

}
}
</style>