<template>
  <div 
    class="quote-animator"
    ref="container"
    v-if="canAnimateQuote"
    v-cloak
    :class="{ 'is-small-space': isSmallSpace }"
  >
    <div 
      class="text-container"
      ref="textContainer"
      :class="{ 'is-fading': isFading }"
      :style="{ 
        opacity: isReady && isCalculated && !isFading ? 1 : 0,
        visibility: isCalculated ? 'visible' : 'hidden'
      }"
    >
      <!-- Single template for all quotes with inline links where needed -->
      <div class="line">
        <template v-for="(line, lineIndex) in processedLines" :key="`line-${lineIndex}`">
          <template 
            v-for="(segment, segIndex) in line" 
            :key="`segment-${segIndex}`"
          >
            <!-- Only render segments that should be visible -->
            <template v-if="isSegmentVisible(lineIndex, segIndex)">
              <!-- For linked text -->
              <NuxtLink
                v-if="segment.link"
                :to="segment.link.href"
                :target="segment.link.target" 
                :rel="segment.link.target === '_blank' ? 'noopener noreferrer' : undefined"
                :style="{ 
                  color: segment.color,
                  fontSize: `${fontSize}px`,
                  fontWeight: segment.isBold ? '900' : 'inherit',
                  textDecoration: 'none',
                  display: 'inline',
                }"
                class="clickable-segment item link"
              >
                {{ getVisibleText(segment.text, lineIndex, segIndex) }}
              </NuxtLink>
              
              <!-- For plain text -->
              <span
                v-else
                class="item"
                :style="{ 
                  color: segment.color,
                  fontSize: `${fontSize}px`,
                  fontWeight: segment.isBold ? '900' : 'inherit',
                  textDecoration: 'none',
                  display: 'inline',
                }"
              >
                {{ getVisibleText(segment.text, lineIndex, segIndex) }}
              </span>
            </template>
          </template>
          <br v-if="lineIndex < processedLines.length - 1" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, nextTick } from 'vue'

const route = useRoute()
const canAnimateQuote = useState('can-animate-quote')
const resizeObserver = ref<ResizeObserver | null>(null)
const emit = defineEmits(['animationComplete'])
const isSmallSpace = ref(false);

interface LinkData {
  href?: string;
  target?: string;
  linktype?: string;
}

interface TextSegment {
  text: string;
  color: string;
  isBold?: boolean;
  link?: LinkData;
}

interface AnimationState {
  status: 'idle' | 'animating' | 'paused' | 'completed'
  currentLine: number
  currentSegment: number
  currentChar: number
}

const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
})

// const logState = (message: string) => {
//   console.log(`[QuoteAnimator] ${message}`, {
//     path: route.path,
//     canAnimateQuote: canAnimateQuote.value,
//     animationStatus: animationState.status,
//     blok: props.blok
//   })
// }

// Core refs
const container = ref<HTMLElement | null>(null)
const textContainer = ref<HTMLElement | null>(null)
const fontSize = ref(16)
const isReady = ref(false)
const currentQuoteIndex = ref(0)
const QUOTE_DISPLAY_DURATION = 5000 // 5 seconds between quotes

// Organize quotes - handle randomization and prioritization
const organizedQuotes = computed(() => {
  if (!props.blok.quote || !Array.isArray(props.blok.quote)) {
    return [];
  }
  
  let quotes = [...props.blok.quote]; // Create a copy to avoid mutating the original
  
  // Log original quotes
  // console.log('Original quotes:', quotes.map(q => ({
  //   text: q.title?.content?.[0]?.content?.[0]?.text?.substring(0, 20) + '...',
  //   prioritizeQuote: q.prioritizeQuote
  // })));
  
  // Apply randomization if enabled
  if (props.blok.randomizeQuotes) {
    // Shuffle the array using Fisher-Yates algorithm
    for (let i = quotes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [quotes[i], quotes[j]] = [quotes[j], quotes[i]];
    }
    
    // Log after randomization
    // console.log('After randomization:', quotes.map(q => ({
    //   text: q.title?.content?.[0]?.content?.[0]?.text?.substring(0, 20) + '...',
    //   prioritizeQuote: q.prioritizeQuote
    // })));
  }
  
  // Handle prioritization - explicitly check for true (to handle undefined/false correctly)
  const hasPriorityQuotes = quotes.some(quote => quote.prioritizeQuote === true);
  if (hasPriorityQuotes) {
    // Separate into priority and non-priority quotes
    const priorityQuotes = quotes.filter(quote => quote.prioritizeQuote === true);
    const regularQuotes = quotes.filter(quote => quote.prioritizeQuote !== true);
    
    // Combine with priority quotes first
    quotes = [...priorityQuotes, ...regularQuotes];
    
    // Log final organized quotes
    // console.log('Final organized quotes:', quotes.map(q => ({
    //   text: q.title?.content?.[0]?.content?.[0]?.text?.substring(0, 20) + '...',
    //   prioritizeQuote: q.prioritizeQuote
    // })));
  }
  
  return quotes;
})

