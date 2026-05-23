<!-- components/StoryblokWrapper.vue -->
<template>
    <component 
      v-if="blok?.component"
      :is="blok.component"
      :blok="blok"
      :is-wider="blok.component === 'AccentImage' ? isWider : undefined"
      v-editable="blok"
      class="storyblok-component"
    />
    <pre v-else>
      Component Not Loaded
    </pre>
  </template>
  
  <script setup>
  defineProps({
    blok: {
      type: Object,
      required: true
    },
    isWider: {
      type: Boolean,
      default: false
    }
  })
  </script>

<style lang="scss" scoped>
.storyblok-component {
  /* Your component styles here */
}
</style>