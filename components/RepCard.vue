<!-- components/RepCard.vue -->
<template>
    <div class="rep-card">
      <p class="name" v-text="rep.Name" v-if="rep.Name" />
      <a :href="`tel:${rep.Phone}`" class="phone" v-text="rep.Phone" v-if="rep.Phone" />
      <a :href="`mailto:${rep.Email}`" class="email" v-text="rep.Email" v-if="rep.Email" />
    </div>
  </template>
  
  <script setup>
  defineProps({
    rep: {
      type: Object,
      required: true
    }
  })
  </script>
  
  <style scoped lang="scss">
  .rep-card {
    text-align: center;
    
    .company-name {
      color: var(--color-yellow);
      font-size: 20px;
      margin-bottom: 0;
    }
  
    .name {
      color: var(--color-white);
      margin-top: .5rem;
      margin-bottom: 0;
      font-size: 13px;
      font-weight: 900;
    }
  
    .phone {
      color: var(--color-white);
      margin-top: 0.1rem;
      margin-bottom: 2px;
      font-size: 12px;
      display: block;
      text-decoration: none;
      transition: color 0.4s var(--easing-motion);
      font-weight: 700;

      &:hover {
        color: var(--color-yellow);
      }
    }
  
    .email {
      color: var(--color-blue);
      text-decoration: none;
      font-weight: 600;
      font-size: 12px;
  
      transition: color 0.4s var(--easing-motion);
  
      &:hover {
        color: var(--color-yellow);
      }
    }
  
  @include lt-phone {
    .email {
      font-size: 13px;
    }
    .name {
      font-size: 14px;
    }
    .phone {
      font-size: 13px;
      margin-bottom: .25rem;
    }
  }

  }
  </style>