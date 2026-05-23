<!-- components/StoryblokReps.vue -->
<template>
  <div class="reps-section">
    <h3 class="region-title">{{ repData.region }}</h3>
    <div class="rep-group">
      <h4 class="company-title">{{ repData.title }}</h4>
      <div class="reps-container">
        <RepCard v-for="rep in repData.Reps" :key="rep._uid" :rep="rep" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Rep {
  Name: string;
  Email: string;
  Phone: string;
  _uid: string;
  component: string;
}

interface RepGroup {
  Reps: Rep[];
  _uid: string;
  title: string;
  region: string;
  component: string;
}

// Define props
const props = defineProps<{
  repData: RepGroup;
}>();
</script>

<style scoped lang="scss">
.reps-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;

  .region-title {
    color: var(--color-purple);
    font-size: 15px;
    margin: 0 0 20px;
    font-weight: 900;
    text-transform: capitalize;
  }

  .company-title {
    color: var(--color-yellow);
    font-size: 17px;
    margin: 0 0 15px;
    font-weight: 900;
  }

  .reps-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
  }

  @media (max-width: 768px) {
    .company-title {
      font-size: 21px;
    }
  }
}
</style>