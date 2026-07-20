<template>
  <div :class="['editor-page', { 'has-no-qa-no-bio': noQANoBio, 'reel-hovered': isAnyReelHovered }]">
    <div v-if="pending" class="loading-container">
      Loading...
    </div>

    <template v-else>
      <StickyVideo
        v-if="firstVideo"
        :video-path="firstVideo.media_file"
        :placeholder-image="firstVideo.thumbnail || ''"
        :name="editorName"
        :is-dimmed="isAnyReelHovered"
      />
      <div v-if="data" class="reels-container" ref="reelsContainerRef">
        <ReelVideo
          v-for="(media, i) in remainingVideos"
          :key="media.id"
          :media="media"
          :is-first="i === 0"
          :editor-name="route.params.name"
          @hover="handleReelHover"
          @unhover="handleReelUnhover"
          ref="reelRefs"
          :class="reelAspectClass(media)"
          :style="reelGridStyle(media)"
        />
      </div>

      <div class="story-content" v-if="!noQANoBio">
        <div class="qa-block">
          <h2 v-if="qaItems.length > 0" class="qa-header">Q&amp;A with {{ editorName }}</h2>
        
          <EditorQA
            :question="qa.question"
            :answer="qa.answer"
            v-if="qaItems.length > 0"
            v-for="qa in qaItems" 
            :key="qa.questionKey"
          />
      
        </div>
  
        <div v-if="hasBio" class="bio-block">
          <EditorBio 
            v-if="hasBio"
            :bio="data.Bio"
          />
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
const route = useRoute();
const videoRefs = ref({});
const sections = ref([]);
let videoObserver = null;
const isAnyReelHovered = ref(false);

const handleReelHover = () => {
  isAnyReelHovered.value = true;
};

const handleReelUnhover = () => {
  isAnyReelHovered.value = false;
};

// ─────────────────────────────────────────────────────────────────────────────
// CASSANDRA JOLIE — offline, no Storyblok.
// MAIN_REEL_ID   → primary scrollable reel grid
// STICKY_REEL_ID → large hero/banner video pinned at the top
// ─────────────────────────────────────────────────────────────────────────────
const CASS_MAIN_REEL_ID   = '163'; // ← CASSANDRA JOLIE MAIN REEL ID
const CASS_STICKY_REEL_ID = '165'; // ← CASSANDRA JOLIE HERO/BANNER REEL ID

