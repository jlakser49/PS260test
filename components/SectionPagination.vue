<!-- components/SectionPagination.vue -->
<template>
  <div class="section-pagination">
    <div 
      v-for="(_, idx) in totalSections" 
      :key="idx"
      class="dot"
      :class="{ active: idx === index }"
      @click="handleDotClick(idx)"
    ></div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  index: {
    type: Number,
    default: 0
  },
  totalSections: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['change'])

const handleDotClick = (idx: number) => {
  if (props.isActive && idx !== props.index) {
    emit('change', idx)
  }
}
</script>

<style lang="scss" scoped>
.section-pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  
  /* This class will be applied by the parent component if needed */
  &.column {
    flex-direction: column;
  }
  
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    transition: all 0.6s ease;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.8);
      transform: scale(1.2);
    }
    
    &.active {
      background-color: var(--color-white);
      transform: scale(1.2);
    }
  }
}
</style>