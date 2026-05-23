// components/Feature.vue
<template>
  <div v-editable="blok" class="feature">
    <h2>{{ blok.name }}</h2>
  </div>
</template>

<script setup>
defineProps({ blok: Object })
</script>

<style lang="scss" scoped>
.feature {
  padding: 2rem;
  margin: 1rem 0;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
}
</style>