// Fetch data using useAsyncData
const { data, error, pending } = await useAsyncData(
  `editor-${route.params.name}`,
  async () => {
    // ── Offline bypass for Cassandra Jolie ───────────────────────────────
    if (route.params.name === 'cassandra-jolie') {
      let reelData = null;
      let stickyVideo = null;
      let usingStickyOverride = false;

      if (CASS_MAIN_REEL_ID) {
        reelData = await $fetch('/api/simian', {
          method: 'POST',
          body: { reelId: CASS_MAIN_REEL_ID }
        });
      }

      if (CASS_STICKY_REEL_ID) {
        try {
          const stickyReelData = await $fetch('/api/simian', {
            method: 'POST',
            body: { reelId: CASS_STICKY_REEL_ID }
          });
          if (stickyReelData?.root?.media) {
            if (Array.isArray(stickyReelData.root.media) && stickyReelData.root.media.length > 0) {
              stickyVideo = stickyReelData.root.media[0];
              usingStickyOverride = true;
            } else if (typeof stickyReelData.root.media === 'object') {
              stickyVideo = stickyReelData.root.media;
              usingStickyOverride = true;
            }
          }
        } catch (err) {
          console.error('Error loading Cassandra sticky reel:', err);
        }
      }

      const CASS_BIO = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: "Cassandra “Cas” Jolie brings the rare combination of editor, designer, animator, and artist. Her work for brands including META, Hinge, Champs, NASA, Capitol Records, and Def Jam Recordings is rooted in culture, design, and emotion. Known for her fluency in short-form and digital content, Cas knows how to build work that earns attention." }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: "A proud Boricua, Cas pairs a designer's eye with an editor's sensibility, bringing depth, style, and intention to every project. When she's not shaping stories on screen, she's likely making them on stage with her band." }]
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: "“Honestly, I think being an artist is just in my blood.” — Cas" }]
          }
        ]
      };

      const CASS_QA = [
        {
          q: 'What would people be surprised to know about you?',
          a: "I am a musician and I just went on tour! I've had a really beautiful music journey writing songs, performing in live venues and had a few videos go viral on Tiktok."
        },
        {
          q: "What's the most memorable feedback you've received from a director or client?",
          a: "Someone once told me I'm super intentional and thoughtful and they felt it in how I created my decks and walked them through the phases of the work. They told me to never lose my love for creating and storytelling."
        },
        {
          q: 'If your computer could talk, what do you think it would say about you as an editor?',
          a: 'I think my computer would ask to clear my screenshots off my desktop screen.'
        },
        {
          q: "If you weren't an editor, what would you be doing?",
          a: "I think I'd be a sous chef in a 3 star Michelin rated restaurant <3"
        },
        {
          q: "When you need to reset creatively, what's your go-to hobby or activity?",
          a: "I love cooking! There's something about making a yummy meal and sitting on the couch in pjs that resets my whole brain."
        }
      ];

      const CASS_CONTENT = {
        type: 'doc',
        content: CASS_QA.map(({ q, a }) => ({
          type: 'paragraph',
          content: [
            { type: 'text', text: q },
            { type: 'hard_break' },
            { type: 'text', text: a }
          ]
        }))
      };

      return {
        Name: 'Cassandra Jolie',
        Bio: CASS_BIO,
        Content: CASS_CONTENT,
        reelData,
        stickyVideo,
        usingStickyOverride
      };
    }
    // ── End offline bypass ───────────────────────────────────────────────

    const storyblokApi = useStoryblokApi();

    try {
      // First, get all editors to find the matching person
      const { data: editorsData } = await storyblokApi.get('cdn/stories/editors', {
        version: 'published'
      });

      // Find the matching person in the categories
      let matchingPerson = null;
      for (const category of editorsData.story.content.body) {
        const person = category.Person.find(p => 
          p.Name.toLowerCase().replace(/\s+/g, '-') === route.params.name
        );
        if (person) {
          matchingPerson = person;
          break;
        }
      }

      if (!matchingPerson) {
        throw createError({
          statusCode: 404,
          message: 'Editor not found'
        });
      }

      console.log("Editor found:", matchingPerson.Name);
      console.log("SimianReelID:", matchingPerson.SimianReelID);
      console.log("StickySimianReelID:", matchingPerson.StickySimianReelID || 'Not set');

      // Get Simian reel data based on SimianReelID
      let reelData = null;
      if (matchingPerson.SimianReelID) {
        reelData = await $fetch('/api/simian', {
          method: 'POST',
          body: {
            reelId: matchingPerson.SimianReelID
          }
        });
        console.log(`Main reel data loaded with ${reelData?.root?.media?.length || 0} videos`);
      }

      // Check for StickySimianReelID and fetch if available
      let stickyVideo = null;
      let usingStickyOverride = false;
      
      if (matchingPerson.StickySimianReelID) {
        // console.log(`Attempting to load sticky reel ID: ${matchingPerson.StickySimianReelID}`);
        
        try {
          const stickyReelData = await $fetch('/api/simian', {
            method: 'POST',
            body: {
              reelId: matchingPerson.StickySimianReelID
            }
          });
          
          // console.log(`Sticky reel response:`, JSON.stringify(stickyReelData).substring(0, 100) + '...');
          
          // Check if we have valid media data in the sticky reel
          if (stickyReelData && stickyReelData.root && stickyReelData.root.media) {
            // Handle both array and single object cases
            if (Array.isArray(stickyReelData.root.media) && stickyReelData.root.media.length > 0) {
              stickyVideo = stickyReelData.root.media[0];
              usingStickyOverride = true;
              // console.log(`Found sticky video (array): ${stickyVideo.title || 'Untitled'}`);
            } 
            else if (typeof stickyReelData.root.media === 'object') {
              stickyVideo = stickyReelData.root.media;
              usingStickyOverride = true;
              // console.log(`Found sticky video (object): ${stickyVideo.title || 'Untitled'}`);
            }
            else {
              console.warn(`Sticky reel has unexpected media format`);
            }
          } else {
            console.warn(`Sticky reel data is missing the expected structure`);
          }
        } catch (err) {
          console.error(`Error loading sticky reel:`, err);
        }
      }

      return {
        ...matchingPerson,
        reelData,
        stickyVideo,
        usingStickyOverride
      };
    } catch (err) {
      console.error("Error fetching editor data:", err);
      throw createError({
        statusCode: err.statusCode || 500,
        message: err.message || 'Failed to load editor data'
      });
    }
  }
);

