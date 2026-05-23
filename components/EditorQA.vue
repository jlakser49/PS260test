<!-- components/EditorQA.vue -->
<template>
    <div class="qa-container">
      <div class="qa-item">
        <div class="question" ref="questionEl" v-html="question" />
        <div class="answer" ref="answerEl" v-html="answer" />
      </div>
    </div>
  </template>

  <script setup>
  import { ref, onMounted, watch } from 'vue';
  import { useRouter } from '#app'; // For Nuxt 3

  const props = defineProps({
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  });

  const router = useRouter();
  const questionEl = ref(null);
  const answerEl = ref(null);

  // Function to process links
  const processInternalLinks = (element) => {
    if (!element) return;
    
    const internalLinks = element.querySelectorAll('a[href^="/"]');
    internalLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        router.push(href);
      });
    });
  };

  // Process internal links after component is mounted
  onMounted(() => {
    processInternalLinks(questionEl.value);
    processInternalLinks(answerEl.value);
  });

  // Also process links when props change
  watch(() => props.question, () => {
    setTimeout(() => processInternalLinks(questionEl.value), 0);
  });

  watch(() => props.answer, () => {
    setTimeout(() => processInternalLinks(answerEl.value), 0);
  });
  </script>

  <style scoped lang="scss">
  .qa-container {
    padding: 0 2rem;
    max-width: 800px;
    margin: 0 auto;
    font-weight: 700;
    margin-bottom: 5rem;

    :deep(a) {
      text-decoration: none;
      transition: color 0.4s var(--easing-motion);

      &:hover {
        color: var(--color-white) !important;
        text-decoration: underline;
      }
    }
  
    &:last-child {
      margin-bottom: 0;
    }
    .question {
      color: var(--color-purple); // Purple color from screenshot
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }
    
    .answer {
      color: var(--color-yellow); // Yellow/gold color from screenshot
      font-size: 1.1rem;
      line-height: 1.4;
    }
  }
  </style>