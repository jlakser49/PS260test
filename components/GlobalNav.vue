<template>
  <nav class="global-nav">
    <template v-if="pending">
      <div class="nav-placeholder"></div>
    </template>
    <template v-else>
      <ul v-if="menuItems.length" class="nav-list">
        <li 
          v-for="item in menuItems" 
          :key="item._uid"
          class="nav-item"
        >
          <template v-if="item.Link?.linktype === 'story'">
            <nuxt-link
              class="nav-link"
              :to="'/' + item.Link.cached_url"
              :class="[
                getLinkClass(item.Label),
                { 'has-custom-color': item.activeColor || '' },
                { 'is-active': isActiveRoute(item.Link) || (isFeaturedRoute && item.Label === 'Editors') }
              ]"
              :style="{
                '--link-active-color': item.activeColor || 'var(--color-white)'
              }"
            >
              {{ item.Label }}
            </nuxt-link>
          </template>

          <template v-else-if="shouldReplaceWithVideo(item)">
            <nuxt-link
              class="nav-link nav-video"
              :to="item.Link?.url"
              :target="isExternalLink(item.Link) ? '_blank' : '_self'"
              @mouseenter="handleMouseEnter"
              @mouseleave="handleMouseLeave"
              :style="{
                '--link-active-color': item.activeColor || 'var(--color-white)'
              }"
            >
              <div
                class="future-video"
              ></div>
            </nuxt-link>
          </template>

          <template v-else-if="isInternalPath(item.Link?.url)">
            <NuxtLink 
              class="nav-link" 
              :target="isExternalLink(item.Link) ? '_blank' : '_self'"
              :to="item.Link.url"
              :class="[
                getLinkClass(item.Label),
                { 'has-custom-color': item.activeColor || '' },
                { 'is-active': isActiveRoute(item.Link) || (isFeaturedRoute && item.Label === 'Editors') }
              ]"
              :style="{
                '--link-active-color': item.activeColor
              }"
            >
              {{ item.Label }}
            </NuxtLink>
          </template>

          <template v-else>
            <a 
              class="nav-link" 
              :href="item.Link?.url"
              :target="isExternalLink(item.Link) ? '_blank' : '_self'"
              :class="{ 'is-active': isFeaturedRoute && item.Label === 'Editors' }"
            >
              {{ item.Label }}
            </a>
          </template>
        </li>
      </ul>
    </template>
  </nav>
</template>

<script setup>
const route = useRoute()
const version = useState('version', () => 'published')
const storyblokApi = useStoryblokApi()

const videoRef = ref(null)
const nuxtApp = useNuxtApp()
const lottie = nuxtApp.$lottie
const isHovering = ref(false)
const videoURL = ref('')

let futureAnimation = null

// Create a reactive ref for animation data
const futureLogoData = computed(() => ({
  container: null,
  path: videoURL.value || '', // Fallback to original URL
  loop: true,
  autoplay: false,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet'
  }
}))

const handleMouseEnter = () => {
  isHovering.value = true
  if (futureAnimation) {
    futureAnimation.goToAndPlay(0)
  }
}

const handleMouseLeave = () => {
  isHovering.value = false
  if (futureAnimation) {
    futureAnimation.pause()
  }
}

// Helper functions
const isInternalPath = (url) => {
  if (!url) return false
  const internalPaths = ['/']
  return internalPaths.some(path => url.includes(path))
}

const isExternalLink = (link) => {
  return link?.linktype === 'url' && 
         typeof link?.url === 'string' && 
         link.url.startsWith('http') &&
         !link.url.startsWith('/')
}

// Check if item should be replaced with video - either by label or by flag
const shouldReplaceWithVideo = (item) => {
  return item.replaceWithVideo === true || isWeKnowTheFuture(item.Label)
}

// Keep original function for backward compatibility
const isWeKnowTheFuture = (label) => {
  return label?.toLowerCase() === 'we know the future'
}

const isFeaturedRoute = computed(() => {
  return route.path.startsWith('/featured/');
});

