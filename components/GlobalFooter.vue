<template>
  <footer class="global-footer">
    <div class="container">
      <div class="footer-content">
        <!-- Left Side Email -->
        <div class="footer-email">
          <a :href="`mailto:${footerData?.email}`" class="email-link">
            {{ footerData?.email }}
          </a>
        </div>

        <!-- Center Lottie Animation as NuxtLink -->
        <NuxtLink 
          to="/" 
          aria-label="Home" 
          class="footer-logo" 
          @mouseenter="playAnimation" 
          @click="handleClick"
        >
          <div ref="lottieContainer"></div> <!-- Lottie animation container -->
        </NuxtLink>

        <!-- Right Side Social Links -->
        <div class="right-side">
          <transition mode="out-in" name="fade">
            <div class="social-links" v-if="hideElements">
              <!-- Dynamically render social icons -->
              <template v-for="icon in footerData?.Icons" :key="icon._uid">
                <a 
                  :href="icon.link.cached_url" 
                  :aria-label="icon.platform"
                  class="social-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img 
                    :src="icon.icon.filename"
                    :alt="icon.platform"
                    class="social-icon"
                  />
                </a>
              </template>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const isMenuOpen = useMenuState();
const version = useState('version', () => 'published');

// Fetch footer data
const { data: footerStory } = await useAsyncData(
  'global-footer',
  async () => {
    try {
      const storyblokApi = useStoryblokApi();
      const { data } = await storyblokApi.get('cdn/stories/global/footer', {
        version: version.value
      });
      return data.story;
    } catch (err) {
      console.error('Error fetching footer:', err);
      return null;
    }
  }
);

// Fetch logo data
const { data: logoStory } = await useAsyncData(
  'global-logo',
  async () => {
    try {
      const storyblokApi = useStoryblokApi();
      const { data } = await storyblokApi.get('cdn/stories/global/logo', {
        version: version.value
      });
      return data.story;
    } catch (err) {
      console.error('Error fetching logo:', err);
      return null;
    }
  }
);

// Extract footer data
const footerData = computed(() => {
  return footerStory.value?.content?.body?.[0] || null;
});

// Get the logo URL from either footer or logo story
const logoUrl = computed(() => {
  // First try to get from footer data
  const footerLogo = footerData.value?.logo;
  if (footerLogo) return footerLogo;
  
  // If not in footer, try to get from logo data
  return logoStory.value?.content?.body?.[0]?.MainLogo || '';
});

// Maintain your existing logic for showing icons
const hideElements = computed(() => {
  switch (route.name) {
    case 'editors-name':
    case 'slug':
    case 'editors-name-reel':
    case 'featured-slug':
      return false;
    default:
      return true;
  }
});

// Reference to the Lottie container
const lottieContainer = ref(null);
let lottieAnimation = null; // Store the Lottie animation instance
const isPlaying = ref(false); // Track if the animation is currently playing

// Initialize Lottie animation
onMounted(() => {
  const lottie = useNuxtApp().$lottie; // Access the Lottie instance
  
  // Check if Storyblok editor is active
  if (window.location.search.includes('_storyblok')) {
    version.value = 'draft';
  }
  
  lottieAnimation = lottie.loadAnimation({
    container: lottieContainer.value, // Reference to the container
    renderer: 'svg', // Render as SVG
    loop: false, // Loop the animation
    autoplay: true, // Do not autoplay initially
    path: logoUrl.value // Use the dynamic logo URL from Storyblok
  });

  // Listen for the animation's complete event
  lottieAnimation.addEventListener('complete', () => {
    isPlaying.value = false; // Reset playing state when done
  });
});

// Play animation on hover
const playAnimation = () => {
  if (!isPlaying.value && lottieAnimation) {
    isPlaying.value = true; // Set playing state to true
    lottieAnimation.goToAndPlay(0); // Play the animation from the start
  }
};

// Handle click event
const handleClick = (event) => {
  if (isMenuOpen.value) {
    isMenuOpen.value = false;
  }
}
</script>

<style lang="scss" scoped>
.global-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 10;
  background-color: var(--color-black);
  width: 100%;
  height: 58px;
  transition: background-color 0.4s var(--easing-motion);
  z-index: 50;

  display: flex;
  align-items: center;

  .panel-is-open & {
    z-index: 300;
  }

  .page-name-editors-name-reel &,
  .page-name-featured-slug &,
  .is-slug & {
    .footer-logo {
      opacity: 0;
    }
  }


.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 12px;
  width: 100%;

  
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  // gap: 16px;
}

.footer-email {
  flex: 1;

  .email-link {
    color: var(--color-white);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 600;
    transition: color 0.4s var(--easing-motion);

    &:hover {
      color: var(--color-yellow);
    }
  }
}

.footer-logo {
  // position: absolute;
  // left: 50%;
  // transform: translateX(-50%);
  transition: opacity 0.4s var(--easing-motion);

  :deep(svg) {
    width: 60px !important;
    height: 60px !important;
  }
}

.right-side {
  flex: 1;
}

.social-links {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 16px;

  .social-link {
    img {
      width: 20px;
      height: 20px;
      transition: transform 0.4s var(--easing-motion);

      &:hover {
        transform: scale(1.05);
      }
    }

    &:hover {
      color: #666;
    }
  }
}

// Responsive Design
@media (max-width: 768px) {
  .footer-email {
    flex: 1;

    .email-link {
      font-size: 0.8rem;
      white-space: nowrap;
    }
  }
}

@include phone-landscape {
  display: none;
}

}
</style>