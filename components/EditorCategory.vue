<!-- components/EditorCategory.vue -->
<template>
  <div class="category">
    <h2 v-if="showTitle">{{ blok.name }}</h2>
    <GalleryList
      :items="galleryItems"
      :loading="pending"
    />
  </div>
</template>

<script setup>
// ─────────────────────────────────────────────────────────────────────────────
// CASSANDRA JOLIE — offline entry injected after "Ed Greene"
// CASS_HOVER_REEL_ID  → dedicated hover/preview reel (enter ID to override)
// CASS_MAIN_REEL_ID   → fallback: first video from main reel used when no override
// ─────────────────────────────────────────────────────────────────────────────
const CASS_HOVER_REEL_ID = '164'; // ← ENTER CASSANDRA JOLIE HOVER REEL ID HERE (optional override)
const CASS_MAIN_REEL_ID  = '163'; // ← CASSANDRA JOLIE MAIN REEL ID (fallback for hover)

const props = defineProps({
  blok: {
    type: Object,
    required: true
  }
});

// Use async data for fetching
const { data: personsWithReels, pending, error } = await useAsyncData(
  `category-${props.blok.name}`, // unique key
  async () => {
    return Promise.all(
      props.blok.Person.map(async (person) => {
        const hoverSimianReelId = person.HoverSimianReelID || person.SimianReelID;

        if (hoverSimianReelId) {
          try {
            // console.log(`[SIMIAN] Fetching reel for ${person.Name}, ID: ${hoverSimianReelId}, Cache Key: simian:${hoverSimianReelId}`);
            const startTime = Date.now();
            const reelData = await $fetch('/api/simian', {
              method: 'POST',
              body: {
                reelId: hoverSimianReelId
              }
            });
            const fetchTime = Date.now() - startTime;
            // console.log(`[SIMIAN] Full Response for ${person.Name} (${fetchTime}ms):`, JSON.stringify(reelData, null, 2));
            return {
              ...person,
              reelData
            };
          } catch (error) {
            console.error(`Error fetching reel for editor ${person.Name}:`, error);
            return person;
          }
        }
        return person;
      })
    );
  },
  {
    watch: [() => props.blok], // Re-run when blok changes
    default: () => [], // Default empty array while loading
    transform: (data) => data.map(person => {
      // Handle both array and object case for media
      let firstReel = {};
      let singleMedia = null;
      
      // Handle single media object (non-array)
      if (person.reelData?.root?.media && !Array.isArray(person.reelData.root.media)) {
        singleMedia = person.reelData.root.media;
        // console.log(`Found single media object for ${person.Name}:`, singleMedia);
      } else {
        // Handle array of media items
        firstReel = person.reelData?.root?.media?.[0] || {};
      }
      
      // console.log(`Media for ${person.Name}:`, singleMedia || firstReel);
      
      return {
        ...person,
        firstReel,
        singleMedia,
        processedData: {
          title: person.Name,
          to: `/editors/${person.Name.toLowerCase().replace(/\s+/g, '-')}`,
          media_file: singleMedia?.media_file || firstReel?.media_file || "",
          thumbnail: singleMedia?.thumbnail || firstReel?.thumbnail || ""
        }
      };
    })
  }
);

// Fetch Cassandra Jolie's hover reel — uses override ID if set, otherwise falls back to main reel
const { data: cassHoverData } = await useAsyncData(
  'cass-jolie-hover',
  async () => {
    const reelId = CASS_HOVER_REEL_ID || CASS_MAIN_REEL_ID;
    if (!reelId) return null;
    try {
      return await $fetch('/api/simian', {
        method: 'POST',
        body: { reelId }
      });
    } catch (err) {
      console.error('Error fetching Cassandra Jolie hover reel:', err);
      return null;
    }
  }
);

// Build the static Cassandra Jolie gallery entry
const cassEntry = computed(() => {
  const media = cassHoverData.value?.root?.media;
  const first  = Array.isArray(media) ? media[0] : (media ?? {});
  return {
    title:      'Cassandra Jolie',
    to:         '/editors/cassandra-jolie',
    media_file: first?.media_file ?? '',
    thumbnail:  first?.thumbnail  ?? ''
  };
});

// Computed properties
const showTitle = computed(() =>
  props.blok.name.toLowerCase() !== 'editors'
);

const galleryItems = computed(() => {
  if (!personsWithReels.value) return [];
  const items = personsWithReels.value.map(person => person.processedData);

  // Inject Cassandra Jolie after Ed Greene — only in the category that contains him
  const edGreeneIndex = items.findIndex(
    item => item.title.toLowerCase() === 'ed greene'
  );
  if (edGreeneIndex < 0) return items;
  return [...items.slice(0, edGreeneIndex + 1), cassEntry.value, ...items.slice(edGreeneIndex + 1)];
});

// Error handling
watch(error, (newError) => {
  if (newError) {
    console.error(`Error in category ${props.blok.name}:`, newError);
  }
});
</script>

<style lang="scss" scoped>
.category {
  margin-top: 120px;

  &:last-child {
    margin-bottom: 25vh;
  }

  h2 {
    color: var(--color-blue);
    text-align: center;
    font-size: 17px;
    position: relative;
    z-index: 20;
    text-transform: uppercase;
  }

  @include lt-phone {
    h2 {
      font-size: 16px;
    }
  }

}
</style>