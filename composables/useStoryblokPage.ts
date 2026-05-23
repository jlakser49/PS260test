// composables/useStoryblokPage.ts
export const useStoryblokPage = () => {
    const route = useRoute()
    const version = useState('version', () => 'published')
    const storyblokApi = useStoryblokApi()
    
    // Current story data for the page
    const story = useState('current-storyblok-story', () => null)
    
    // Calculate current slug based on route
    const currentSlug = computed(() => {
      // Home page
      if (route.path === '/') return 'home'
      
      // Special case for contact page - URL stays /contact but fetches contact-new
      if (route.path === '/contact') return 'contact-new'
      
      // Slug parameter (for nested routes)
      if (route.params.slug) {
        return Array.isArray(route.params.slug) 
          ? route.params.slug.join('/') 
          : route.params.slug
      }
      
      // Default: remove leading slash
      return route.path.replace(/^\//, '')
    })

    // console.log("currentSlug", currentSlug)
  
    // Legacy fetch method using useStoryblok
    const fetchStory = async () => {
      try {
        return await useStoryblok(currentSlug.value, { 
          version: version.value,
        })
      } catch (error) {
        console.error('Error fetching story:', error)
        throw createError({
          statusCode: 404,
          message: 'Page not found'
        })
      }
    }
    
    // Check if route is a dynamic route that doesn't have a direct Storyblok counterpart
    const isDynamicPage = computed(() => {
      // Check for multi-level slug routes (like /WKTF-example/amd-case-study)
      if (route.params.slug && Array.isArray(route.params.slug) && route.params.slug.length > 1) {
        return true
      }
      
      // Check for editors/[name] route
      if (route.params.name && route.path.startsWith('/editors/')) {
        return true
      }
      
      // Check for featured/[slug] route
      if (route.params.slug && route.path.startsWith('/featured/')) {
        return true
      }
      
      return false
    })
    
    // New fetch method with direct API access that updates the story ref
    const fetchCurrentPage = async () => {
      // Skip API call for dynamic pages that don't exist in Storyblok
      if (isDynamicPage.value) {
        // console.log('Skipping Storyblok fetch for dynamic page:', route.path)
        story.value = null
        return null
      }
      
      try {
        const path = currentSlug.value
        
        // Skip if no path
        if (!path) return null
        
        const { data } = await storyblokApi.get(`cdn/stories/${path}`, {
          version: version.value
        })
        
        story.value = data.story
        return data.story
      } catch (err) {
        console.error(`Error fetching Storyblok page: ${currentSlug.value}`, err)
        story.value = null
        return null
      }
    }
  
    const initStoryblokBridge = () => {
      if (window.location.search.includes('_storyblok')) {
        version.value = 'draft'
      }
    }
    
    // Initialize on client-side
    if (process.client) {
      onMounted(async () => {
        await fetchCurrentPage()
      })
      
      // Watch for route changes to update data
      watch(() => route.path, async () => {
        await fetchCurrentPage()
      })
    }
  
    return {
      currentSlug,
      version,
      fetchStory,
      initStoryblokBridge,
      fetchCurrentPage,
      story
    }
  }