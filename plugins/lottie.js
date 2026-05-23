// plugins/lottie.js
import lottie from 'lottie-web/build/player/lottie_light'

export default defineNuxtPlugin((nuxtApp) => {
  // Override the loadAnimation method to handle CORS issues
  const originalLoadAnimation = lottie.loadAnimation;
  
  lottie.loadAnimation = function(params) {
    // Check if path is a remote URL from gosimian.com
    if (typeof params.path === 'string' && params.path.includes('ps260.gosimian.com')) {
      // Extract the filename from the URL
      const urlParts = params.path.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // console.log(`[LOTTIE] Proxying remote URL: ${params.path}`);
      
      // Modify the path to use our proxy
      params.path = `/api/lottie-proxy?file=${filename}`;
      // console.log(`[LOTTIE] Using proxy URL: ${params.path}`);
    }
    
    // Call the original method with our modified parameters
    return originalLoadAnimation.call(lottie, params);
  };
  
  return {
    provide: {
      lottie
    }
  }
})