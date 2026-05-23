/**
 * Font preloader plugin for PS260 custom font
 * This ensures the PS260 font is loaded as soon as possible
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Create a font face observer
  const ps260FontPreloader = () => {
    // If the browser supports the Font Loading API
    if ('fonts' in document) {
      // Preload the PS260 font used on the contact page
      const font = new FontFace(
        'PS260',
        "url('/simian-assets/videos/ps260-font.woff2') format('woff2')",
        { display: 'swap' }
      );
      
      // Add the font to the document
      font.load().then((loadedFont) => {
        document.fonts.add(loadedFont);
        console.log('PS260 font preloaded successfully');
      }).catch((error) => {
        console.error('Error preloading PS260 font:', error);
      });
    }
  };

  // Trigger font loading when page is ready
  nuxtApp.hook('app:mounted', () => {
    ps260FontPreloader();
  });
  
  // Also trigger on route changes to ensure font is loaded before contact page
  nuxtApp.hook('page:start', () => {
    ps260FontPreloader();
  });
});