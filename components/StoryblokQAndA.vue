<template>
  <div class="qa-section block-item">
    <h2 class="qa-header">{{ sectionTitle }}</h2>
    <div class="qa-list">
      <div 
        v-for="(qa, index) in qaItems" 
        :key="qa.questionKey || index"
        class="qa-container"
      >
        <div class="qa-item">
          <div class="question" v-html="qa.question" ref="questionRef"></div>
          <div class="answer" v-html="qa.answer" ref="answerRef"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from '#app'; // For Nuxt 3

const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
});

const router = useRouter();
const questionRef = ref([]);
const answerRef = ref([]);

// Get the section title directly from the Storyblok block
const sectionTitle = computed(() => {
  // Simply use the title as provided in Storyblok
  return props.blok.title || 'About';
});

// Process richtext data into question and answer pairs
const qaItems = computed(() => {
  if (!props.blok?.text?.content) return [];
  
  const paragraphs = props.blok.text.content.filter(item => item.type === 'paragraph');
  const processedItems = [];
  
  // Process all paragraphs to find Q&A pairs
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const contents = paragraph.content || [];
    
    // Skip if no content
    if (!contents.length) continue;
    
    // Method 1: Check if this paragraph has a hard break (Q&A in single paragraph)
    const breakIndex = contents.findIndex(c => c.type === 'hard_break');
    
    if (breakIndex !== -1) {
      // Format 1: Question and answer in the same paragraph with hard break
      const questionParts = contents.slice(0, breakIndex);
      const answerParts = contents.slice(breakIndex + 1);
      
      if (questionParts.length && answerParts.length) {
        processedItems.push({
          questionParts,
          answerParts
        });
      }
    } 
    // Method 2: Check if this is a question paragraph followed by an answer paragraph
    else if (i < paragraphs.length - 1) {
      // Format 2: Question in one paragraph, answer in the next
      const questionParts = contents;
      const nextParagraph = paragraphs[i + 1];
      const answerParts = nextParagraph.content || [];
      
      // If this is a valid Q&A pair, add it and skip the next paragraph
      if (questionParts.length && answerParts.length && 
          !answerParts.some(part => part.type === 'hard_break')) {
        processedItems.push({
          questionParts,
          answerParts
        });
        i++; // Skip the next paragraph as we've used it as the answer
      }
    }
  }
  
  // Process each Q&A pair into HTML
  return processedItems.map(item => {
    // Generate HTML for question with styling
    const questionHTML = item.questionParts.map(part => {
      if (part.type !== 'text') return '';
      
      let text = part.text || '';
      let color = null;
      
      // Apply styling from marks if present
      if (part.marks) {
        const colorMark = part.marks.find(m => m.type === 'textStyle');
        const linkMark = part.marks.find(m => m.type === 'link');
        
        if (colorMark && colorMark.attrs?.color) {
          color = colorMark.attrs.color;
        }
        
        if (linkMark) {
          const target = linkMark.attrs.target ? ` target="${linkMark.attrs.target}"` : '';
          const rel = linkMark.attrs.target === '_blank' ? ' rel="noopener noreferrer"' : '';
          const colorStyle = color ? ` style="color: ${color}"` : ` style="color: #5851ff"`;
          text = `<a href="${linkMark.attrs.href}"${target}${rel}${colorStyle}>${text}</a>`;
        } else if (color) {
          // Only add span if there's no link
          text = `<span style="color: ${color}">${text}</span>`;
        } else {
          // Default question color
          text = `<span style="color: #5851ff">${text}</span>`;
        }
      } else {
        // Default question color
        text = `<span style="color: #5851ff">${text}</span>`;
      }
      
      return text;
    }).join('');
    
    // Generate HTML for answer with styling
    const answerHTML = item.answerParts.map(part => {
      if (part.type !== 'text') return '';
      
      let text = part.text || '';
      let color = null;
      
      // Apply styling from marks if present
      if (part.marks) {
        const colorMark = part.marks.find(m => m.type === 'textStyle');
        const linkMark = part.marks.find(m => m.type === 'link');
        
        if (colorMark && colorMark.attrs?.color) {
          color = colorMark.attrs.color;
        }
        
        if (linkMark) {
          const target = linkMark.attrs.target ? ` target="${linkMark.attrs.target}"` : '';
          const rel = linkMark.attrs.target === '_blank' ? ' rel="noopener noreferrer"' : '';
          const colorStyle = color ? ` style="color: ${color}"` : ` style="color: #f2a900"`;
          text = `<a href="${linkMark.attrs.href}"${target}${rel}${colorStyle}>${text}</a>`;
        } else if (color) {
          // Only add span if there's no link
          text = `<span style="color: ${color}">${text}</span>`;
        } else {
          // Default answer color
          text = `<span style="color: #f2a900">${text}</span>`;
        }
      } else {
        // Default answer color
        text = `<span style="color: #f2a900">${text}</span>`;
      }
      
      return text;
    }).join('');

    // Plain text for key
    const questionText = item.questionParts
      .filter(part => part.type === 'text')
      .map(part => part.text || '')
      .join('');

    return {
      question: questionHTML,
      answer: answerHTML,
      // Include plain text key for v-for :key binding
      questionKey: questionText
    };
  }).filter(qa => qa.question && qa.answer);
});

// Function to process links for internal navigation
const processInternalLinks = (element) => {
  if (!element) return;
  
  // Only target internal links that don't have target="_blank"
  const internalLinks = element.querySelectorAll('a[href^="/"]:not([target="_blank"])');
  internalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      router.push(href);
    });
  });
};

// Process all the question elements
const processAllLinks = () => {
  // Process question sections
  if (questionRef.value && questionRef.value.length) {
    questionRef.value.forEach(el => {
      if (el) processInternalLinks(el);
    });
  }
  
  // Process answer sections
  if (answerRef.value && answerRef.value.length) {
    answerRef.value.forEach(el => {
      if (el) processInternalLinks(el);
    });
  }
};

// Process links on mount
onMounted(() => {
  setTimeout(processAllLinks, 0);
});

// Re-process links when content changes
watch(() => props.blok, () => {
  setTimeout(processAllLinks, 0);
}, { deep: true });
</script>

<style scoped lang="scss">
.qa-section {
  :deep(a) {
      text-decoration: none;
      transition: color 0.4s var(--easing-motion);

      &:hover {
        color: var(--color-white) !important;
        text-decoration: underline;
      }
    }


.qa-header {
  font-size: 1.5rem;
  // font-family: 'PS260', sans-serif;
  // font-weight: normal;

  color: var(--color-white);
  margin: 2rem auto 0;
  padding: 0 2rem;
  max-width: 800px;
  font-family: "PS260", sans-serif;
  font-weight: normal;
}

.qa-container {
  padding: 0 2rem;
  max-width: 800px;
  margin: 0 auto;
  font-weight: 700;
  margin-bottom: 5rem;

  &:last-child {
    margin-bottom: 0;
  }
  
  .question {
    color: #5851ff;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }
  
  .answer {
    color: #f2a900;
    font-size: 1.1rem;
    line-height: 1.4;
  }
}
}
</style>