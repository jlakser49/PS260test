// plugins/storyblok.js
export default defineNuxtPlugin((nuxtApp) => {
    // Register all Storyblok components
    nuxtApp.vueApp.component('Feature', defineAsyncComponent(() => 
      import('~/components/Feature.vue')
    ))
    nuxtApp.vueApp.component('Teaser', defineAsyncComponent(() => 
      import('~/components/Teaser.vue')
    ))
    nuxtApp.vueApp.component('Grid', defineAsyncComponent(() => 
      import('~/components/Grid.vue')
    ))
    nuxtApp.vueApp.component('StoryblokVideo', defineAsyncComponent(() => 
      import('~/components/StoryblokVideo.vue')
    ))
    nuxtApp.vueApp.component('AccentImage', defineAsyncComponent(() => 
      import('~/components/AccentImage.vue')
    ))
    nuxtApp.vueApp.component('QuotesSection', defineAsyncComponent(() => 
      import('~/components/StoryblokQuotes.vue')
    ))
    nuxtApp.vueApp.component('Category', defineAsyncComponent(() => 
      import('~/components/EditorCategory.vue')
    ))
    nuxtApp.vueApp.component('StoryblokWrapper', defineAsyncComponent(() => 
      import('~/components/StoryblokWrapper.vue')
    ))
    nuxtApp.vueApp.component('ReelVideo', defineAsyncComponent(() => 
      import('~/components/ReelVideo.vue')
    ))
    nuxtApp.vueApp.component('SimianReel', defineAsyncComponent(() => 
      import('~/components/SimianReel.vue')
    ))
    nuxtApp.vueApp.component('StoryblokMedia', defineAsyncComponent(() => 
      import('~/components/StoryblokMedia.vue')
    ))
    
    // Register new Q&A, Bio, Banner, and Html components
    nuxtApp.vueApp.component('qAndA', defineAsyncComponent(() => 
      import('~/components/StoryblokQAndA.vue')
    ))
    nuxtApp.vueApp.component('bio', defineAsyncComponent(() => 
      import('~/components/StoryblokBio.vue')
    ))
    nuxtApp.vueApp.component('banner', defineAsyncComponent(() => 
      import('~/components/StoryblokBanner.vue')
    ))
    nuxtApp.vueApp.component('htmlBlock', defineAsyncComponent(() => 
      import('~/components/StoryblokHtml.vue')
    ))
    
    // Using the existing Contact component directly
    nuxtApp.vueApp.component('ContactForm', defineAsyncComponent(() => 
      import('../components/Contact.vue')
    ))
    
    // Register VideoAnimationOverride component
    nuxtApp.vueApp.component('VideoAnimationOverride', defineAsyncComponent(() => 
      import('../components/VideoAnimationOverride.vue')
    ))
    
    // Combined Layouts are auto-imported by Nuxt
  })