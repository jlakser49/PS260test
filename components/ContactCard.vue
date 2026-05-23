<!-- components/ContactCard.vue -->
<!-- components/ContactCard.vue -->
<template>
  <div class="contact-card" :class="{ 
    'no-location': !hasLocationMeta,
    'last-position-mobile': contact.lastPositionMobile
  }">
    <h3 v-if="contact.Contact" v-text="contact.Contact" />
    <div v-if="contact.Position" class="position">
      <span>{{ contact.Position.split(/[-—]/)[0] }}</span>
      <span class="position-meta">{{ contact.Position.split(/[-—]/)[1] }}</span>
    </div>
    <a :href="`mailto:${contact.Email}`" class="email" v-text="contact.Email" v-if="contact.Email" />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  contact: {
    type: Object,
    required: true
  }
});

// Check if position-meta has a value
const hasLocationMeta = computed(() => {
  if (!props.contact.Position) return false;
  
  const positionParts = props.contact.Position.split(/[-—]/);
  return positionParts.length > 1 && positionParts[1].trim() !== '';
});
</script>
 
  <style scoped lang="scss">
  .contact-card {
    padding: 0;
    font-weight: 700;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    &.no-location {
      .position {
        margin-bottom: 15px;
      }
    }

    h3 {
      color: var(--color-white);
      margin-top: 0;
      margin-bottom: 0.115rem;
      font-size: 17px;
      font-weight: 900;
    }
  
    .position {
      color: var(--color-orange);
      font-size: 13px;
      margin-top: 0;
      margin-bottom: 0;

      .position-meta {
        display: block
      }
      
      // Respond to is-wider state from staging page
      .is-wider & {
        font-size: 10px;
        
        @include gt-cinema {
          font-size: 12px;
        }
      }
    }
  
    .email {
      color: var(--color-blue);
      text-decoration: none;
      font-weight: 600;
      font-size: 12px;
      transition: color 0.4s var(--easing-motion);
  
      &:hover {
        color: var(--color-orange);
      }
    }

    
    
  @include lt-cinema {
    h3 {
      font-size: 18px;
    }
    .position {
      font-size: 12px;
    }
  }

  @include lt-tablet {
    &.no-location {
      .position {
        margin-bottom: 0;
      }
    }
    &.last-position-mobile {
      order: 999;
    }
  }

  @include lt-phone {
    h3 {
      font-size: 20px;
    }
    .position {
      font-size: 13px;
    }
    .email {
      font-size: 13px;
    }
    
  }

  }
  </style>