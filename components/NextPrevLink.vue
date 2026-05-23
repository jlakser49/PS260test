<template>
  <div class="next-prev-link"
      :class="{ 
        'next': next,
        'prev': !next
      }">
    <NuxtLink 
      v-if="!isDisabled && to"
      :to="to"
      class="icon"
      :class="{ 
        'next': next,
        'prev': !next
      }"
    >
      <span class="chevron" v-html="next ? ChevronRight : ChevronLeft" />
    </NuxtLink>
    
    <span 
      v-else
      class="icon icon-disabled"
    >
      <span class="chevron" v-html="next ? ChevronRight : ChevronLeft" />
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  to: string | null
  next: boolean
  currentIndex: number
  totalItems: number
}

const props = defineProps<Props>()

const isDisabled = computed(() => {
  if (props.next) {
    return props.currentIndex >= props.totalItems - 1
  }
  return props.currentIndex <= 0
})

const ChevronLeft = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M28.8 34.5L17.3 23L28.8 11.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

const ChevronRight = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.3 34.5L28.8 23L17.3 11.5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
</script>

<style lang="scss" scoped>
.next-prev-link {
    position: fixed;
    top: 50%;
    transform: translate(calc(382.5px + 100%), -50%);
    right: 50%;
    height: 40px;
    width: 40px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: width 0.4s var(--easing-motion);

    &.prev {
      right: auto;
      left: 50%;
      transform: translate(calc(-382.5px - 100%), -50%);
      z-index: 99;

        .chevron {
            left: 50%;
            transform: rotate(180deg) translate(-50%, -50%);
        }
      }

    .icon {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      
      // Right side
      .chevron {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);

        :deep(svg) {
            color: var(--color-white);
            transition: color 0.4s var(--easing-motion);

            &:hover {
              color: var(--color-yellow);
            }
        }

      }
      
      &-disabled {
        opacity: 0.25;
        cursor: not-allowed;

        .chevron {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          
          :deep(svg) {
            &:hover {
              color: var(--color-white);
            }
          }
        }
      }
    }

    @include lt-phone {
      right: 0;
      transform: translate(0%, -50%);
      
      &.prev {
        left: 0;
        transform: translate(0%, -50%);
      }
    }

    @include phone-landscape {
    transform: translate(0%, -50%);

    &.prev {
        left: 0;
        transform: translate(0%, -50%);
      }
  }
}

</style>