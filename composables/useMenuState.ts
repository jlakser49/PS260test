// composables/useMenuState.ts
export const useMenuState = () => {
    return useState('menuOpen', () => false)
  }