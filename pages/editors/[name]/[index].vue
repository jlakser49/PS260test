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
      <div v-if="data" class="reels-container">
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
          :style="reelAspectStyle(media)"
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
const CASS_STICKY_REEL_ID = '160'; // ← CASSANDRA JOLIE HERO/BANNER REEL ID

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

const reelAspectStyle = (media) => {
  const w = parseInt(media.media_width || 0);
  const h = parseInt(media.media_height || 0);
  if (h > w && w > 0) {
    return { aspectRatio: `${w}/${h}`, height: 'auto', paddingBottom: '0' };
  }
  return {};
};

const reelAspectClass = (media) => {
  const w = parseInt(media.media_width || 0);
  const h = parseInt(media.media_height || 0);
  return h > w && w > 0 ? 'portrait' : '';
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
});

onBeforeUnmount(() => {
  if (videoObserver) {
    videoObserver.disconnect();
  }

  if (process.client) {
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
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    background: var(--color-black);
    border-top: 5px solid var(--color-black);
    gap: 0; /* No gap, we're using margins on children */
    box-sizing: border-box;
    justify-content: space-between; /* Distribute items with space between */
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
    position: relative;
    width: calc(50% - 2.5px); /* Adjust width to account for the horizontal gap */
    /* Use aspect ratio instead of fixed heights */
    height: 0;
    padding-bottom: 28.125%; /* 16:9 aspect ratio (9/16 = 0.5625 * 50% = 28.125%) */
    overflow: hidden;
    box-sizing: border-box;
    transition: all 0.4s var(--easing-motion);
    margin-bottom: 5px; /* Exactly 5px vertical spacing between reels */

    &:nth-child(odd) {
      margin-right: 2.5px; /* Horizontal spacing between odd and even */
    }

    &:nth-child(even) {
      margin-left: 2.5px; /* Horizontal spacing between odd and even */
    }
  }

  .reel.portrait {
    width: calc(33.333% - 3.334px);

    &:nth-child(odd), &:nth-child(even) {
      margin-left: 0;
      margin-right: 0;
    }

    &:not(:nth-child(3n)) {
      margin-right: 5px;
    }
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
  .reels-container {
    flex-direction: column;
  }
  .reel {
    width: 100%; /* Full width on mobile */
    padding-bottom: 56.25%; /* 16:9 aspect ratio (9/16 = 0.5625 = 56.25%) */
    margin-bottom: 5px; /* Keep consistent 5px vertical spacing */

    /* Reset the horizontal margins since we're in a column */
    &:nth-child(odd), &:nth-child(even) {
      margin-left: 0;
      margin-right: 0;
    }
  }

  .reel.portrait {
    width: 100%;

    &:not(:nth-child(3n)) {
      margin-right: 0;
    }
  }
}

}
</style>