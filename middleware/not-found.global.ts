// middleware/not-found.global.ts
export default defineNuxtRouteMiddleware((to) => {
    // if (to.path !== '/' && !to.matched.length) {
    //   console.log('Route not found, redirecting to home:', to.path);
    //   return navigateTo('/');
    // }
  });