// Computed properties
const firstVideo = computed(() => {
  // First priority: use sticky video if available
  if (data.value?.stickyVideo) {
    // console.log(`Using sticky video override for featured position`);
    return data.value.stickyVideo;
  }
  
  // Second priority: use first video from main reel
  if (data.value?.reelData?.root?.media) {
    const mediaData = data.value.reelData.root.media;
    
    if (Array.isArray(mediaData) && mediaData.length > 0) {
      // console.log(`Using first video from main reel for featured position`);
      return mediaData[0];
    }
    else if (typeof mediaData === 'object') {
      // console.log(`Using single video from main reel for featured position`);
      return mediaData;
    }
  }
  
  console.log("No videos available for featured position");
  return null;
});

const remainingVideos = computed(() => {
  if (!data.value?.reelData?.root?.media) {
    return [];
  }
  
  const mediaData = data.value.reelData.root.media;
  
  // Handle different data formats
  let videos = [];
  if (Array.isArray(mediaData)) {
    videos = mediaData;
  } else if (typeof mediaData === 'object') {
    videos = [mediaData]; // Convert single object to array
  }
  
  // If using a sticky override, return ALL main reel videos
  if (data.value?.usingStickyOverride) {
    // console.log(`Using sticky override - returning all ${videos.length} videos from main reel`);
    return videos;
  }
  
  // Otherwise, skip the first video (which is already used as featuredVideo)
  if (videos.length > 1) {
    // console.log(`No sticky override - returning ${videos.length - 1} videos from main reel (skipping first)`);
    return videos.slice(1);
  }
  
  // console.log(`Main reel has only one video which is already featured`);
  return [];
});

const editorName = computed(() => {
  return data.value?.Name || '';
});

const qaItems = computed(() => {
  if (!data.value?.Content?.content) return [];
  
  return data.value.Content.content
    .filter(item => item.type === 'paragraph' && item.content?.length >= 2)
    .map(paragraph => {
      const contents = paragraph.content;
      
      // Find question parts and their styling (before hard break)
      const breakIndex = contents.findIndex(c => c.type === 'hard_break');
      const questionParts = breakIndex !== -1 
        ? contents.slice(0, breakIndex) 
        : (contents.length === 1 ? contents : [contents[0]]);
      
      // Find answer parts (after hard break)
      const answerParts = breakIndex !== -1 
        ? contents.slice(breakIndex + 1) 
        : [];

      // Generate HTML for question with styling
      const questionHTML = questionParts.map(part => {
        let text = part.text || '';
        let color = null;
        
        // Apply styling from marks if present
        if (part.marks) {
          const colorMark = part.marks.find(m => m.type === 'textStyle');
          const linkMark = part.marks.find(m => m.type === 'link');
          
          if (colorMark) {
            color = colorMark.attrs.color;
          }
          
          if (linkMark) {
            const target = linkMark.attrs.target ? ` target="${linkMark.attrs.target}"` : '';
            const colorStyle = color ? ` style="color: ${color}"` : '';
            text = `<a href="${linkMark.attrs.href}"${target}${colorStyle}>${text}</a>`;
          } else if (color) {
            // Only add span if there's no link
            text = `<span style="color: ${color}">${text}</span>`;
          }
        }
        
        return text;
      }).join('');
      
      // Generate HTML for answer with styling
      const answerHTML = answerParts.map(part => {
        let text = part.text || '';
        let color = null;
        
        // Apply styling from marks if present
        if (part.marks) {
          const colorMark = part.marks.find(m => m.type === 'textStyle');
          const linkMark = part.marks.find(m => m.type === 'link');
          
          if (colorMark) {
            color = colorMark.attrs.color;
          }
          
          if (linkMark) {
            const target = linkMark.attrs.target ? ` target="${linkMark.attrs.target}"` : '';
            const colorStyle = color ? ` style="color: ${color}"` : '';
            text = `<a href="${linkMark.attrs.href}"${target}${colorStyle}>${text}</a>`;
          } else if (color) {
            // Only add span if there's no link
            text = `<span style="color: ${color}">${text}</span>`;
          }
        }
        
        return text;
      }).join('');

      // Plain text for key
      const questionText = questionParts.map(part => part.text || '').join('');

      return {
        question: questionHTML,
        answer: answerHTML,
        // Include plain text key for v-for :key binding
        questionKey: questionText
      };
    })
    .filter(qa => qa.question && qa.answer);
});

