// middleware/track-referrer.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  // Get our composable for referrer tracking
  const { 
    setNuxtReferrer, 
    addToPageHistory, 
    setCameFromHome
  } = useReferrerTracking();
  
  // Only run tracking on client-side
  if (process.client) {
    // Store origin information
    const currentPath = from.path;
    const isMediaPage = isMediaRoute(currentPath);
    
    // Don't store media pages as referrers, only content pages
    if (!isMediaPage) {
      console.log('🔍 MIDDLEWARE: Storing route as referrer:', currentPath);
      
      // Set the referrer in our tracking composable
      setNuxtReferrer(currentPath);
      
      // Update page history
      addToPageHistory(currentPath);
    } else {
      console.log('🔍 MIDDLEWARE: Not storing media page as referrer:', currentPath);
    }
    
    // Update cameFromHome state (used for page transitions and styling)
    if (from.path === '/' || from.path === '/index.html') {
      console.log('🏠 MIDDLEWARE: Setting cameFromHome = true');
      setCameFromHome(true);
    }
  }
});

// Helper function to identify media pages
function isMediaRoute(path: string): boolean {
  // Match patterns for media pages: /editors/name/video, /featured/video, or /section/video
  return (
    Boolean(path.match(/\/editors\/[^\/]+\/[^\/]+/)) ||
    Boolean(path.match(/\/featured\/[^\/]+/)) ||
    (path.split('/').filter(Boolean).length >= 2 && !path.includes('/editors'))
  );
}