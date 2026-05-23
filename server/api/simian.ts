// server/api/simian.ts
import { XMLParser } from 'fast-xml-parser';
import { createError, defineEventHandler, readBody, setResponseHeader } from 'h3';
import { useRuntimeConfig, useStorage } from '#imports';

// Types
interface SimianRequestBody {
  reelId: string | number;
}

interface SimianConfig {
  API_URL: string;
  REEL_TYPE: string;
}

// Constants
const SIMIAN_CONFIG: SimianConfig = {
  API_URL: 'https://ps260.gosimian.com/api/simian/get_reel',
  REEL_TYPE: 'web_reels'
};

// Cache configuration
const CACHE_CONFIG = {
  maxAge: 3600, // Cache for 1 hour (in seconds)
  staleMaxAge: 86400, // Allow stale content for 24 hours
  swr: true // Enable stale-while-revalidate
};

// XML Parser configuration
const XML_PARSER_OPTIONS = {
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true
};

// Helper functions
const createSimianFormData = (reelId: string, authToken: string): URLSearchParams => {
  const formData = new URLSearchParams();
  formData.append('reel_id', reelId);
  formData.append('reel_type', SIMIAN_CONFIG.REEL_TYPE);
  formData.append('auth_token', authToken);
  return formData;
};

const parseXMLResponse = (xmlString: string) => {
  const parser = new XMLParser(XML_PARSER_OPTIONS);
  try {
    return parser.parse(xmlString);
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to parse XML response',
      cause: error
    });
  }
};

// Removed unused handler function

// Export cached handler with modified approach for caching
export default defineEventHandler(async (event) => {
  try {
    // Read body just once
    const body = await readBody<SimianRequestBody>(event);
    
    if (!body.reelId) {
      throw createError({
        statusCode: 400,
        message: 'Reel ID is required'
      });
    }
    
    // Create cache key
    const cacheKey = `simian:${body.reelId}`;
    
    // Create a storage instance
    const storage = useStorage('simian');
    
    // Try to get from cache
    let cachedData = await storage.getItem(cacheKey);
    
    if (cachedData) {
      // Set cache headers for cached response
      setResponseHeader(event, 'Cache-Control', `public, max-age=${CACHE_CONFIG.maxAge}, s-maxage=${CACHE_CONFIG.maxAge * 2}`);
      setResponseHeader(event, 'X-Cache', 'HIT');
      // console.log(`[SIMIAN API] Cache HIT for key: ${cacheKey}`);
      return cachedData;
    }
    // console.log(`[SIMIAN API] Cache MISS for key: ${cacheKey}, fetching from Simian API`);
    
    // If not cached, execute the API call
    const config = useRuntimeConfig();
    
    // Create form data
    const formData = createSimianFormData(
      String(body.reelId),
      config.simianAuthToken
    );
    
    // Make request to Simian API
    const response = await fetch(SIMIAN_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });
    
    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      throw createError({
        statusCode: response.status,
        message: `Simian API error: ${errorText}`
      });
    }
    
    // Parse successful response
    const responseText = await response.text();
    const jsonData = parseXMLResponse(responseText);
    
    // Log the full response data
    // console.log(`[SIMIAN API] Full Response from Simian for reelId=${body.reelId}:`, JSON.stringify(jsonData, null, 2));
    
    // Additional detailed logging for alternate formats in media items
    try {
      if (jsonData?.root?.media) {
        // Safely handle different response structures
        const mediaItems = Array.isArray(jsonData.root.media) 
          ? jsonData.root.media 
          : [jsonData.root.media];
        
        // Safely iterate through media items
        mediaItems.forEach((media, index) => {
          try {
            if (media) {
              // Log basic media info
              // console.log(`[SIMIAN API] Media item #${index} - ID: ${media.id || 'unknown'}, Title: ${media.title || 'untitled'}`);
              
              // Safely log alternate formats if present
              if (media.alternate_formats) {
                // console.log(`[SIMIAN API] Alternate format found for media item #${index}`);
                
                // Check for specific media item
                if (media.id === '2053' || (media.title && media.title.includes('Matt Posey'))) {
                  // console.log(`[SIMIAN API] Found Matt Posey media item:`, media.id);
                }
              }
            }
          } catch (itemError) {
            console.error(`[SIMIAN API] Error processing media item #${index}:`, itemError);
          }
        });
      }
    } catch (loggingError) {
      // Just log the error but don't fail the request
      console.error(`[SIMIAN API] Error in detailed logging:`, loggingError);
    }
    
    // Optional: Add response validation
    if (!jsonData?.root?.media) {
      throw createError({
        statusCode: 500,
        message: 'Invalid response format from Simian API'
      });
    }
    
    // Store in cache before returning
    await storage.setItem(cacheKey, jsonData, {
      // Cache according to our configuration
      ttl: CACHE_CONFIG.maxAge
    });
    // console.log(`[SIMIAN API] Cached response for key: ${cacheKey}, TTL: ${CACHE_CONFIG.maxAge}s`);
    
    // Set cache headers for fresh response
    setResponseHeader(event, 'Cache-Control', `public, max-age=${CACHE_CONFIG.maxAge}, s-maxage=${CACHE_CONFIG.maxAge * 2}`);
    setResponseHeader(event, 'X-Cache', 'MISS');
    
    return jsonData;
    
  } catch (error) {
    // Log error for debugging
    console.error('Simian API Error:', {
      message: error
    });
    
    // Rethrow as HTTP error
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch reel data'
    });
  }
});