const isContentEmpty = (content) => {
  return !content || 
    (content.type === 'doc' && 
     (!content.content?.length || 
      (content.content.length === 1 && 
       content.content[0].type === 'paragraph' && 
       !content.content[0].content)));
};

const hasQA = computed(() => {
  const content = data.value?.Content;
  if (isContentEmpty(content)) return false;

  const contentArray = content.content || [];
  return contentArray.some(item => 
    item.type === 'paragraph' && 
    item.content?.length > 0 && 
    item.content.some(c => c.text?.trim())
  );
});

const hasBio = computed(() => {
  // Check if Bio exists
  if (!data.value?.Bio) return false;
  
  // Check if Bio has the correct structure
  if (data.value.Bio.type !== 'doc') return false;
  if (!Array.isArray(data.value.Bio.content)) return false;
  
  // Check if content array is empty
  if (data.value.Bio.content.length === 0) return false;
  
  // Check for empty paragraphs
  const hasNonEmptyContent = data.value.Bio.content.some(item => {
    // Check if paragraph has content
    if (item.type === 'paragraph') {
      // If paragraph has no content array, it's empty
      if (!Array.isArray(item.content)) return false;
      
      // If content array exists but is empty, it's empty
      if (item.content.length === 0) return false;
      
      // Check if any text content exists
      return item.content.some(textItem => 
        textItem.type === 'text' && textItem.text && textItem.text.trim() !== ''
      );
    }
    
    // For non-paragraph elements, assume they have content
    return true;
  });
  
  return hasNonEmptyContent;
});

const noQANoBio = computed(() => {
  return !hasQA.value && !hasBio.value;
});

const reelAspectClass = (media) => {
  const w = parseInt(media.media_width || 0);
  const h = parseInt(media.media_height || 0);
  return h > w && w > 0 ? 'portrait' : '';
};

// ── Masonry grid ─────────────────────────────────────────────────────────────
// CSS Grid with dense packing + a fine-grained row unit: each item gets a
// grid-column span (2 or 3 of 6 columns) and a computed grid-row span sized to
// its real aspect ratio, so mixed 16:9/9:16/4:3 clips tile with no dead space.
const GRID_COLUMNS = 6;
const GRID_GAP = 5; // px, matches .reels-container gap
const ROW_UNIT = 1; // px, height of one implicit grid row
const MOBILE_BREAKPOINT = 850; // matches the lt-phone SCSS mixin

const reelsContainerRef = ref(null);
const containerWidth = ref(0);
const isMobileLayout = ref(false);

const measureGridLayout = () => {
  if (!reelsContainerRef.value) return;
  containerWidth.value = reelsContainerRef.value.clientWidth;
  isMobileLayout.value = window.innerWidth <= MOBILE_BREAKPOINT;
};

let gridResizeObserver = null;
let debouncedMeasure = null;

const spanColumnsFor = (media) => {
  if (isMobileLayout.value) return GRID_COLUMNS; // full width, single column on mobile
  return reelAspectClass(media) === 'portrait' ? 2 : 3;
};

const reelGridStyle = (media) => {
  const w = parseInt(media.media_width || 0);
  const h = parseInt(media.media_height || 0);
  const spanCols = spanColumnsFor(media);
  const style = { gridColumn: `span ${spanCols}` };

  if (w > 0 && h > 0) {
    // Fallback so the item has a sane height before the grid is measured client-side.
    style.aspectRatio = `${w}/${h}`;

    if (containerWidth.value > 0) {
      const colUnit = (containerWidth.value - (GRID_COLUMNS - 1) * GRID_GAP) / GRID_COLUMNS;
      const widthPx = spanCols * colUnit + (spanCols - 1) * GRID_GAP;
      const heightPx = widthPx * (h / w);
      const rowSpan = Math.max(1, Math.ceil((heightPx + GRID_GAP) / (ROW_UNIT + GRID_GAP)));
      style.gridRowEnd = `span ${rowSpan}`;
    }
  }

  return style;
};

