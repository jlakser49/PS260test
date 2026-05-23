<!-- error.vue -->
 <!-- /editors/testerror -->
<template>
  <div class="global-nuxt-error">
    <LogoCycler class="logo" />
    <span class="title">404</span>
    <p>
      Page Not Found
    </p>
    <p>
      Oops! It seems the page you’re looking for doesn’t exist.</p>
    <nuxt-link class="link" to="/">
      Back To Safety
    </nuxt-link>
  </div>
</template>

<script setup lang="ts">
defineProps({
  error: Object
})
</script>

<style lang="scss" scoped>
.global-nuxt-error {
    background-color: var(--color-black);
    height: var(--unit-100vh);
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    flex-direction: column;

    p {
      color: var(--color-white);
      font-weight: 700;
      margin: 8px 0;
      padding: 0 40px;
      text-align: center;
      font-size: 18px;
      line-height: 1.3;

      &:last-of-type {
        margin-bottom: 20px;
      }
    }

    .logo {
       top: 30px;
    }

    .title {
            font-weight: 700;
            display: block;
            margin: 5px;
        color: var(--color-white);
        text-align: center;
        font-size: 30px;

        }
    .link {
        color: var(--color-yellow);
        font-weight: 700;
        text-decoration: none;
        transition: color 0.4s var(--easing-motion);
        text-align: center;
        font-size: 20px;

      

        &:hover {

                color: var(--color-yellow);

        }
    }

}
</style>