// server/api/lottie-proxy.ts
import { defineEventHandler, getQuery, setResponseHeader } from 'h3';
import { useStorage } from '#imports';

// Constants
const BASE_URL = 'https://ps260.gosimian.com/assets/videos/';
const CACHE_CONFIG = {
  maxAge: 86400, // Cache for 1 day (in seconds)
};

export default defineEventHandler(async (event) => {
  try {
    // Get the file parameter from the query
    const query = getQuery(event);
    const file = query.file;
    
    if (!file || typeof file !== 'string') {
      return { error: 'File parameter is required' };
    }
    
    // Strip any path traversal attempts
    const sanitizedFile = file.replace(/\.\./g, '').replace(/^\//g, '');
    
    // Create cache key
    const cacheKey = `lottie:${sanitizedFile}`;
    
    // Create a storage instance
    const storage = useStorage('lottie');
    
    // Try to get from cache
    let cachedData = await storage.getItem(cacheKey);
    
    if (cachedData) {
      setResponseHeader(event, 'Cache-Control', `public, max-age=${CACHE_CONFIG.maxAge}`);
      setResponseHeader(event, 'X-Cache', 'HIT');
      console.log(`[LOTTIE PROXY] Cache HIT for: ${sanitizedFile}`);
      return cachedData;
    }
    
    console.log(`[LOTTIE PROXY] Cache MISS for: ${sanitizedFile}, fetching from source`);
    
    // Construct full URL
    const fullUrl = `${BASE_URL}${sanitizedFile}`;
    
    // Fetch the JSON file
    const response = await fetch(fullUrl);
    
    if (!response.ok) {
      console.error(`[LOTTIE PROXY] Failed to fetch ${fullUrl}: ${response.status} ${response.statusText}`);
      return { error: `Failed to fetch file: ${response.statusText}` };
    }
    
    const data = await response.json();
    
    // Store in cache
    let cacheStatus = 'MISS';
    try {
      await storage.setItem(cacheKey, data, {
        ttl: CACHE_CONFIG.maxAge
      });
    } catch (cacheError) {
      // Log cache error but continue - we'll just miss the cache benefits
      console.warn(`[LOTTIE PROXY] Cache error for ${sanitizedFile}:`, cacheError);
      cacheStatus = 'BYPASS';
    }
    
    // Set cache headers
    setResponseHeader(event, 'Cache-Control', `public, max-age=${CACHE_CONFIG.maxAge}`);
    setResponseHeader(event, 'X-Cache', cacheStatus);
    
    return data;
  } catch (error) {
    console.error('[LOTTIE PROXY] Error:', error);
    return { error: 'Failed to fetch animation data' };
  }
});