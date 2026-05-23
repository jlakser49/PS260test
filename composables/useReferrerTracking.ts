// composables/useReferrerTracking.ts
import { ref, computed } from 'vue';

// Create a global state to replace sessionStorage
const videoOrigin = ref('/');
const nuxtReferrer = ref('/');
const cameFromHome = ref(false);
const comingFromReel = ref(false);
const pageHistory = ref([]);

// Add any additional state needed
const hasNavigatedVideos = ref(false);
const videoEntryPath = ref('');
const videoBaseUrl = ref('');

export function useReferrerTracking() {
  // Safe getter/setter methods that work both client and server side
  const setVideoOrigin = (value: string) => {
    if (process.client && value) {
      videoOrigin.value = value;
      // For backward compatibility, also set in sessionStorage
      try {
        sessionStorage.setItem('videoOrigin', value);
      } catch (e) {
        console.error('Error setting sessionStorage:', e);
      }
    }
  };

  const getVideoOrigin = () => {
    if (process.client) {
      // Try to get from sessionStorage first for backward compatibility
      try {
        const stored = sessionStorage.getItem('videoOrigin');
        if (stored && videoOrigin.value !== stored) {
          videoOrigin.value = stored;
        }
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }
    return videoOrigin.value;
  };

  const setNuxtReferrer = (value: string) => {
    if (process.client && value) {
      nuxtReferrer.value = value;
      try {
        sessionStorage.setItem('nuxtReferrer', value);
      } catch (e) {
        console.error('Error setting sessionStorage:', e);
      }
    }
  };

  const getNuxtReferrer = () => {
    if (process.client) {
      try {
        const stored = sessionStorage.getItem('nuxtReferrer');
        if (stored && nuxtReferrer.value !== stored) {
          nuxtReferrer.value = stored;
        }
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }
    return nuxtReferrer.value;
  };

  const setCameFromHome = (value: boolean) => {
    if (process.client) {
      cameFromHome.value = value;
      try {
        sessionStorage.setItem('cameFromHome', value ? 'true' : 'false');
      } catch (e) {
        console.error('Error setting sessionStorage:', e);
      }
    }
  };

  const getCameFromHome = () => {
    if (process.client) {
      try {
        const stored = sessionStorage.getItem('cameFromHome');
        if (stored) {
          cameFromHome.value = stored === 'true';
        }
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }
    return cameFromHome.value;
  };

  const setComingFromReel = (value: boolean) => {
    if (process.client) {
      comingFromReel.value = value;
      try {
        sessionStorage.setItem('comingFromReel', value ? 'true' : 'false');
      } catch (e) {
        console.error('Error setting sessionStorage:', e);
      }
    }
  };

  const getComingFromReel = () => {
    if (process.client) {
      try {
        const stored = sessionStorage.getItem('comingFromReel');
        if (stored) {
          comingFromReel.value = stored === 'true';
        }
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }
    return comingFromReel.value;
  };

  const addToPageHistory = (path: string) => {
    if (process.client && path) {
      // Add to start of array
      pageHistory.value = [path, ...pageHistory.value.slice(0, 4)];
      try {
        sessionStorage.setItem('pageHistory', JSON.stringify(pageHistory.value));
      } catch (e) {
        console.error('Error setting sessionStorage:', e);
      }
    }
  };

  const getPageHistory = () => {
    if (process.client) {
      try {
        const stored = sessionStorage.getItem('pageHistory');
        if (stored) {
          pageHistory.value = JSON.parse(stored);
        }
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }
    return pageHistory.value;
  };

  // Computed properties with safe fallbacks for SSR
  const isFromHome = computed(() => {
    return getCameFromHome();
  });
  
  const currentReferrer = computed(() => {
    return getNuxtReferrer();
  });

  return {
    // Getters
    getVideoOrigin,
    getNuxtReferrer,
    getCameFromHome,
    getComingFromReel,
    getPageHistory,
    
    // Setters
    setVideoOrigin,
    setNuxtReferrer,
    setCameFromHome,
    setComingFromReel,
    addToPageHistory,
    
    // Computed
    isFromHome,
    currentReferrer,
    
    // Raw state access (use carefully)
    videoOrigin,
    nuxtReferrer,
    cameFromHome,
    comingFromReel,
    pageHistory,
    
    // Additional state
    hasNavigatedVideos,
    videoEntryPath,
    videoBaseUrl,
    setHasNavigatedVideos: (value: boolean) => {
      hasNavigatedVideos.value = value;
      if (process.client) {
        try {
          sessionStorage.setItem('hasNavigatedVideos', value ? 'true' : 'false');
        } catch (e) {
          // Ignore errors
        }
      }
    },
    setVideoEntryPath: (value: string) => {
      videoEntryPath.value = value;
      if (process.client) {
        try {
          sessionStorage.setItem('videoEntryPath', value);
        } catch (e) {
          // Ignore errors
        }
      }
    },
    setVideoBaseUrl: (value: string) => {
      videoBaseUrl.value = value;
      if (process.client) {
        try {
          sessionStorage.setItem('videoBaseUrl', value);
        } catch (e) {
          // Ignore errors
        }
      }
    }
  };
}