const animationState = reactive<AnimationState>({
  status: 'idle',
  currentLine: 0,
  currentSegment: 0,
  currentChar: 0
})

// Process the lines
const processedLines = computed<TextSegment[][]>(() => {
  const lines: TextSegment[][] = [];
  let currentLine: TextSegment[] = [];
  
  try {
    // Get current quote from the organized quotes array
    const currentQuote = organizedQuotes.value[currentQuoteIndex.value];
    const content = currentQuote?.title?.content?.[0]?.content || [];
    
    content.forEach((item: any) => {
      if (item.type === 'text') {
        // Find color mark and bold mark
        const colorMark = item.marks?.find((mark: any) => 
          mark.type === 'textStyle' && mark.attrs?.color
        );
        const isBold = item.marks?.some((mark: any) => mark.type === 'bold') || false;
        
        // Find link mark if it exists
        const linkMark = item.marks?.find((mark: any) => mark.type === 'link');
        let linkData: LinkData | undefined = undefined;
        
        if (linkMark) {
          linkData = {
            href: linkMark.attrs.href,
            target: linkMark.attrs.target || '_self',
            linktype: linkMark.attrs.linktype
          };
        }
        
        currentLine.push({
          text: item.text,
          color: colorMark?.attrs?.color || 'var(--color-white)',
          isBold: isBold,
          link: linkData
        });
      } else if (item.type === 'hard_break') {
        if (currentLine.length) {
          lines.push([...currentLine]);
          currentLine = [];
        }
      }
    });
    
    if (currentLine.length) {
      lines.push(currentLine);
    }
  } catch (error) {
    // console.error('Error processing lines:', error);
  }

  return lines;
});

// Flag to control fade transition
const isFading = ref(false);

const cycleToNextQuote = async () => {
  // Reset animation state
  animationState.status = 'idle';
  
  // Start fade-out transition
  isFading.value = true;
  
  // Wait for fade-out to complete
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Change quote during invisible state
  currentQuoteIndex.value = (currentQuoteIndex.value + 1) % organizedQuotes.value.length;
  
  // Reset animation state for new quote
  animationState.currentLine = 0;
  animationState.currentSegment = 0;
  animationState.currentChar = 0;

  // Recalculate font size for new quote
  await calculateInitialFontSize();
  
  // End fade-out (will trigger fade-in)
  isFading.value = false;
  
  // Start animation for new quote
  await animateText();
};

// Check if a segment is visible
const isSegmentVisible = (lineIndex: number, segmentIndex: number): boolean => {
  if (lineIndex < animationState.currentLine) return true; // Already completed lines
  if (lineIndex > animationState.currentLine) return false; // Not yet reached lines
  if (segmentIndex < animationState.currentSegment) return true; // Already completed segments
  if (segmentIndex > animationState.currentSegment) return false; // Not yet reached segments
  return animationState.currentChar > 0; // At least one character is visible
};

// Text visibility handler
const getVisibleText = (text: string, lineIndex: number, segmentIndex: number): string => {
  if (lineIndex < animationState.currentLine) return text; // Return full text for completed lines
  if (lineIndex > animationState.currentLine) return ''; // Return empty string for upcoming lines
  if (segmentIndex < animationState.currentSegment) return text; // Return full text for completed segments
  if (segmentIndex > animationState.currentSegment) return ''; // Return empty string for upcoming segments
  return text.slice(0, animationState.currentChar); // Return the visible part of the current segment
};

// Animation control
const TYPING_SPEED = 50; // Adjust this value to control typing speed

