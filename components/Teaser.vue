// components/Teaser.vue
<template>
  <div v-editable="blok" class="teaser">
    <h2>{{ blok.headline }}</h2>
  </div>
</template>

<script setup>
defineProps({ blok: Object })
</script>

<style lang="scss" scoped>
.teaser {
  text-align: center;
  padding: 3rem 1rem;
  
  h2 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }
}
</style>