const getClassFromTitle = (title) => {
  if (!title) return ''
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

const getLinkClass = (label) => `nav-name-${getClassFromTitle(label)}`

// Fetch the video URL from GlobalElements
const fetchVideoURL = async () => {
  try {
    const { data } = await storyblokApi.get('cdn/stories/global/global-elements', {
      version: version.value
    });
    
    // Find the menuVideo component in the body array
    const menuVideoComponent = data.story.content.body.find(
      item => item.component === 'menuVideo'
    );
    
    if (menuVideoComponent && menuVideoComponent.URL) {
      videoURL.value = menuVideoComponent.URL;
      // console.log('Menu video URL loaded:', videoURL.value);
    }
  } catch (error) {
    console.error('Error fetching menu video URL:', error);
  }
};

// Data fetching with proper loading state
const { data: story, pending } = await useAsyncData(
  'global-header',
  async () => {
    try {
      const { data } = await storyblokApi.get('cdn/stories/global/global-header', {
        version: version.value
      })
      return data.story
    } catch (error) {
      console.error('Error fetching menu:', error)
      return null
    }
  },
  {
    server: true,
    initial: null
  }
)

// Computed property
const aiMenuItem = {
  _uid: 'ai-menu-item',
  Label: 'AI',
  Link: {
    linktype: 'url',
    url: '/ai'
  },
  activeColor: 'var(--color-white)'
}

const menuItems = computed(() => {
  const items = story.value?.content?.menu_items || []
  const hasAi = items.some(item => item.Label?.toLowerCase() === 'ai')
  if (hasAi) {
    return items
  }

  const contactIndex = items.findIndex(item => item.Label?.toLowerCase() === 'contact')
  if (contactIndex >= 0) {
    const nextItems = [...items]
    nextItems.splice(contactIndex, 0, aiMenuItem)
    return nextItems
  }

  return [...items, aiMenuItem]
})

const isActiveRoute = (item) => {
  if (!item?.url && !item?.cached_url) return false
  
  // Get the path to check, handling both URL and cached_url cases
  let pathToCheck = item.cached_url || item.url || ''
  
  // Remove leading slash for comparison
  pathToCheck = pathToCheck.replace(/^\//, '')
  
  // Get current path without leading slash
  const currentPath = route.path.replace(/^\//, '')

  // Handle root path
  if (pathToCheck === '') {
    return currentPath === ''
  }

  // Check if current path starts with the item path
  return currentPath === pathToCheck || currentPath.startsWith(`${pathToCheck}/`)
}

// Watch for Storyblok preview mode
onMounted(async () => {
  if (window?.location?.search?.includes('_storyblok')) {
    version.value = 'draft'
  }
  
  // Fetch the video URL first
  await fetchVideoURL();
  
  nextTick(() => {
    const container = document.querySelector('.future-video');
    if (container) {
      futureAnimation = lottie.loadAnimation({
        ...futureLogoData.value,
        container
      });
      futureAnimation.goToAndStop(0, true);
    }
  });
})

onBeforeUnmount(() => {
  if (futureAnimation) {
    futureAnimation.destroy()
  }
})
</script>

<style scoped lang="scss">
.global-nav {
  position: relative;
  z-index: 5;
  margin-left: auto;
  overflow: hidden;

  .is-slug & {
    .nav-link {
      &:not(.is-active) {
        opacity: .25;
      }
      &:hover {
        opacity: 1;
      }
    }
  }


.future-video {
  height: 55px;

  :deep(svg) {
    width: auto !important;
  }
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  justify-content: flex-end;
}

.nav-item {
  position: relative;
}

.nav-link {
  text-decoration: none;
  color: var(--color-white);
  padding: 0 22px;
  height: var(--unit-header-height-small);
  line-height: 1;
  font-weight: 900;

  display: flex;
  justify-content: center;
  align-items: center;
  transition: 
    color 0.4s var(--easing-motion),
    opacity 0.4s var(--easing-motion),
    transform 0.4s var(--easing-motion);

    &.router-link-active,
    &.is-active,
    &:hover {
      color: var(--link-active-color);
    }

    &:hover {
      transform: scale(1.05);
    }

  &.nav-video {
    padding: 0;

    &:hover {
      opacity: 1;
    }  
  }

  &.nav-name-ai.is-active {
    color: var(--color-white);
  }

  &.nav-name-ai:hover {
    color: var(--color-blue);
  }

  @include lt-phone {
    display: none;
  }
}

.nav-placeholder {
  height: var(--unit-header-height-small);
}
}
</style>