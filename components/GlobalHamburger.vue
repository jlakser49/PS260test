<!-- components/GlobalHamburger.vue -->
<template>
    <button 
      class="hamburger"
      :class="{ 'is-active': isMenuOpen }"
      @click="toggleMenu"
      aria-label="Menu"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
  </template>
  
  <script setup lang="ts">
  const isMenuOpen = useMenuState()
  
  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
  }
  </script>
  
  <style scoped lang="scss">
  .hamburger {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;

    display: none;
    flex-direction: column;
    justify-content: space-around;
    
    width: 2rem;
    height: 2rem;
    z-index: 100;
    
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 400;
  
    &-line {
      width: 2rem;
      height: 0.25rem;
      background: var(--color-white);
      border-radius: 10px;
      transition: all 0.3s linear;
      position: relative;
      transform-origin: 1px;
  
      &:first-child {
        transform: rotate(0);
      }
  
      &:nth-child(2) {
        opacity: 1;
      }
  
      &:nth-child(3) {
        transform: rotate(0);
      }
    }
  
    &.is-active {
      .hamburger-line {
        &:first-child {
          transform: rotate(45deg);
        }
  
        &:nth-child(2) {
          opacity: 0;
        }
  
        &:nth-child(3) {
          transform: rotate(-45deg);
        }
      }
    }

    @include lt-tablet {
      top: 1.5rem;
      right: 1.5rem;
    }

    @include lt-phone {
      display: flex;
    }

    @include mobile {
      top: 1.25rem;
      right: 1.25rem;
    }

    @include phone-landscape {
      top: 1rem;
      right: 1rem;
    }
  }
  
  /* Handle panel-is-open class - needs to be outside .hamburger scope */
  /* This needs to be added at the global level */
  :deep(.panel-is-open .hamburger) {
    display: flex !important; /* !important needed to override media queries */
  }
  </style>