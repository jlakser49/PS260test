// plugins/page-transitions.js
export default defineNuxtPlugin((nuxtApp) => {
  // Detect page transitions from reel media
  nuxtApp.hook('page:start', () => {
    if (process.client) {
      // Use our composable for state management
      const { getComingFromReel, setComingFromReel } = useReferrerTracking();
      
      // Check if we're coming from a reel
      if (getComingFromReel()) {
        // Add a special class to the body for custom transitions
        document.body.classList.add('from-reel-transition');
        
        // Clear the flag
        setComingFromReel(false);
        
        // Remove the class after transition completes
        setTimeout(() => {
          document.body.classList.remove('from-reel-transition');
        }, 600); // Transition duration + buffer
      }
    }
  });
  
  // Note: Main referrer tracking is now handled by middleware/track-referrer.global.ts
  // This is just a backup in case the middleware doesn't run
  nuxtApp.hook('page:finish', () => {
    if (process.client) {
      const { setNuxtReferrer, addToPageHistory } = useReferrerTracking();
      
      // Get current route for next navigation's referrer
      const currentPath = window.location.pathname;
      
      // Don't store reel URLs as previous routes
      // This helps ensure we go back to real content pages
      if (!currentPath.match(/\/editors\/[^\/]+\/[^\/]+/) && 
          !currentPath.match(/\/featured\/[^\/]+/) &&
          !currentPath.match(/\/\w+\/[^\/]+/)) {
        
        console.log('📝 PLUGIN: Storing route as referrer:', currentPath);
        setNuxtReferrer(currentPath);
        addToPageHistory(currentPath);
      } else {
        console.log('🚫 PLUGIN: Not storing media page as referrer:', currentPath);
      }
    }
  });
});