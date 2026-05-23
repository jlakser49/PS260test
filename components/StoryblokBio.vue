<template>
  <div class="bio-section block-item">
    <div class="bio-container">
      <div class="bio-text" ref="bioTextRef">
        <p 
          v-for="(paragraph, index) in bioContent.content" 
          :key="index"
        >
          <template v-for="(node, nodeIndex) in paragraph.content" :key="nodeIndex">
            <!-- Text node with links and colors -->
            <span v-html="processNode(node)"></span>
          </template>
        </p>
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
const bioTextRef = ref(null);

// Extract bio content from Storyblok richtext
const bioContent = computed(() => {
  return props.blok.text || { content: [] };
});

// Function to process a single node
const processNode = (node) => {
  if (node.type !== 'text') return '';
  
  let text = node.text || '';
  let color = null;
  
  if (node.marks && node.marks.length > 0) {
    // Check for color styling
    const colorMark = node.marks.find(m => m.type === 'textStyle' && m.attrs?.color);
    if (colorMark) {
      color = colorMark.attrs.color;
    }
    
    // Check for link
    const linkMark = node.marks.find(m => m.type === 'link');
    if (linkMark) {
      const href = linkMark.attrs.href;
      const target = linkMark.attrs.target ? ` target="${linkMark.attrs.target}"` : '';
      const rel = linkMark.attrs.target === '_blank' ? ' rel="noopener noreferrer"' : '';
      const colorStyle = color ? ` style="color: ${color}"` : ` style="color: var(--color-white)"`;
      
      // Format with link
      text = `<a href="${href}"${target}${rel}${colorStyle}>${text}</a>`;
    } else if (color) {
      // Just color, no link
      text = `<span style="color: ${color}">${text}</span>`;
    } else {
      // Default text color
      text = `<span style="color: var(--color-white)">${text}</span>`;
    }
    
    // Apply other formatting (bold, italic, etc.)
    text = applyTextFormatting(text, node.marks);
  } else {
    // Default color for plain text
    text = `<span style="color: var(--color-white)">${text}</span>`;
  }
  
  return text;
};

// Function to apply text formatting (bold, italic, etc.)
const applyTextFormatting = (text, marks) => {
  if (!marks) return text;
  
  let result = text;
  
  marks.forEach(mark => {
    switch(mark.type) {
      case 'bold':
        result = `<strong>${result}</strong>`;
        break;
      case 'italic':
        result = `<em>${result}</em>`;
        break;
      case 'underline':
        result = `<u>${result}</u>`;
        break;
      case 'strike':
        result = `<s>${result}</s>`;
        break;
      case 'code':
        result = `<code>${result}</code>`;
        break;
    }
  });
  
  return result;
};

// Process all internal links in the component
const processInternalLinks = () => {
  if (!bioTextRef.value) return;
  
  // Target internal links that don't have target="_blank"
  const internalLinks = bioTextRef.value.querySelectorAll('a[href^="/"]:not([target="_blank"])');
  internalLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      router.push(href);
    });
  });
};

// Get reference to the bio-text element and process links
onMounted(() => {
  processInternalLinks();
});

// Re-process links when the bio content changes
watch(() => props.blok, () => {
  setTimeout(processInternalLinks, 0);
}, { deep: true });
</script>
  
<style scoped lang="scss">
.bio-section {
  .bio-container {
    padding: 0 2rem;
    max-width: 800px;
    font-weight: 700;

    margin: 0 auto;

    .bio-text {
      color: var(--color-white);
      font-size: 1.1rem;
      line-height: 1.5;
    
      p {
        margin: 0 0 1rem 0;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    
      :deep(a) {
        text-decoration: none;
        transition: color 0.4s var(--easing-motion);
        
        &:hover {
          color: var(--color-white) !important;
          text-decoration: underline;
        }
      }
    }
    
    .font-bold {
      font-weight: 700;
    }
    
    .font-italic {
      font-style: italic;
    }
    
    .underline {
      text-decoration: underline;
    }
    
    .line-through {
      text-decoration: line-through;
    }
    
    .font-mono {
      font-family: monospace;
    }
  }
}
</style>