const animateText = async () => {
  // Prevent starting a new animation if one is already running
  if (animationState.status === 'animating') return;

  animationState.status = 'animating';

  for (let lineIdx = 0; lineIdx < processedLines.value.length; lineIdx++) {
    animationState.currentLine = lineIdx;
    const line = processedLines.value[lineIdx];

    for (let segIdx = 0; segIdx < line.length; segIdx++) {
      animationState.currentSegment = segIdx;
      const segment = line[segIdx];

      for (let charIdx = 0; charIdx <= segment.text.length; charIdx++) {
        if (animationState.status === 'paused') {
          await new Promise(resolve => {
            const checkInterval = setInterval(() => {
              if (animationState.status === 'animating') {
                clearInterval(checkInterval);
                resolve(true);
              }
            }, 100);
          });
        }

        animationState.currentChar = charIdx;
        await new Promise(resolve => setTimeout(resolve, TYPING_SPEED)); // Use TYPING_SPEED here
      }
    }

    // Wait for a short duration before moving to the next line
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  animationState.status = 'completed';
  emit('animationComplete');

  // Get timeToShow from current quote or use QUOTE_DISPLAY_DURATION as fallback
  const currentQuote = organizedQuotes.value[currentQuoteIndex.value];
  const timeToShow = currentQuote?.timeToShow ? parseInt(currentQuote.timeToShow) : QUOTE_DISPLAY_DURATION;
  
  // Wait for display duration before cycling to next quote
  await new Promise(resolve => setTimeout(resolve, timeToShow));
  cycleToNextQuote(); // This will now always rewind before cycling
};

const isCalculated = ref(false)
// Font size calculation
const calculateInitialFontSize = async () => {
  if (!container.value || !textContainer.value) return;

  textContainer.value.style.visibility = 'hidden';
  isReady.value = false;

  // Start with maximum possible size
  fontSize.value = 100;

  await new Promise(requestAnimationFrame);

  const parent = container.value.parentElement;
  if (!parent) return;

  // Calculate available space
  const parentWidth = parent.clientWidth;
  const parentHeight = parent.clientHeight;
  const windowWidth = window.innerWidth; // Get the current window width

  isSmallSpace.value = windowWidth >= 600 && parentWidth < 767;

  // console.log(`Parent Width: ${parentWidth}, Parent Height: ${parentHeight}`);

  const availableWidth = (parentWidth * 0.5) - 80;
  const availableHeight = parentHeight * 0.45; // Reduce height ratio to make font smaller

  // Get text dimensions
  const textWidth = textContainer.value.scrollWidth;
  const textHeight = textContainer.value.scrollHeight;

  // Calculate optimal size
  const widthRatio = availableWidth / textWidth;
  const heightRatio = availableHeight / textHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  // Apply scaling and constraints
  fontSize.value = Math.floor(Math.min(
    Math.max(100 * (ratio * 0.45), 48),  // Keep minimum 48px
    80  // New maximum of 80px
  ));

  isCalculated.value = true;
  textContainer.value.style.visibility = 'visible';
  isReady.value = true;
};

// Improved resize handler with type safety
let resizeTimeout: ReturnType<typeof setTimeout>
let lastWidth = 0
let lastHeight = 0

// Usage in your resize handler
const handleResize = () => {
  clearTimeout(resizeTimeout);

  resizeTimeout = setTimeout(() => {
    if (!container.value) return;

    const newWidth = container.value.clientWidth;
    const newHeight = container.value.clientHeight;

    // Only recalculate on significant changes
    const significantChange = 
      Math.abs(newWidth - lastWidth) > 20 || 
      Math.abs(newHeight - lastHeight) > 20;

    if (significantChange) {
      lastWidth = newWidth;
      lastHeight = newHeight;
      calculateInitialFontSize(); // Call to recalculate font size
    }
  }, 100);
};

const setupResizeObserver = () => {
  // console.log('Setting up resize observer');

  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
    resizeObserver.value = null;
  }

  if (!container.value || !container.value.parentElement) {
    // console.log('Container or parent not available for resize observer');
    return;
  }

  try {
    resizeObserver.value = new ResizeObserver(() => {
      // console.log('Resize observed');
      handleResize(); // Call the resize handler
    });

    resizeObserver.value.observe(container.value);
    resizeObserver.value.observe(container.value.parentElement);
  } catch (error) {
    // console.error('Error setting up resize observer:', error);
  }
};

// Removed rewindAnimation in favor of simple fade transition