// Intersection Observer setup
const setupVideoObserver = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target.querySelector('video');
      if (!video) return;
    });
  }, {
    threshold: 0.5
  });
  sections.value.forEach(section => observer.observe(section));
};

// Lifecycle hooks
onMounted(async () => {
  if (!error.value) {
    await nextTick();
    videoObserver = setupVideoObserver();
  }

  measureGridLayout();
  debouncedMeasure = () => {
    clearTimeout(debouncedMeasure._t);
    debouncedMeasure._t = setTimeout(measureGridLayout, 150);
  };
  window.addEventListener('resize', debouncedMeasure);
  if (window.ResizeObserver && reelsContainerRef.value) {
    gridResizeObserver = new ResizeObserver(measureGridLayout);
    gridResizeObserver.observe(reelsContainerRef.value);
  }
});

onBeforeUnmount(() => {
  if (videoObserver) {
    videoObserver.disconnect();
  }

  if (gridResizeObserver) {
    gridResizeObserver.disconnect();
  }

  if (process.client) {
    if (debouncedMeasure) {
      clearTimeout(debouncedMeasure._t);
      window.removeEventListener('resize', debouncedMeasure);
    }

    Object.values(videoRefs.value).forEach(video => {
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
    });
  }
});

useHead(() => ({
  title: data.value ? `${data.value.Name} | Editor` : 'Editor',
  meta: [
    {
      name: 'description',
      content: data.value?.Teaser || 'Editor reels'
    },
    {
      property: 'og:title',
      content: data.value ? `${data.value.Name} | Editor` : 'Editor'
    },
    {
      property: 'og:description',
      content: data.value?.Teaser || 'Editor reels'
    },
    {
      property: 'og:image',
      content: data.value?.Image?.filename || 'https://a-us.storyblok.com/f/1022510/2144x1342/27212be5e8/lockers.jpg'
    },
    {
      name: 'twitter:title',
      content: data.value ? `${data.value.Name} | Editor` : 'Editor'
    },
    {
      name: 'twitter:description',
      content: data.value?.Teaser || 'Editor reels'
    },
    {
      name: 'twitter:image',
      content: data.value?.Image?.filename || 'https://a-us.storyblok.com/f/1022510/2144x1342/27212be5e8/lockers.jpg'
    }
  ]
}));
</script>

<style lang="scss" scoped>
.editor-page {
  background: var(--color-black);
  min-height: var(--window-height);
  padding-bottom: 180px;

  .reels-container {
    position: relative;
    z-index: 30;
    margin-top: 345px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-auto-rows: 1px; /* fine-grained track height; JS sets an exact grid-row span per item */
    grid-auto-flow: dense; /* fills gaps left by shorter neighbors instead of leaving blank space */
    align-items: start;
    width: 100%;
    background: var(--color-black);
    border-top: 5px solid var(--color-black);
    gap: 5px; /* Consistent spacing regardless of how aspect ratios interleave */
    box-sizing: border-box;
  }

  &.has-no-qa-no-bio {
    padding-bottom: 0;

    .reels-container {
      padding-bottom: 58px;
    }
  }

  .story-content {
    padding-top: 80px;
    background-color: var(--color-black);
    position: relative;
    z-index: 20;
  }
  .reel {
    /* grid-column and grid-row spans are set inline per-item in reelGridStyle() */
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }


.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: var(--window-height);
  color: var(--color-white);
  text-align: center;
}

.back-link {
  margin-top: 1rem;
  color: var(--color-yellow);
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}

.qa-header {
    font-size: 1.5rem;
    font-weight: 700;

    color: var(--color-white);
    margin: 0 auto 4rem;


    padding: 0 2rem;
    max-width: 800px;

    font-family: "PS260", sans-serif;
    font-weight: normal;
  }

  .bio-block {
    margin-top: 5rem;
  }

  @include gt-cinema {
    .reels-container {
      margin-top: 445px;
    }
    /* No need to specify height for reels as the aspect ratio handles it */
  }
@include lt-tablet {
  .reels-container {
    margin-top: 250px;
  }
}

@include lt-phone {
  /* Single-column layout on mobile is handled by isMobileLayout in reelGridStyle() */
}

}
</style>