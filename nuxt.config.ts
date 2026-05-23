// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  // future: {
  //   compatibilityVersion: 4,
  // },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { name: 'charset', content: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  site: { 
    url: 'https://www.ps260.com', 
    name: 'PS 260' ,
    link: [
      // Standard Icons
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'shortcut icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'icon', type: 'image/png', href: '/favicon-32x32.png', sizes: '32x32' },
      
      // Apple Touch Icon
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      
      // Web Manifest
      { rel: 'manifest', href: '/site.webmanifest' },
      
      // Preload custom font for contact page
      { rel: 'preload', href: '/simian-assets/videos/ps260-font.woff2', as: 'font', type: 'font/woff2', crossorigin: 'anonymous' }
    ],
    meta: [
      { name: 'apple-mobile-web-app-title', content: 'PS 260' }
    ]
  }, 
  devtools: { enabled: true },
  compatibilityDate: '2025-05-06',
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use '@/assets/scss/_variables.scss' as *;
            @use '@/assets/scss/_breakpoints.scss' as *;
          `
        }
      }
    }
  },
  experimental: {
    viewTransition: true,
    defaults: {
      nuxtLink: {
        trailingSlash:  'remove'
      }
    }
  },
  css: [
    '@/assets/scss/main.scss'  // Main SCSS file
  ],
  plugins: [
    { src: '~/plugins/lottie', mode: 'client' },
    // { src: '~/plugins/move-title.server', mode: 'server' },
    // { src: '~/plugins/scroll-behavior', mode: 'client' },
    // { src: '~/plugins/page-transitions', mode: 'client' }
  ],
  modules: [
    // Auth module
    // 'nuxt-auth-utils',
    
    // SEO module
    '@nuxtjs/seo',
    
    // Image module
    '@nuxt/image',
    
    // Google Fonts
    ['@nuxtjs/google-fonts', {
      families: {
        Inter: [100, 300, 400, 500, 600, 700, 800, 900],
      },
      display: 'swap', // Optional: ensures text remains visible during font loading
      download: true,  // Optional: downloads fonts during build time
      preload: true   // Optional: preloads fonts for better performance
    }],
    
    // Storyblok
    ['@storyblok/nuxt', {
      accessToken: process.env.STORYBLOK_TOKEN,
      apiOptions: {
        region: 'us'
      },
      useApiClient: true
    }],
    
    // Google Analytics
    'nuxt-gtag',
    
    // Sitemap
    '@nuxtjs/sitemap'
  ],
  image: {
    storyblok: {
      baseURL: 'https://a-us.storyblok.com'
    }
  },
  ssr: true,
  runtimeConfig: {
    simianAuthToken: process.env.NUXT_SIMIAN_AUTH_TOKEN,
    public: {}, // Keep this empty for security; don't expose keys client-side
    storyblok: {
      accessToken: process.env.NODE_ENV === 'production' ? process.env.STORYBLOK_TOKEN : process.env.STORYBLOK_TOKEN_PREVIEW,
      apiOptions: {
        region: 'us'
      }
    }
  },
  nitro: {
    preset: 'vercel',
    prerender: {
      crawlLinks: true,
    },
    compressPublicAssets: true,
    externals: {
      inline: ['@storyblok/nuxt']
    },
    minify: true,
  },
  
  // Google Analytics configuration
  gtag: {
    id: 'G-HD2MK2DC8T',
  },
  build: {
    transpile: ['fast-xml-parser', 'storyblok-js-client']
  },
  // Add routeRules for font proxy
  routeRules: {
    '/simian-assets/**': {
      proxy: { to: 'https://ps260.gosimian.com/assets/**' }
    }
  },
  // auth: {
  //   isEnabled: true,
  //   defaultProvider: 'session',
  //   session: {
  //     name: 'nuxt-auth',
  //     password: process.env.NUXT_SESSION_PASSWORD
  //   }
  // }
})