// Lifecycle hooks
onMounted(() => {
  // logState('Component Mounted')

  // Setup resize observer
  nextTick(() => {
    setupResizeObserver()

    if (canAnimateQuote.value && route.path === '/') {
      nextTick(async () => {
        if (container.value) {
          // logState('Starting initial animation')
          await calculateInitialFontSize()
          await new Promise(resolve => setTimeout(resolve, 300))
          animateText()
        }
      })
    }
  })

  // Start animation if we can
  if (canAnimateQuote.value && route.path === '/') {
    nextTick(async () => {
      if (container.value) {
        // logState('Starting initial animation')
        await calculateInitialFontSize()
        await new Promise(resolve => setTimeout(resolve, 300))
        animateText()
      }
    })
  }

  // Watch for animation state changes
  watch(canAnimateQuote, async (newValue) => {
    // logState(`canAnimateQuote changed to: ${newValue}`)
    
    if (newValue && route.path === '/') {
      await nextTick()
      if (container.value) {
        // logState('Starting animation sequence')
        animationState.status = 'idle'
        animationState.currentLine = 0
        animationState.currentSegment = 0
        animationState.currentChar = 0
        
        await calculateInitialFontSize()
        await new Promise(resolve => setTimeout(resolve, 300))
        animateText()
      }
    }
  })
})

// Watch for container changes
watch(() => container.value, (newContainer) => {
  if (newContainer) {
    // console.log('Container ref changed - reinitializing resize observer')
    setupResizeObserver()
  }
})

// Expose methods for programmatic control if needed
defineExpose({
  pause: () => { animationState.status = 'paused' },
  resume: () => { animationState.status = 'animating' },
  reset: () => {
    animationState.status = 'idle'
    animationState.currentLine = 0
    animationState.currentSegment = 0
    animationState.currentChar = 0
    animateText()
  }
})
</script>



<style lang="scss" scoped>
[v-cloak] {
  display: none;
}
.quote-animator {
  position: relative;
  // width: 50vw;
  height: calc(40vh - 70px);
  display: flex;
  align-items: flex-start;
  box-sizing: border-box;
  font-weight: 600;
  white-space: pre-wrap;
  // Try to fade in or sldie in

  .text-container {
    width: 100%;
    padding-left: 30px;
    padding-right: 30px;
    padding-top: 30px;
    transition: opacity 0.3s var(--easing-motion),
    visibility 0.3s var(--easing-motion),
    padding 0.3s var(--easing-motion),
    width 0.4s;
    
    &.is-fading {
      opacity: 0 !important;
      transition: opacity 0.3s var(--easing-motion);
    }

    .line {
      line-height: 1;
      text-align: left;
      box-sizing: border-box !important;
      letter-spacing: -1px;
      display: block;
      
      .item {
        display: inline;
        transition: font-size 0.4s var(--easing-motion),
        color 0.4s var(--easing-motion),
        opacity 0.4s var(--easing-motion) !important;
        font-size: 48px; /* Default size as fallback */
        max-font-size: 80px;
      }
      
      .clickable-segment {
        cursor: pointer;
        
        &:hover {
          color: white !important;
        }
      }
    }
  }

  @include lt-small-height {
    .text-container {
      padding-left: 20px;
      padding-right: 20px;
      margin-top: 0;
    }
  }

  @include lt-small-desktop {
    width: 100%;

    .text-container {
      padding-left: 30px;
      padding-right: 30px;
      // margin-top: 30px;

      .line {
        .item {
          font-size: 48px !important; 
        }
      }
    }

    &.is-small-space {
      .text-container {
        .line .item {
          font-size: 44px !important; 
          // background-color: red;
        }
      }
    }
    
  }

  @include lt-tablet {
    &.is-small-space {
      padding-top: 20px;

      .text-container {
        .line .item {
          font-size: 32px !important; 
          // background-color: red;
        }
      }
    }
  }

  @include lt-phone {

    // &.is-small-space {
      .text-container {
        padding-top: 20px;
        // .line span {
        //   font-size: 34px !important; 
        //   // background-color: red;
        // }
      }
    // }
  }

  @include phone-landscape {
    &.is-small-space {
      padding-top: 8px;

      .text-container {
        padding: 0 10px;
        .line {
          .item {
            font-size: 32px !important; 
          }
        }
      }
    }
  }

  @include lt-small-phone {
    height: auto;

    .text-container {
      padding-top: 30px;

      .line {
        .item {
          font-size: 36px !important; 
        }
      }
    }
  }

  @media only screen and (max-width:400px) {
    .text-container {
      padding-top: 20px;
      padding-left: 20px;

      .line {
        .item {
          font-size: 28px !important; 
        }
      }
    }
  }
}
</style>