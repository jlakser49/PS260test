<template>
  <header :class="['global-header', classes]" @mouseover="onMouseover">
    <div class="meta">
      <slot name="logo" />
      <slot name="menu" />
    </div>
    <div v-if="isFixedLayout" class="hotspot" />
  </header>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const sTop = useState('sTop', () => 0)
const scrollDirection = useState('scrollDirection', () => null)

const props = defineProps({
  scrollTop: {
    type: Number,
    default: 0
  }
})

const isFixedLayout = computed(() => true)

const parsedScrollTop = computed(() => {
  return props.scrollTop || sTop.value || 0
})

const classes = computed(() => ({
  'header-floating': isFixedLayout.value,
  'state-float': isFixedLayout.value && scrollDirection.value === 'up',
  'state-off': isFixedLayout.value && scrollDirection.value === 'down',
  'state-top': isFixedLayout.value && (!scrollDirection.value || parsedScrollTop.value <= 0)
}))

const handleScroll = () => {
  if (!isFixedLayout.value) return
  const currentScroll = window.scrollY
  sTop.value = currentScroll
}

onMounted(() => {
  if (isFixedLayout.value) {
    window.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (isFixedLayout.value) {
    window.removeEventListener('scroll', handleScroll)
  }
})

watch(parsedScrollTop, (newVal, oldVal) => {
  if (!isFixedLayout.value) return
  
  let direction = null

  if (newVal <= 0) {
    direction = null
  } else if (newVal > oldVal) {
    direction = 'down'
  } else if (newVal < oldVal) {
    direction = 'up'
  }

  scrollDirection.value = direction
}, { immediate: true })

const onMouseover = () => {
  if (isFixedLayout.value) {
    scrollDirection.value = 'up'
  }
}
</script>

<style scoped lang="scss">
.global-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--unit-header-height);
  background-color: var(--header-bg-color);
  z-index: 200;
  transition: transform 0.8s var(--easing-motion) .2s;

  .panel-is-open & {
    z-index: 300;
  }

  .meta {
    display: flex;
    margin: 0 auto;
    max-width: 100%;
    padding: 0 25px 0 0;
    position: relative;
    transition: padding 0.8s var(--easing-motion) .2s;
  }



  .header-floating {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: var(--unit-header-height);
    transition: transform 0.8s var(--easing-motion) .2s;
    background-color: var(--header-bg-color);
    z-index: 100;

    .meta {
      display: flex;
      margin: 0 auto;
      max-width: 1000px;
      padding: 0 40px;
    }
  }

  .hotspot {
    position: absolute;
    top: 100%;
    height: 100%;
    left: 0;
    width: 100%;
  }

  &.state-off {
    height: var(--unit-header-height);
    transform: translateY(-200%);
  }

  &.state-top {
    height: var(--unit-header-height);
    transform: translateY(0);
  }

  &.state-top .hotspot {
    display: none;
  }

  // &.state-float {
  //   height: var(--unit-header-height);
  //   transform: translateY(0);
  // }

  &.state-float .hotspot {
    display: none;
  }

 

  @include lt-tablet {
    &.state-top {
        height: var(--unit-header-height);
        transform: translateY(0);
        
        .hotspot {
            display: none;
        }
        .color {
            transform: translateY(0);
        }
    }
  }

}

</style>