<template>
  <div class="bio-container">
    <div class="bio-text" ref="bioTextRef">
      <p 
        v-for="(paragraph, index) in bio.content" 
        :key="index"
      >
        <template v-for="(node, nodeIndex) in paragraph.content" :key="nodeIndex">
          <!-- Text node with links and colors -->
          <span v-html="processNode(node)"></span>
        </template>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from '#app'; // For Nuxt 3

const props = defineProps({
  bio: {
    type: Object,
    required: true
  }
});

const router = useRouter();
const bioTextRef = ref(null);

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
      const target = linkMark.attrs.target ? linkMark.attrs.target : '_self';
      const targetAttr = ` target="${target}"`;
      const rel = target === '_blank' ? ' rel="noopener noreferrer"' : '';
      const colorStyle = color ? ` style="color: ${color}"` : '';
      
      // Add data attributes to help with handling
      const isInternalLink = href.startsWith('/');
      const dataAttr = isInternalLink ? ` data-internal-link="true" data-target="${target}"` : '';
      
      return `<a href="${href}"${targetAttr}${rel}${colorStyle}${dataAttr}>${text}</a>`;
    } else if (color) {
      // Just color, no link
      return `<span style="color: ${color}">${text}</span>`;
    }
    
    // Handle other formatting marks (bold, italic, etc.)
    return applyTextFormatting(text, node.marks);
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
  
  const internalLinks = bioTextRef.value.querySelectorAll('a[data-internal-link="true"]');
  internalLinks.forEach(link => {
    const target = link.getAttribute('data-target');
    
    // Only handle client-side navigation for internal links that should open in the same tab
    if (target === '_self') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        router.push(href);
      });
    }
    // For _blank targets, let the browser handle it naturally (will open in new tab)
  });
};

// Get reference to the bio-text element and process links
onMounted(() => {
  processInternalLinks();
});

// Re-process links when the bio content changes
watch(() => props.bio, () => {
  setTimeout(processInternalLinks, 0);
}, { deep: true });
</script>

<style scoped lang="scss">
.bio-container {
  padding: 0 2rem;
  max-width: 800px;
  margin: 0 auto;
  font-weight: 700;

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
      color: var(--color-white);

      &:hover {
        color: var(--color-white) !important;
        text-decoration: underline;
      }
    }
  }
}
</style>