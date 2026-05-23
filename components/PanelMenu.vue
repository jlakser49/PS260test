<!-- @TODO need to add active classes and update slug actives -->
<!-- @TODO need to add logo to upper left some how or use z-index for exisiting. -->
<template>
  <nav class="panel-menu" :class="{ 'is-open': isMenuOpen }">
    <div class="panel-overlay">
      <div v-if="!menuItems?.length" class="no-items">Loading...</div>
      
      <ul v-else class="panel-list">
        <li 
          v-for="item in menuItems" 
          :key="item._uid"
          class="panel-item"
        >
          <template v-if="shouldReplaceWithVideo(item)">
            <div
              class="panel-link panel-video"
              @click="handleClick(item, $event)"
            >
              <div class="future-video"></div>
            </div>
          </template>
          <template v-else>
            <component
              :is="getLinkComponent(item)"
              v-bind="getLinkProps(item)"
              class="panel-link"
              :class="getLinkClasses(item)"
              :style="{ color: isActiveRoute(item.Link) ? item.activeColor : 'var(--color-white)' }"
              @click="handleClick(item, $event)"
            >
              <template v-if="shouldFormatLabel(item.Label)">
                <span v-html="formatLabel(item.Label)"></span>
              </template>
              <template v-else>
                {{ item.Label }}
              </template>
            </component>
          </template>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
const version = useState('version', () => 'published')
const isMenuOpen = useMenuState()
const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()
const lottie = nuxtApp.$lottie
const isHovering = ref(false)
const videoURL = ref('')

let futureAnimation = null

// Animation configuration
const initialFrame = ref(0)
const endFrame = ref(null)
const layerName = ref(null)
const initialTimePosition = ref(0.75) // Position at 0.5 seconds by default

// Create a reactive ref for animation data
const futureLogoData = computed(() => ({
  container: null,
  path: videoURL.value || '', // Fallback to original URL
  loop: true,
  autoplay: false,
  initialSegment: endFrame.value ? [initialFrame.value, endFrame.value] : undefined,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet'
  }
}))

// Fetch the video URL and settings from GlobalElements
const fetchVideoURL = async () => {
  try {
    const storyblokApi = useStoryblokApi()
    const { data } = await storyblokApi.get('cdn/stories/global/global-elements', {
      version: version.value
    });
    
    // Find the menuVideo component in the body array
    const menuVideoComponent = data.story.content.body.find(
      item => item.component === 'menuVideo'
    );
    
    if (menuVideoComponent) {
      // Get basic URL
      if (menuVideoComponent.URL) {
        videoURL.value = menuVideoComponent.URL;
      }
      
      // Get mobile-specific settings if available
      if (menuVideoComponent.mobileInitialFrame !== undefined) {
        initialFrame.value = parseInt(menuVideoComponent.mobileInitialFrame) || 0;
      }
      
      if (menuVideoComponent.mobileEndFrame) {
        endFrame.value = parseInt(menuVideoComponent.mobileEndFrame) || null;
      }
      
      if (menuVideoComponent.mobileLayerName) {
        layerName.value = menuVideoComponent.mobileLayerName;
      }
      
      if (menuVideoComponent.mobileTimePosition !== undefined) {
        initialTimePosition.value = parseFloat(menuVideoComponent.mobileTimePosition) || 0.75;
      }
    }
  } catch (error) {
    console.error('Error fetching menu video URL and settings:', error);
  }
};

// Fetch menu data
const { data, refresh } = await useAsyncData(
  'menu-items',
  async () => {
    try {
      const storyblokApi = useStoryblokApi()
      const { data } = await storyblokApi.get('cdn/stories/global/global-header', {
        version: version.value
      })
      return data.story
    } catch (error) {
      console.error('Error fetching menu items:', error)
      return null
    }
  },
  {
    watch: [version]
  }
)

// Computed properties
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
  const items = data.value?.content?.menu_items || []
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

const internalPaths = computed(() => [
  '/'
])

// Check if URL is external and should open in new tab
const isExternalUrl = (url) => {
  return url?.startsWith('http') || url?.startsWith('https')
}

// Link type determination with external URL check
const getLinkType = computed(() => (item) => {
  const link = item.Link
  if (!link) return 'external'
  
  if (link.linktype === 'story') return 'story'
  if (internalPaths.value.some(path => link.url?.includes(path))) return 'internal'
  if (isExternalUrl(link.url)) return 'external'
  
  return 'external'
})

// Dynamic component and props generation
const getLinkComponent = computed(() => (item) => {
  const type = getLinkType.value(item)
  return ['story', 'internal'].includes(type) ? 'NuxtLink' : 'a'
})

const getLinkProps = computed(() => (item) => {
  const type = getLinkType.value(item)
  const link = item.Link
  const isNewTab = isExternalUrl(link?.url)

  switch (type) {
    case 'story':
      return { 
        to: `/${link.cached_url}`,
        target: isNewTab ? '_blank' : '_self',
        rel: isNewTab ? 'noopener noreferrer' : undefined
      }
    case 'internal':
      return { 
        to: link.url,
        target: isNewTab ? '_blank' : '_self',
        rel: isNewTab ? 'noopener noreferrer' : undefined
      }
    case 'external':
      return {
        href: link?.url,
        target: isNewTab ? '_blank' : '_self',
        rel: isNewTab ? 'noopener noreferrer' : undefined
      }
    default:
      return {}
  }
})

