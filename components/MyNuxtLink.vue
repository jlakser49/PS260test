<!-- MyNuxtLink.vue -->
<template>
    <a class="link" :href="to">
      <slot />
    </a>
  </template>
  
  <script setup>
  defineProps({
    to: {
      type: String,
      default: 'https://nuxt.com'
    }
  })
  </script>

<style lang="scss" scoped>
.link {
    color: red;
}
</style>