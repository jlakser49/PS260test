<template>
  <div class="html-container block-item" v-if="htmlContent" ref="htmlRef">
    <div v-html="htmlContent"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from '#app';

const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
});

const router = useRouter();
const htmlRef = ref(null);

// Extract HTML content from Storyblok richtext
const htmlContent = computed(() => {
  if (!props.blok.html || !props.blok.html.content || !props.blok.html.content.length) {
    return '';
  }

  // Extract and combine all paragraph content
  return props.blok.html.content
    .map(paragraph => {
      if (!paragraph.content || !paragraph.content.length) return '';
      
      // Get all text content from the paragraph
      return paragraph.content
        .map(node => node.text || '')
        .join('');
    })
    .join('');
});

// Function to process links for internal navigation
const processInternalLinks = () => {
  if (!htmlRef.value) return;
  
  // Only target internal links that don't have target="_blank"
  const internalLinks = htmlRef.value.querySelectorAll('a[href^="/"]:not([target="_blank"])');
  internalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      router.push(href);
    });
  });
};

// Process links on mount
onMounted(() => {
  setTimeout(processInternalLinks, 0);
});

// Re-process links when content changes
watch(() => props.blok, () => {
  setTimeout(processInternalLinks, 0);
}, { deep: true });
</script>

<style scoped lang="scss">
.html-container {
  box-sizing: border-box;
  
  iframe {
    max-width: 100%;
  }
  
  :deep(.examples),
  :deep(.blocks) {
    max-width: 800px;
    margin: 0 auto;
    color: var(--color-white); 
    padding: 0 2rem;
  }
  :deep(){
  /* Typography */
  h1, h2, h3, p, li, th, td, label {
    color: var(--color-white);
  }
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--color-yellow);
    text-shadow: 0 0 10px rgba(242, 169, 0, 0.4);
    font-weight: 900;
  }
  
  h2 {
    font-size: 2rem;
    margin-bottom: 0.8rem;
    color: var(--color-orange);
    font-weight: 900;
  }
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.6rem;
    color: var(--color-blue);
    font-weight: 900;
  }
  
  p {
    margin: 15px 0;
    line-height: 1.3;

    &:first-child {
      margin-top: 0;
      margin-bottom: 0;
    }

    &:last-child {
      margin-top: 0;
      margin-bottom: 0;
    }

    strong {
      font-weight: 900;
      color: var(--color-yellow);
    }
    
    em {
      font-style: italic;
      color: var(--color-purple);
    }
  }
  
  /* Lists */
  .list {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
    
    li {
      margin-bottom: 0.5rem;
    }
  }
  
  ul.list {
    list-style-type: disc;
    li::marker {
      color: var(--color-orange);
    }
  }
  
  ol.list {
    list-style-type: decimal;
    li::marker {
      color: var(--color-blue);
    }
  }
  
  /* Links and Buttons */
  .link {
    color: var(--color-blue);
    text-decoration: none;
    transition: color 0.3s;
    
    &:hover {
      color: var(--color-yellow);
      text-decoration: underline;
    }
  }
  
  .button {
    display: inline-block;
    padding: 10px 15px;
    margin: 0;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    text-align: center;
    transition: all 0.3s;
    color: var(--color-black);
    background-color: var(--color-white);
    
    &.primary {
      background-color: var(--color-blue);
      
      &:hover {
        background-color: #0088cc;
      }
    }
    
    &.secondary {
      background-color: var(--color-purple);
      
      &:hover {
        background-color: #5a2e92;
      }
    }
    
    &.small {
      padding: 5px 10px;
      font-size: 0.875rem;
    }
  }
  
  /* Forms */
  .form {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background-color: #1e1e1e;
    border: 1px solid var(--color-white);
    box-sizing: border-box;
    
    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 900;
        color: var(--color-white);
      }
      
      input[type="checkbox"] {
        margin-right: 0.5rem;
        accent-color: var(--color-blue);
      }
    }
    
    input[type="text"],
    input[type="email"],
    textarea,
    select {
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      border: 1px solid var(--color-white);
      font-size: 1rem;
      background-color: #222;
      color: var(--color-white);
      transition: all 0.3s;
      
      &:focus {
        outline: none;
        border-color: var(--color-blue);
      }
    }
    
    ::placeholder {
      color: #aaa;
    }
    
    button[type="submit"] {
      background: var(--color-blue);
    }
  }
  
  /* Table */
  .table {
    width: 100%;
    margin-bottom: 2rem;
    border-collapse: collapse;
    
    th, td {
      padding: 12px;
      border: 1px solid var(--color-white);
      text-align: left;
    }
    
    th {
      background-color: var(--color-purple);
      font-weight: 900;
    }
    
    tr {
      &:nth-child(even) {
        background-color: rgba(0, 170, 255, 0.1);
      }
      
      &:hover {
        background-color: rgba(242, 169, 0, 0.1);
      }
    }
  }
  
  /* Images */
  .image,
  img {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
    transition: transform 0.3s;
    
    &:hover {
      transform: scale(1.02);
    }
  }
  
  /* Card Component */
  .card {
    margin-bottom: 2rem;
    overflow: hidden;
    background-color: #1e1e1e;

    .card-header {
      padding: 15px;
      background: var(--color-blue);
      border-bottom: 1px solid #444;
      font-weight: 900;
      font-size: 1.1rem;
      color: var(--color-white);
    }
    
    .card-body {
      padding: 15px;
      
      p {
        margin: 12px 0;

        &:first-child {
          margin-top: 0;
          margin-bottom: 0;
        }
        &:last-child {
          margin-top: 0;
          margin-bottom: 0;
        }
      }
    }
    
    .card-footer {
      padding: 15px;
      background-color: rgba(117, 59, 189, 0.2);
      border-top: 1px solid #444;
      text-align: right;
    }
  }
  }

  @include lt-tablet {
  }
}
</style>