const getLinkClasses = computed(() => (item) => ({
  [`nav-name-${formatClassName(item.Label)}`]: true,
  'external-link': isExternalUrl(item.Link?.url)
}))

// Event handlers
const handleClick = (item, event) => {
  const type = getLinkType.value(item)
  const link = item.Link
  
  if (isExternalUrl(link?.url)) {
    window.open(link?.url, '_blank', 'noopener,noreferrer')
    closeMenu()
    return
  }

  if (type === 'external') {
    handleExternalLink(link?.url)
  } else {
    event.preventDefault()
    closePanel(link?.url || `/${link?.cached_url}`)
  }
}

const closePanel = (path) => {
  if (path && !isExternalUrl(path)) {
    router.push(path)
  }
  closeMenu()
}

const handleExternalLink = (url) => {
  if (url) {
    if (isExternalUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      router.push(url)
    }
  }
  closeMenu()
}

const closeMenu = () => {
  isMenuOpen.value = false
}

// Helper functions
const formatClassName = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

const shouldFormatLabel = (label) => {
  return label?.toLowerCase() === 'to the future'
}

const formatLabel = (label) => {
  return shouldFormatLabel(label) ? label.split(' ').join('<br/>') : label
}

// Check if item should be replaced with video - either by label or by flag
const shouldReplaceWithVideo = (item) => {
  return item.replaceWithVideo === true || isWeKnowTheFuture(item.Label)
}

// Check if the label is "we know the future"
const isWeKnowTheFuture = (label) => {
  return label?.toLowerCase() === 'we know the future'
}
const isActiveRoute = (link) => {
  if (!link || (!link.url && !link.cached_url)) return false;

  let pathToCheck = link.cached_url || link.url || '';
  pathToCheck = pathToCheck.replace(/^\//, ''); // Remove leading slash
  const currentPath = route?.path?.replace(/^\//, '') || ''; // Current path without leading slash

  // console.log(`Checking active route: pathToCheck = ${pathToCheck}, currentPath = ${currentPath}`);

  // Handle root path
  if (pathToCheck === '') {
    return currentPath === '';
  }

  // Check if current path starts with the item path
  return currentPath === pathToCheck || currentPath.startsWith(`${pathToCheck}/`);
}
// Lifecycle
onMounted(async () => {
  if (window?.location?.search?.includes('_storyblok')) {
    version.value = 'draft'
  }
  
  // Fetch the video URL and settings first
  await fetchVideoURL();
  
  nextTick(() => {
    const container = document.querySelector('.panel-menu .future-video');
    if (container && videoURL.value) {
      // Initialize the animation with our settings
      futureAnimation = lottie.loadAnimation({
        ...futureLogoData.value,
        container
      });
      
      // Once loaded, set to initial frame
      futureAnimation.addEventListener('DOMLoaded', () => {
        // If we have a specific layer to control, initialize its state
        if (layerName.value) {
          const layerIndex = futureAnimation.layers.findIndex(layer => 
            layer.nm === layerName.value
          );
          
          if (layerIndex !== -1) {
            // Initialize layer to be invisible 
            futureAnimation.layers[layerIndex].ks.o.k = 0;
          }
        }
        
        // Position at the specified time point (in seconds)
        // This will override the initialFrame setting
        const fps = futureAnimation.frameRate || 100; // Get actual framerate or use 30fps default
        const frameAtTime = Math.floor(initialTimePosition.value * fps);
        futureAnimation.goToAndStop(frameAtTime, true);
      });
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
  // Your existing styles remain unchanged
  .panel-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    transform: translateX(100%);
    height: 100svh;
    background-color: var(--color-black);
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.8s var(--easing-motion),
    transform 0.8s var(--easing-motion);
    overflow: hidden;
    z-index: 300;
  
    &.is-open {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .panel-overlay {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .panel-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .panel-item {
    position: relative;
    transform: translateY(20px);
    opacity: 0;
    transition: transform 0.4s var(--easing-motion),
                opacity 0.4s var(--easing-motion);
  
    .is-open & {
      transform: translateY(0);
      opacity: 1;
    }
  
    @for $i from 1 through 15 {
      &:nth-child(#{$i}) {
        transition-delay: #{$i * 0.08}s;
      }
    }
  }
  
  .panel-link {
    text-decoration: none;
    color: var(--color-white);
    font-size: 34px;
    font-weight: 900;
    padding: 10px 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    white-space: nowrap;
    transition: color 0.4s var(--easing-motion),
                opacity 0.4s var(--easing-motion);
  
    &:hover {
      opacity: .55;
    }
    
    &.panel-video {
      padding: 1;
    }
  }
  
  .future-video {
    height: 100px;
    
    :deep(svg) {
      width: auto !important;
    }
  }
  
  .no-items {
    color: var(--color-white);
    text-align: center;
    font-size: 1.5rem;
  }

  @include phone-landscape {
    .panel-menu {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 0 40px;
      box-sizing: border-box;
    }
    .panel-link {
      font-size: 25px;
      padding: 5px 40px;
    }
    .panel-list {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
    }
  }
  </style>